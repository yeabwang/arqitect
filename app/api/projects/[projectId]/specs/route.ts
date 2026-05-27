import { type NextRequest } from "next/server";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/specs">,
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
  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  const items = specs.map((spec) => ({
    id: spec.id,
    createdAt: spec.createdAt.toISOString(),
    filename: `${spec.id}.md`,
  }));

  return Response.json({ specs: items });
}
