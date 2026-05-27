import { logger, task } from "@trigger.dev/sdk";
import { Liveblocks, LiveblocksError } from "@liveblocks/node";
import { createRequesty } from "@requesty/ai-sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { z } from "zod";
import getPrisma from "@/lib/prisma";
import {
  AI_STATUS_FEED_ID,
  type AiStatusFeedPayload,
  type AiStatusPhase,
} from "@/types/tasks";

const DEFAULT_REQUESTY_MODEL = "google/gemini-2.5-flash";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    measured: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const generateSpecInputSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(200).default([]),
  nodes: z.array(canvasNodeSchema).max(500).default([]),
  edges: z.array(canvasEdgeSchema).max(1000).default([]),
});

export type GenerateSpecInput = z.infer<typeof generateSpecInputSchema>;

const SPEC_SYSTEM_PROMPT = `You are Ghost AI, a senior software architect. Generate a clean, well-structured Markdown technical specification from the provided system-design canvas (nodes and edges) and any chat context.

Requirements:
- Output ONLY GitHub-flavored Markdown. No code fences around the whole document. No preamble or trailing commentary.
- Start with a single H1 title that names the system.
- Include these sections in order, omitting any that have no relevant content:
  1. ## Overview — one paragraph describing what the system does.
  2. ## Components — bullet list with one entry per canvas node: bold the component name (use the node label), then a one or two sentence responsibility description inferred from its label, shape, and connections.
  3. ## Data Flow / Interactions — describe how components communicate, derived from edges. Use prose or a numbered list.
  4. ## Architectural Notes — key design decisions, trade-offs, or assumptions implied by the canvas and chat history.
  5. ## Open Questions — list anything ambiguous in the canvas or chat that would need clarification before implementation.
- Use semantic component names from node labels exactly. If a node has no label, refer to it by its shape and id.
- Do not invent components that are not on the canvas. Do not invent edges that do not exist.
- Keep the tone factual and concise. Avoid filler.`;

function getLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required for the spec generator");
  }
  return new Liveblocks({ secret });
}

function getSpecModel() {
  const apiKey = process.env.REQUESTY_API_KEY;
  if (!apiKey) {
    throw new Error("REQUESTY_API_KEY is required for the spec generator");
  }
  const modelId =
    process.env.REQUESTY_SPEC_MODEL?.trim() || DEFAULT_REQUESTY_MODEL;
  const provider = createRequesty({ apiKey });
  return provider(modelId);
}

async function ensureStatusFeed(
  client: Liveblocks,
  roomId: string,
): Promise<void> {
  try {
    await client.createFeed({ roomId, feedId: AI_STATUS_FEED_ID });
  } catch (err) {
    if (err instanceof LiveblocksError && err.status === 409) {
      return;
    }
    logger.warn("failed to ensure ai-status-feed", {
      error: (err as Error).message,
    });
  }
}

async function publishStatus(
  client: Liveblocks,
  roomId: string,
  runId: string,
  phase: AiStatusPhase,
  text: string,
): Promise<void> {
  const payload: AiStatusFeedPayload = {
    kind: "spec",
    phase,
    runId,
    text,
  };
  try {
    await client.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: payload,
    });
  } catch (err) {
    logger.warn("failed to publish ai-status-feed message", {
      error: (err as Error).message,
    });
  }
}

interface NodeSummary {
  id: string;
  label: string;
  shape: string;
}

function summarizeNode(node: z.infer<typeof canvasNodeSchema>): NodeSummary {
  const data = (node.data ?? {}) as Record<string, unknown>;
  const label = typeof data.label === "string" && data.label.trim()
    ? (data.label as string).trim()
    : "";
  const shape = typeof data.shape === "string" ? (data.shape as string) : "node";
  return { id: node.id, label, shape };
}

function buildUserPrompt(input: GenerateSpecInput): string {
  const nodes = input.nodes.map(summarizeNode);
  const nodeLines = nodes.length
    ? nodes
        .map(
          (n) =>
            `- id: ${n.id} | shape: ${n.shape} | label: ${
              n.label || "(no label)"
            }`,
        )
        .join("\n")
    : "(canvas has no nodes)";

  const edgeLines = input.edges.length
    ? input.edges
        .map((e) => {
          const dataLabel =
            e.data && typeof (e.data as Record<string, unknown>).label === "string"
              ? ` | label: ${(e.data as Record<string, unknown>).label as string}`
              : "";
          return `- ${e.source} -> ${e.target}${dataLabel}`;
        })
        .join("\n")
    : "(canvas has no edges)";

  const chatBlock = input.chatHistory.length
    ? input.chatHistory
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n")
    : "(no prior chat)";

  return `Canvas nodes:\n${nodeLines}\n\nCanvas edges:\n${edgeLines}\n\nChat context:\n${chatBlock}\n\nGenerate the Markdown technical specification now.`;
}

export const generateSpecTask = task({
  id: "generate-spec",
  maxDuration: 300,
  run: async (rawPayload: unknown, { ctx }) => {
    const runId = ctx.run.id;
    const parsed = generateSpecInputSchema.safeParse(rawPayload);
    if (!parsed.success) {
      logger.error("generate-spec invalid payload", {
        issues: parsed.error.issues,
      });
      throw new Error("Invalid generate-spec payload");
    }
    const payload = parsed.data;

    logger.log("generate-spec invoked", {
      runId,
      roomId: payload.roomId,
      nodes: payload.nodes.length,
      edges: payload.edges.length,
      chatHistory: payload.chatHistory.length,
    });

    const liveblocks = getLiveblocksClient();

    try {
      await liveblocks.getOrCreateRoom(payload.roomId, {
        defaultAccesses: [],
        metadata: { projectId: payload.projectId },
      });
    } catch (err) {
      logger.warn("getOrCreateRoom failed", {
        error: (err as Error).message,
      });
    }

    await ensureStatusFeed(liveblocks, payload.roomId);
    await publishStatus(
      liveblocks,
      payload.roomId,
      runId,
      "starting",
      "Ghost AI is reading your canvas...",
    );

    try {
      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "thinking",
        "Drafting technical specification...",
      );

      const model = getSpecModel();
      const userPrompt = buildUserPrompt(payload);

      const result = await generateText({
        model,
        system: SPEC_SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.3,
      });

      const spec = result.text.trim();
      if (!spec) {
        throw new Error("Spec generator returned empty output");
      }

      const prisma = await getPrisma();
      const specRecord = await prisma.projectSpec.create({
        data: {
          projectId: payload.projectId,
          filePath: "",
        },
      });

      const blob = await put(
        `specs/${payload.projectId}/${specRecord.id}.md`,
        spec,
        {
          access: "private",
          contentType: "text/markdown; charset=utf-8",
          allowOverwrite: true,
          addRandomSuffix: false,
        },
      );

      const persisted = await prisma.projectSpec.update({
        where: { id: specRecord.id },
        data: { filePath: blob.url },
      });

      logger.log("generate-spec complete", {
        runId,
        length: spec.length,
        specId: persisted.id,
      });

      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "complete",
        "Specification ready.",
      );

      return {
        spec,
        specId: persisted.id,
        projectId: payload.projectId,
        roomId: payload.roomId,
      };
    } catch (err) {
      const message = (err as Error).message ?? "Spec generation failed";
      logger.error("generate-spec failed", { message });
      await publishStatus(
        liveblocks,
        payload.roomId,
        runId,
        "error",
        "Ghost AI hit an error while drafting the spec.",
      );
      throw err;
    }
  },
});
