import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";

interface CollaboratorRouteContext {
  params: Promise<{ projectId: string; collaboratorId: string }>;
}

export async function DELETE(
  request: Request,
  ctx: CollaboratorRouteContext
) {
  void request;

  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId, collaboratorId } = await ctx.params;
  const prisma = await getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  if (project.ownerId !== identity.userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const deleted = await prisma.projectCollaborator.deleteMany({
    where: {
      id: collaboratorId,
      projectId,
    },
  });

  if (deleted.count === 0) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}
