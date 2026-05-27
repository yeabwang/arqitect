import { type NextRequest } from "next/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";

interface TokenRequestBody {
  runId: string;
}

function parseBody(value: unknown): TokenRequestBody | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.runId !== "string" || !record.runId.trim()) {
    return null;
  }
  return { runId: record.runId };
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

  const prisma = await getPrisma();
  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: body.runId },
  });

  if (!taskRun || taskRun.userId !== identity.userId) {
    return new Response("Not Found", { status: 404 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [body.runId],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
