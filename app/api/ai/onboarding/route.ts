import { type NextRequest } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import {
  buildSummarySystemPrompt,
  buildTurnSystemPrompt,
  getOnboardingConfig,
  getOnboardingModel,
} from "@/lib/onboarding-agent";

/**
 * Conversational onboarding agent. Acts like a senior architect: given the
 * design name and a free-text brief, it asks one sharp follow-up at a time
 * (`mode: "turn"`), then turns the whole exchange into an implementation-ready
 * architecture brief (`mode: "summary"`). Stateless — the client sends the full
 * transcript each call. Project creation happens only after the user approves.
 *
 * The architect persona, coverage playbook, model id, and tunable limits all
 * live in `lib/onboarding-agent.ts` / the environment — this route is wiring.
 */

const turnResultSchema = z.object({
  done: z
    .boolean()
    .describe("true once enough is known to draft a first architecture"),
  recommendation: z
    .string()
    .describe(
      "brief first-person recommendation/observation that guides the builder; empty string when none",
    ),
  question: z
    .string()
    .describe("the single next question to ask; empty string when done"),
  options: z
    .array(z.string())
    .describe(
      "2-4 short feasible choices for a bounded decision; empty array when open-ended",
    ),
  multiSelect: z
    .boolean()
    .describe(
      "true when the builder may legitimately pick more than one option; false for single-pick or open-ended",
    ),
  rationale: z
    .string()
    .describe("one short clause on why this matters; empty string when done"),
});

const summaryResultSchema = z.object({
  summary: z
    .string()
    .describe(
      "implementation-ready architecture brief, structured with short labelled sections",
    ),
  openQuestions: z
    .array(z.string())
    .describe("material unknowns that were not resolved in the conversation"),
});

const TURN_JSON_CONTRACT = `\n\nRespond with ONLY a single JSON object — no markdown, no code fences, no commentary — with exactly these keys: {"done": boolean, "recommendation": string, "question": string, "options": string[], "multiSelect": boolean, "rationale": string}. Use empty string "" or empty array [] where a field does not apply; set multiSelect to false when it does not apply.`;

const SUMMARY_JSON_CONTRACT = `\n\nRespond with ONLY a single JSON object — no markdown, no code fences, no commentary — with exactly these keys: {"summary": string, "openQuestions": string[]}.`;

// Models reached through generateText return a string; pull the JSON object out
// of it even if the model wraps it in prose or a ```json fence.
function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("no JSON object in model output");
  }
  return JSON.parse(body.slice(start, end + 1));
}

function renderContext(
  name: string,
  description: string,
  transcript: { question: string; answer: string }[],
): string {
  const lines: string[] = [];
  if (name.trim()) lines.push(`Design name: ${name.trim()}`);
  lines.push(`What they are building:\n${description.trim()}`);
  if (transcript.length > 0) {
    lines.push("Conversation so far:");
    transcript.forEach((entry, index) => {
      lines.push(
        `Q${index + 1}: ${entry.question}\nA${index + 1}: ${
          entry.answer.trim() || "(skipped)"
        }`,
      );
    });
  }
  return lines.join("\n\n");
}

export async function POST(request: NextRequest) {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const config = getOnboardingConfig();

  const requestSchema = z.object({
    mode: z.enum(["turn", "summary"]),
    name: z.string().max(200).optional().default(""),
    description: z.string().max(config.maxFieldChars),
    transcript: z
      .array(
        z.object({
          question: z.string().max(500),
          answer: z.string().max(config.maxFieldChars),
        }),
      )
      .max(config.maxTranscript)
      .default([]),
  });

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response("Invalid request payload", { status: 400 });
  }
  const { mode, name, description, transcript } = parsed.data;
  if (description.trim().length === 0) {
    return new Response("A description is required", { status: 400 });
  }

  const context = renderContext(name, description, transcript);

  try {
    const model = getOnboardingModel();

    if (mode === "turn") {
      const { text } = await generateText({
        model,
        system: buildTurnSystemPrompt() + TURN_JSON_CONTRACT,
        prompt: `${context}\n\nQuestions asked so far: ${transcript.length}.\nDecide the single most valuable next question that moves toward a draftable architecture, or set done=true if you already have enough to draft one.`,
        temperature: config.turnTemperature,
      });
      const object = turnResultSchema.parse(extractJson(text));
      // Agent owns convergence; maxTranscript is only a runaway-loop backstop.
      const done = object.done || transcript.length >= config.maxTranscript;
      const options = done
        ? []
        : object.options.map((o) => o.trim()).filter((o) => o.length > 0);
      return Response.json({
        done,
        recommendation: done ? "" : object.recommendation.trim(),
        question: done ? "" : object.question.trim(),
        options,
        multiSelect: options.length > 0 ? object.multiSelect : false,
        rationale: done ? "" : object.rationale.trim(),
      });
    }

    const { text } = await generateText({
      model,
      system: buildSummarySystemPrompt() + SUMMARY_JSON_CONTRACT,
      prompt: `${context}\n\nWrite the architecture brief now.`,
      temperature: config.summaryTemperature,
    });
    const object = summaryResultSchema.parse(extractJson(text));
    return Response.json({
      summary: object.summary.trim(),
      openQuestions: object.openQuestions
        .map((q) => q.trim())
        .filter((q) => q.length > 0),
    });
  } catch (error) {
    console.error("onboarding agent failed", (error as Error).message);
    return new Response("Onboarding agent error", { status: 502 });
  }
}
