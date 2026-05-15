import getPrisma from "@/lib/prisma";
import {
  canActOnInvitation,
  isInvitationForEmail,
} from "@/lib/project-collaborators";
import { getCurrentProjectIdentity } from "@/lib/project-access";

interface InvitationRouteContext {
  params: Promise<{ invitationId: string }>;
}

export async function PATCH(request: Request, ctx: InvitationRouteContext) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
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

  const action = (body as Record<string, unknown>).action;
  if (action !== "accept" && action !== "deny") {
    return new Response("Invalid invitation action", { status: 400 });
  }

  const { invitationId } = await ctx.params;
  const prisma = await getPrisma();
  const invitation = await prisma.projectInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      projectId: true,
      email: true,
      invitedById: true,
      status: true,
      createdAt: true,
    },
  });

  if (!invitation) {
    return new Response("Not Found", { status: 404 });
  }

  if (!isInvitationForEmail(invitation, identity.primaryEmail)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (action === "accept" && invitation.status === "ACCEPTED") {
    return Response.json({
      status: "ACCEPTED",
      projectId: invitation.projectId,
    });
  }

  if (action === "deny" && invitation.status === "DENIED") {
    return Response.json({ status: "DENIED" });
  }

  if (!canActOnInvitation(invitation, identity.primaryEmail)) {
    return new Response("Invitation is no longer pending", { status: 409 });
  }

  if (action === "deny") {
    await prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: "DENIED" },
    });

    return Response.json({ status: "DENIED" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectInvitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED" },
    });

    await tx.projectCollaborator.upsert({
      where: {
        projectId_email: {
          projectId: invitation.projectId,
          email: invitation.email,
        },
      },
      create: {
        projectId: invitation.projectId,
        email: invitation.email,
      },
      update: {},
    });
  });

  return Response.json({ status: "ACCEPTED", projectId: invitation.projectId });
}
