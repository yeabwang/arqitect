import { type NextRequest } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignRequestBody {
  prompt: string;
  roomId: string;
  projectId: string;
}

function parseBody(value: unknown): DesignRequestBody | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.prompt !== "string" || !record.prompt.trim()) {
    return null;
  }
  if (typeof record.roomId !== "string" || !record.roomId.trim()) {
    return null;
  }
  if (typeof record.projectId !== "string" || !record.projectId.trim()) {
    return null;
  }
  return {
    prompt: record.prompt,
    roomId: record.roomId,
    projectId: record.projectId,
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

  const project = await getProjectWithAccess(body.projectId, identity);
  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt: body.prompt,
    roomId: body.roomId,
  });

  const prisma = await getPrisma();
  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: body.projectId,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id }, { status: 202 });
}
