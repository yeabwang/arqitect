import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import getPrisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
  const prisma = await getPrisma();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  if (project.ownerId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const name = body.name;

  if (!name || typeof name !== "string") {
    return new Response("Name is required", { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name },
    include: {
      collaborators: { select: { id: true, email: true } },
    },
  });

  return Response.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    status: updated.status,
    canvasJsonPath: updated.canvasJsonPath,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    isOwner: true,
    collaborators: updated.collaborators,
  });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
  const prisma = await getPrisma();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  if (project.ownerId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return new Response(null, { status: 204 });
}
