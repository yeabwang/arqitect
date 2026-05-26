import { type NextRequest } from "next/server";
import { head, put } from "@vercel/blob";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";

interface CanvasPayload {
  nodes: unknown;
  edges: unknown;
}

function isCanvasPayload(value: unknown): value is CanvasPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return Array.isArray(record.nodes) && Array.isArray(record.edges);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">,
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

  if (!isCanvasPayload(body)) {
    return new Response("Invalid canvas payload", { status: 400 });
  }

  const json = JSON.stringify(body);
  const blob = await put(`canvas/${projectId}.json`, json, {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
  });

  const prisma = await getPrisma();
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">,
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

  if (!project.canvasJsonPath) {
    return Response.json({ nodes: [], edges: [] });
  }

  // Private blob store: head() returns a signed downloadUrl usable for fetch.
  const metadata = await head(project.canvasJsonPath);
  const response = await fetch(metadata.downloadUrl, { cache: "no-store" });
  if (!response.ok) {
    return new Response("Failed to load canvas", { status: 502 });
  }

  const data = (await response.json()) as unknown;
  if (!isCanvasPayload(data)) {
    return Response.json({ nodes: [], edges: [] });
  }

  return Response.json(data);
}
