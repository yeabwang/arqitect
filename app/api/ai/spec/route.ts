import { type NextRequest } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import type { generateSpecTask } from "@/trigger/generate-spec";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SpecRequestBody {
  roomId: string;
  chatHistory: ChatMessage[];
  nodes: unknown[];
  edges: unknown[];
}

function parseChatHistory(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) return null;
  const result: ChatMessage[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      return null;
    }
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || !content.trim()) return null;
    result.push({ role, content });
  }
  return result;
}

function parseBody(value: unknown): SpecRequestBody | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.roomId !== "string" || !record.roomId.trim()) {
    return null;
  }
  if (!Array.isArray(record.nodes) || !Array.isArray(record.edges)) {
    return null;
  }
  const chatHistory = parseChatHistory(record.chatHistory ?? []);
  if (chatHistory === null) {
    return null;
  }
  return {
    roomId: record.roomId,
    chatHistory,
    nodes: record.nodes,
    edges: record.edges,
  };
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

  const body = parseBody(raw);
  if (!body) {
    return new Response("Invalid request payload", { status: 400 });
  }

  // Resolve project from roomId — never trust a client-supplied projectId.
  const project = await getProjectWithAccess(body.roomId, identity);
  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
    projectId: project.id,
    roomId: body.roomId,
    chatHistory: body.chatHistory,
    nodes: body.nodes,
    edges: body.edges,
  });

  const prisma = await getPrisma();
  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id }, { status: 202 });
}
