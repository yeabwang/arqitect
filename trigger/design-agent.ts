import { logger, task } from "@trigger.dev/sdk";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { createRequesty } from "@requesty/ai-sdk";
import { generateText, hasToolCall, stepCountIs, tool } from "ai";
import { z } from "zod";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  EDGE_STROKE_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";
import {
  ALLOWED_COLOR_FILLS,
  ALLOWED_SHAPES,
  DESIGN_SYSTEM_PROMPT,
  resolveColor,
  resolveSize,
} from "@/lib/design-agent/schema";
import type { AiPresenceEvent, AiStatusEvent } from "@/liveblocks.config";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

const DEFAULT_REQUESTY_MODEL = "google/gemini-2.5-flash";
const PRESENCE_HOLD_MS = 250;
const MAX_STEPS = 40;

const ARROW_MARKER = {
  type: "arrowclosed" as const,
  width: 18,
  height: 18,
  color: EDGE_STROKE_COLOR,
};

function getLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required for the design agent");
  }
  return new Liveblocks({ secret });
}

function getDesignModel() {
  const apiKey = process.env.REQUESTY_API_KEY;
  if (!apiKey) {
    throw new Error("REQUESTY_API_KEY is required for the design agent");
  }
  const modelId =
    process.env.REQUESTY_DESIGN_MODEL?.trim() || DEFAULT_REQUESTY_MODEL;
  const provider = createRequesty({ apiKey });
  return provider(modelId);
}

async function broadcastStatus(
  client: Liveblocks,
  roomId: string,
  event: AiStatusEvent,
): Promise<void> {
  try {
    await client.broadcastEvent(roomId, event);
  } catch (err) {
    logger.warn("failed to broadcast ai:status", {
      error: (err as Error).message,
    });
  }
}

