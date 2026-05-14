import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import getPrisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const obj = body as Record<string, unknown>;
  const name = typeof obj.name === "string" && obj.name ? obj.name : "Untitled Project";

  const id = obj.id;
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{0,98}([a-z0-9])?$/.test(id)) {
    return new Response("Invalid project ID", { status: 400 });
  }

  const prisma = await getPrisma();
  let project;
  try {
    project = await prisma.project.create({
      data: {
        id,
        ownerId: userId,
        name,
      },
      include: {
        collaborators: { select: { id: true, email: true } },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return new Response("Project ID already exists", { status: 409 });
    }
    throw err;
  }

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
