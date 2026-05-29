import { z } from "zod";

/**
 * Guided-start onboarding contract (spec 01).
 *
 * The start-design dialog, the pending-generation API, and the editor review
 * surface all share these shapes so the interview a user fills in maps cleanly
 * onto the structured input the design generation task will consume in spec 03.
 */

export const GENERATION_MODES = ["blank", "template", "prompt"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

/**
 * Interview field keys, ordered for the guided wizard. `systemGoal` is the only
 * required field; the rest are recommended and recorded as open questions when
 * left empty.
 */
export const INTERVIEW_FIELDS = [
  "systemGoal",
  "primaryUsers",
  "criticalFlows",
  "dataStores",
  "integrations",
  "runtimeContext",
  "scaleExpectations",
  "constraints",
] as const;

export type InterviewField = (typeof INTERVIEW_FIELDS)[number];

export interface InterviewFieldMeta {
  key: InterviewField;
  /** Short label used in the review surface and open-question lines. */
  label: string;
  /** Conversational prompt shown one-at-a-time in the wizard. */
  question: string;
  /** Field-level hint under the input. */
  hint: string;
  /** Input placeholder. */
  placeholder: string;
  required: boolean;
  /** Open-question phrasing recorded when a recommended field is left empty. */
  openQuestion: string;
  multiline: boolean;
}

export const INTERVIEW_FIELD_META: Record<InterviewField, InterviewFieldMeta> = {
  systemGoal: {
    key: "systemGoal",
    label: "System goal",
    question: "In one sentence, what is this system for?",
    hint: "One sentence is enough. This anchors everything Arqitect drafts.",
    placeholder: "e.g. A billing service that issues and reconciles invoices.",
    required: true,
    openQuestion: "What is the system's primary goal?",
    multiline: false,
  },
  primaryUsers: {
    key: "primaryUsers",
    label: "Primary users",
    question: "Who uses this system?",
    hint: "The people or systems that interact with it directly.",
    placeholder: "e.g. Finance team, customer-facing checkout, internal admins.",
    required: false,
    openQuestion: "Who are the primary users of the system?",
    multiline: false,
  },
  criticalFlows: {
    key: "criticalFlows",
    label: "Critical flows",
    question: "What are the two or three core flows it has to support?",
    hint: "The paths the system exists to serve.",
    placeholder: "e.g. Create invoice, collect payment, reconcile ledger.",
    required: false,
    openQuestion: "What are the critical flows the system must support?",
    multiline: true,
  },
  dataStores: {
    key: "dataStores",
    label: "Expected data stores",
    question: "What has to be persisted?",
    hint: "The data this system is responsible for keeping.",
    placeholder: "e.g. Invoices, payments, customer ledger.",
    required: false,
    openQuestion: "What data stores does the system need?",
    multiline: false,
  },
  integrations: {
    key: "integrations",
    label: "External integrations",
    question: "What does this system talk to?",
    hint: "Third-party services, internal systems, or APIs it depends on.",
    placeholder: "e.g. Stripe, the accounting system, an email provider.",
    required: false,
    openQuestion: "What external integrations does the system depend on?",
    multiline: false,
  },
  runtimeContext: {
    key: "runtimeContext",
    label: "Runtime context",
    question: "Where does this run?",
    hint: "Web app, mobile backend, batch job, edge, something else.",
    placeholder: "e.g. A web service on Node, deployed to a managed platform.",
    required: false,
    openQuestion: "What is the runtime and deployment context?",
    multiline: false,
  },
  scaleExpectations: {
    key: "scaleExpectations",
    label: "Scale expectations",
    question: "Roughly what scale are you designing for?",
    hint: "A rough signal — prototype, team, product, or scale.",
    placeholder: "e.g. Product scale: a few thousand invoices a day.",
    required: false,
    openQuestion: "What are the scale expectations?",
    multiline: false,
  },
  constraints: {
    key: "constraints",
    label: "Known constraints",
    question: "Anything non-negotiable Arqitect should respect?",
    hint: "Compliance, latency, language/runtime, or existing infrastructure.",
    placeholder: "e.g. Must stay PCI-compliant; payments data can't leave the EU.",
    required: false,
    openQuestion: "Are there known constraints (compliance, latency, infra)?",
    multiline: true,
  },
};

/**
 * Field groupings for the goal-first guided prompt flow. Pure grouping over the
 * existing INTERVIEW_FIELDS — the per-field metadata, payload schema, and
 * deriveOpenQuestions are all unchanged. Step 1 holds the only required field.
 */
export const PROMPT_STEPS = [
  {
    id: "goal",
    title: "Goal",
    subtitle: "What you're designing",
    fields: ["systemGoal"],
  },
  {
    id: "people",
    title: "People & flows",
    subtitle: "Users and critical paths",
    fields: ["primaryUsers", "criticalFlows"],
  },
  {
    id: "data",
    title: "Data & integrations",
    subtitle: "What it stores and talks to",
    fields: ["dataStores", "integrations"],
  },
  {
    id: "ops",
    title: "Runtime, scale & limits",
    subtitle: "Where it runs and constraints",
    fields: ["runtimeContext", "scaleExpectations", "constraints"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  subtitle: string;
  fields: ReadonlyArray<InterviewField>;
}>;

export type PromptStep = (typeof PROMPT_STEPS)[number];

export type InterviewAnswers = Record<InterviewField, string>;

export function emptyInterviewAnswers(): InterviewAnswers {
  return INTERVIEW_FIELDS.reduce((acc, field) => {
    acc[field] = "";
    return acc;
  }, {} as InterviewAnswers);
}

const interviewAnswersSchema = z.object({
  systemGoal: z.string(),
  primaryUsers: z.string(),
  criticalFlows: z.string(),
  dataStores: z.string(),
  integrations: z.string(),
  runtimeContext: z.string(),
  scaleExpectations: z.string(),
  constraints: z.string(),
});

/**
 * Persisted shape stored in `PendingGeneration.payload`. Either a structured
 * interview submission or a skipped free-form prompt. Open questions are
 * recorded from empty recommended fields (or the whole field set when skipped)
 * so the resulting canvas can surface shallowness instead of hiding it.
 */
export const pendingGenerationPayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("interview"),
    answers: interviewAnswersSchema,
    openQuestions: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("free-form"),
    prompt: z.string().min(1).max(8000),
    openQuestions: z.array(z.string()),
  }),
]);

export type PendingGenerationPayload = z.infer<
  typeof pendingGenerationPayloadSchema
>;

export function parsePendingGenerationPayload(
  input: unknown,
): PendingGenerationPayload | null {
  const result = pendingGenerationPayloadSchema.safeParse(input);
  return result.success ? result.data : null;
}

/** Recommended fields left empty become recorded open questions. */
export function deriveOpenQuestions(answers: InterviewAnswers): string[] {
  return INTERVIEW_FIELDS.filter(
    (field) => !INTERVIEW_FIELD_META[field].required,
  )
    .filter((field) => answers[field].trim().length === 0)
    .map((field) => INTERVIEW_FIELD_META[field].openQuestion);
}