async function broadcastPresence(
  client: Liveblocks,
  roomId: string,
  event: AiPresenceEvent,
): Promise<void> {
  try {
    await client.broadcastEvent(roomId, event);
  } catch (err) {
    logger.warn("failed to broadcast ai:presence", {
      error: (err as Error).message,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const positionSchema = z
  .object({ x: z.number(), y: z.number() })
  .describe("Canvas coordinates of the node's top-left corner.");

const sizeSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .describe("Node footprint in pixels.");

const colorFillSchema = z
  .enum(ALLOWED_COLOR_FILLS as unknown as [string, ...string[]])
  .describe("Exact hex fill from the canvas color palette.");

const shapeSchema = z
  .enum(ALLOWED_SHAPES)
  .describe(
    "One of: rectangle, diamond, circle, pill, cylinder, hexagon.",
  );

interface AgentRunContext {
  liveblocks: Liveblocks;
  roomId: string;
  runId: string;
  nodeCenters: Map<string, { x: number; y: number }>;
  applied: number;
  skipped: number;
  finalSummary: string;
}

function buildToolset(state: AgentRunContext) {
  const { liveblocks, roomId, runId, nodeCenters } = state;

  const moveCursorTo = async (
    cursor: { x: number; y: number } | null,
  ): Promise<void> => {
    if (!cursor) {
      return;
    }
    await broadcastPresence(liveblocks, roomId, {
      type: "ai:presence",
      runId,
      cursor,
      thinking: true,
    });
    await sleep(PRESENCE_HOLD_MS);
  };

  return {
    addNode: tool({
      description:
        "Add a new node to the canvas. Use this before connecting it with edges.",
      inputSchema: z.object({
        id: z
          .string()
          .min(1)
          .describe("kebab-case unique id (e.g. 'web-frontend')."),
        shape: shapeSchema,
        label: z.string().default("").describe("Visible label on the node."),
        colorFill: colorFillSchema.optional(),
        position: positionSchema.optional(),
        size: sizeSchema.optional(),
      }),
      execute: async ({ id, shape, label, colorFill, position, size }) => {
        const resolvedSize = resolveSize(shape, size);
        const resolvedPosition = position ?? { x: 0, y: 0 };
        const color = resolveColor(colorFill);
        const node: CanvasNode = {
          id,
          type: CANVAS_NODE_TYPE,
          position: resolvedPosition,
          style: { width: resolvedSize.width, height: resolvedSize.height },
          data: { label, color, shape },
        };
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.addNode(node);
          },
        );
        const center = {
          x: resolvedPosition.x + resolvedSize.width / 2,
          y: resolvedPosition.y + resolvedSize.height / 2,
        };
        nodeCenters.set(id, center);
        state.applied += 1;
        await moveCursorTo(center);
        return `Added node "${id}" (${shape}).`;
      },
    }),

    moveNode: tool({
      description: "Move an existing node to a new position.",
      inputSchema: z.object({
        id: z.string().min(1),
        position: positionSchema,
      }),
      execute: async ({ id, position }) => {
        const existing = await readCurrentNode(liveblocks, roomId, id);
        if (!existing) {
          state.skipped += 1;
          return `Skipped moveNode: node "${id}" not found.`;
        }
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.updateNode(id, { position });
          },
        );
        const width =
          (existing.style && Number(existing.style.width)) ||
          existing.measured?.width ||
          180;
        const height =
          (existing.style && Number(existing.style.height)) ||
          existing.measured?.height ||
          80;
        const center = {
          x: position.x + width / 2,
          y: position.y + height / 2,
        };
        nodeCenters.set(id, center);
        state.applied += 1;
        await moveCursorTo(center);
        return `Moved node "${id}".`;
      },
    }),

    resizeNode: tool({
      description: "Resize an existing node.",
      inputSchema: z.object({
        id: z.string().min(1),
        size: sizeSchema,
      }),
      execute: async ({ id, size }) => {
        const existing = await readCurrentNode(liveblocks, roomId, id);
        if (!existing) {
          state.skipped += 1;
          return `Skipped resizeNode: node "${id}" not found.`;
        }
        const resolved = resolveSize(existing.data.shape, size);
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.updateNode(id, {
              style: {
                ...(existing.style ?? {}),
                width: resolved.width,
                height: resolved.height,
              },
            });
          },
        );
        const center = {
          x: existing.position.x + resolved.width / 2,
          y: existing.position.y + resolved.height / 2,
        };
        nodeCenters.set(id, center);
        state.applied += 1;
        await moveCursorTo(center);
        return `Resized node "${id}" to ${resolved.width}x${resolved.height}.`;
      },
    }),

    updateNodeData: tool({
      description:
        "Update an existing node's label and/or color. At least one field is required.",
      inputSchema: z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        colorFill: colorFillSchema.optional(),
      }),
      execute: async ({ id, label, colorFill }) => {
        const existing = await readCurrentNode(liveblocks, roomId, id);
        if (!existing) {
          state.skipped += 1;
          return `Skipped updateNodeData: node "${id}" not found.`;
        }
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.updateNodeData(id, (data) => ({
              ...data,
              ...(label !== undefined ? { label } : {}),
              ...(colorFill !== undefined
                ? { color: resolveColor(colorFill) }
                : {}),
            }));
          },
        );
        state.applied += 1;
        await moveCursorTo(nodeCenters.get(id) ?? null);
        return `Updated data on node "${id}".`;
      },
    }),

    deleteNode: tool({
      description:
        "Delete a node by id. Connected edges should be removed separately if needed.",
      inputSchema: z.object({ id: z.string().min(1) }),
      execute: async ({ id }) => {
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.removeNode(id);
          },
        );
        nodeCenters.delete(id);
        state.applied += 1;
        return `Deleted node "${id}".`;
      },
    }),

    addEdge: tool({
      description: "Add an arrow edge connecting two existing nodes.",
      inputSchema: z.object({
        id: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
        label: z.string().optional(),
      }),
      execute: async ({ id, source, target, label }) => {
        const edge: CanvasEdge = {
          id,
          type: CANVAS_EDGE_TYPE,
          source,
          target,
          markerEnd: ARROW_MARKER,
          data: label ? { label } : {},
        };
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.addEdge(edge);
          },
        );
        const sourceCenter = nodeCenters.get(source);
        const targetCenter = nodeCenters.get(target);
        const center =
          sourceCenter && targetCenter
            ? {
                x: (sourceCenter.x + targetCenter.x) / 2,
                y: (sourceCenter.y + targetCenter.y) / 2,
              }
            : sourceCenter ?? targetCenter ?? null;
        state.applied += 1;
        await moveCursorTo(center);
        return `Added edge "${id}" from "${source}" to "${target}".`;
      },
    }),

    deleteEdge: tool({
      description: "Delete an edge by id.",
      inputSchema: z.object({ id: z.string().min(1) }),
      execute: async ({ id }) => {
        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            flow.removeEdge(id);
          },
        );
        state.applied += 1;
        return `Deleted edge "${id}".`;
      },
    }),

    finishDesign: tool({
      description:
        "Call this exactly once when the design is complete. Provide a one-sentence summary of the architecture you built.",
      inputSchema: z.object({
        summary: z.string().min(1),
      }),
      execute: async ({ summary }) => {
        state.finalSummary = summary;
        return `Design complete: ${summary}`;
      },
    }),
  } as const;
}

