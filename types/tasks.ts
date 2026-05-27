import { z } from "zod";

export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";

export const AI_STATUS_KINDS = ["design", "spec"] as const;
export const AI_STATUS_PHASES = [
  "starting",
  "thinking",
  "applying",
  "complete",
  "error",
] as const;

export type AiStatusKind = (typeof AI_STATUS_KINDS)[number];
export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number];

export const AI_STATUS_ACTIVE_PHASES: ReadonlyArray<AiStatusPhase> = [
  "starting",
  "thinking",
  "applying",
];

export const aiStatusFeedPayloadSchema = z.object({
  kind: z.enum(AI_STATUS_KINDS),
  phase: z.enum(AI_STATUS_PHASES),
  runId: z.string().min(1),
  text: z.string().optional(),
});

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>;

export function parseAiStatusFeedPayload(
  input: unknown,
): AiStatusFeedPayload | null {
  const result = aiStatusFeedPayloadSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function isActiveAiStatusPhase(phase: AiStatusPhase): boolean {
  return AI_STATUS_ACTIVE_PHASES.includes(phase);
}

export const AI_CHAT_ROLES = ["user", "assistant"] as const;
export type AiChatRole = (typeof AI_CHAT_ROLES)[number];

export const AI_ASSISTANT_SENDER_ID = "ghost-ai";
export const AI_ASSISTANT_SENDER_NAME = "Ghost AI";

export const aiChatMessagePayloadSchema = z.object({
  kind: z.literal("chat"),
  role: z.enum(AI_CHAT_ROLES),
  senderId: z.string().min(1),
  senderName: z.string().min(1),
  senderAvatarUrl: z.string().url().optional(),
  content: z.string().min(1).max(4000),
  timestamp: z.number().int().positive(),
  runId: z.string().min(1).optional(),
  isError: z.boolean().optional(),
});

export type AiChatMessagePayload = z.infer<typeof aiChatMessagePayloadSchema>;

export function parseAiChatMessagePayload(
  input: unknown,
): AiChatMessagePayload | null {
  const result = aiChatMessagePayloadSchema.safeParse(input);
  return result.success ? result.data : null;
}

export type AiFeedPayload = AiStatusFeedPayload | AiChatMessagePayload;
