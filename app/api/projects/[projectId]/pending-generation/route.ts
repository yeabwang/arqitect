import { type NextRequest } from "next/server";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import {
  parsePendingGenerationPayload,
  type PendingGenerationPayload,
} from "@/types/onboarding";

const EXPIRY_MS = 24 * 60 * 60 * 1000;

function rawPromptFor(payload: PendingGenerationPayload): string | null {
  return payload.kind === "free-form" ? payload.prompt : null;
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/pending-generation">,
) {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const prisma = await getPrisma();
  const pending = await prisma.pendingGeneration.findUnique({
    where: { projectId },
  });

  if (!pending) {
    return Response.json({ pendingGeneration: null });
  }

  // Expired rows are treated as absent and cleaned up opportunistically.
  if (pending.expiresAt.getTime() <= Date.now()) {
    await prisma.pendingGeneration
      .delete({ where: { projectId } })
      .catch(() => {
        // Best-effort cleanup; a concurrent delete is fine.
      });
    return Response.json({ pendingGeneration: null });
  }

  const payload = parsePendingGenerationPayload(pending.payload);
  if (!payload) {
    return Response.json({ pendingGeneration: null });
  }

  return Response.json({
    pendingGeneration: {
      id: pending.id,
      payload,
      rawPrompt: pending.rawPrompt,
      createdAt: pending.createdAt.toISOString(),
      expiresAt: pending.expiresAt.toISOString(),
    },
  });
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/pending-generation">,
) {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return new Response("Invalid body", { status: 400 });
  }

  const payload = parsePendingGenerationPayload(
    (body as Record<string, unknown>).payload,
  );
  if (!payload) {
    return new Response("Invalid pending generation payload", { status: 400 });
  }

  const prisma = await getPrisma();
  const expiresAt = new Date(Date.now() + EXPIRY_MS);
  const rawPrompt = rawPromptFor(payload);

  // Replace any existing row — only happens if the user re-enters the dialog
  // before navigating to the editor.
  const pending = await prisma.pendingGeneration.upsert({
    where: { projectId },
    create: { projectId, payload, rawPrompt, expiresAt },
    update: { payload, rawPrompt, expiresAt, createdAt: new Date() },
  });

  return Response.json(
    { id: pending.id, expiresAt: pending.expiresAt.toISOString() },
    { status: 201 },
  );
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/pending-generation">,
) {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
  const project = await getProjectWithAccess(projectId, identity);
  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const prisma = await getPrisma();
  await prisma.pendingGeneration
    .delete({ where: { projectId } })
    .catch(() => {
      // Already cleared — treat as success.
    });

  return new Response(null, { status: 204 });
}