async function readCurrentNode(
  liveblocks: Liveblocks,
  roomId: string,
  nodeId: string,
): Promise<CanvasNode | null> {
  let snapshot: CanvasNode | null = null;
  await mutateFlow<CanvasNode, CanvasEdge>(
    { client: liveblocks, roomId },
    (flow) => {
      snapshot = flow.getNode(nodeId) ?? null;
    },
  );
  return snapshot;
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const runId = ctx.run.id;
    const { prompt, roomId } = payload;

    logger.log("design-agent invoked", { runId, roomId });

    const liveblocks = getLiveblocksClient();

    try {
      await liveblocks.getOrCreateRoom(roomId, {
        defaultAccesses: [],
        metadata: { projectId: roomId },
      });
    } catch (err) {
      logger.warn("getOrCreateRoom failed", {
        error: (err as Error).message,
      });
    }

    await broadcastStatus(liveblocks, roomId, {
      type: "ai:status",
      runId,
      phase: "starting",
      message: "Ghost AI is reading your prompt...",
    });
    await broadcastPresence(liveblocks, roomId, {
      type: "ai:presence",
      runId,
      cursor: null,
      thinking: true,
    });

    const state: AgentRunContext = {
      liveblocks,
      roomId,
      runId,
      nodeCenters: new Map(),
      applied: 0,
      skipped: 0,
      finalSummary: "",
    };

    try {
      await broadcastStatus(liveblocks, roomId, {
        type: "ai:status",
        runId,
        phase: "thinking",
        message: "Designing the architecture...",
      });

      const model = getDesignModel();
      const tools = buildToolset(state);

      let appliedAtLastStep = 0;
      const result = await generateText({
        model,
        tools,
        system: DESIGN_SYSTEM_PROMPT,
        prompt,
        temperature: 0.4,
        stopWhen: [stepCountIs(MAX_STEPS), hasToolCall("finishDesign")],
        onStepFinish: async (step) => {
          if (state.applied !== appliedAtLastStep) {
            appliedAtLastStep = state.applied;
            await broadcastStatus(liveblocks, roomId, {
              type: "ai:status",
              runId,
              phase: "applying",
              message: `Applied ${state.applied} change${
                state.applied === 1 ? "" : "s"
              }...`,
            });
          }
          if (step.finishReason === "error") {
            logger.warn("step finished with error", {
              text: step.text,
            });
          }
        },
      });

      const summary =
        state.finalSummary.trim() ||
        result.text.trim() ||
        `Applied ${state.applied} change${state.applied === 1 ? "" : "s"}.`;

      logger.log("design generation complete", {
        applied: state.applied,
        skipped: state.skipped,
        steps: result.steps.length,
      });

      await broadcastStatus(liveblocks, roomId, {
        type: "ai:status",
        runId,
        phase: "complete",
        message:
          state.skipped > 0
            ? `${summary} (${state.applied} applied, ${state.skipped} skipped)`
            : summary,
      });

      return {
        summary,
        applied: state.applied,
        skipped: state.skipped,
        steps: result.steps.length,
      };
    } catch (err) {
      const message = (err as Error).message ?? "Generation failed";
      logger.error("design agent failed", { message });
      await broadcastStatus(liveblocks, roomId, {
        type: "ai:status",
        runId,
        phase: "error",
        message: "Ghost AI hit an error while designing the canvas.",
      });
      throw err;
    } finally {
      await broadcastPresence(liveblocks, roomId, {
        type: "ai:presence",
        runId,
        cursor: null,
        thinking: false,
      });
    }
  },
});
