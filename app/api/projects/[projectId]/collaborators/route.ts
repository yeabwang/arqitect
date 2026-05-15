import { Prisma } from "@/app/generated/prisma/client";
import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity, hasProjectAccess } from "@/lib/project-access";
import {
  enrichCollaborators,
  enrichInvitations,
  isValidCollaboratorEmail,
  normalizeCollaboratorEmail,
} from "@/lib/project-collaborators";

interface CollaboratorsRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  request: Request,
  ctx: CollaboratorsRouteContext
) {
  void request;

  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
  const prisma = await getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: {
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, createdAt: true },
      },
      invitations: {
        where: { status: { in: ["PENDING", "DENIED"] } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          invitedById: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  if (!hasProjectAccess(project, identity)) {
    return new Response("Forbidden", { status: 403 });
  }

  const collaborators = await enrichCollaborators(project.collaborators);

  return Response.json({
    canManage: project.ownerId === identity.userId,
    collaborators,
    invitations:
      project.ownerId === identity.userId
        ? await enrichInvitations(project.invitations)
        : [],
  });
}

export async function POST(
  request: Request,
  ctx: CollaboratorsRouteContext
) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await ctx.params;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const emailValue = (body as Record<string, unknown>).email;
  if (typeof emailValue !== "string") {
    return new Response("Email is required", { status: 400 });
  }

  const email = normalizeCollaboratorEmail(emailValue);
  if (!isValidCollaboratorEmail(email)) {
    return new Response("Invalid email", { status: 400 });
  }

  if (identity.primaryEmail && normalizeCollaboratorEmail(identity.primaryEmail) === email) {
    return new Response("Owner cannot be added as collaborator", { status: 400 });
  }

  const existingCollaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  });

  if (existingCollaborator) {
    return new Response("Collaborator already exists", { status: 409 });
  }

  try {
    await prisma.projectInvitation.upsert({
      where: { projectId_email: { projectId, email } },
      create: {
        projectId,
        email,
        invitedById: identity.userId,
      },
      update: {
        invitedById: identity.userId,
        status: "PENDING",
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return new Response("Invitation already exists", { status: 409 });
    }
    throw err;
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, createdAt: true },
  });
  const invitations = await prisma.projectInvitation.findMany({
    where: { projectId, status: { in: ["PENDING", "DENIED"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      invitedById: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json(
    {
      canManage: true,
      collaborators: await enrichCollaborators(collaborators),
      invitations: await enrichInvitations(invitations),
    },
    { status: 201 }
  );
}
