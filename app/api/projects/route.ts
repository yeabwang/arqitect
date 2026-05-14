import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import getPrisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      collaborators: { select: { id: true, email: true } },
    },
  });

  return Response.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      canvasJsonPath: p.canvasJsonPath,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      isOwner: true,
      collaborators: p.collaborators,
    }))
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const name = body.name || "Untitled Project";

  const prisma = await getPrisma();
  const project = await prisma.project.create({
    data: {
      id: body.id,
      ownerId: userId,
      name,
    },
    include: {
      collaborators: { select: { id: true, email: true } },
    },
  });

  return Response.json(
    {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      canvasJsonPath: project.canvasJsonPath,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      isOwner: true,
      collaborators: project.collaborators,
    },
    { status: 201 }
  );
}
