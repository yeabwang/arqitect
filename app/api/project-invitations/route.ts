import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { enrichInvitations, normalizeCollaboratorEmail } from "@/lib/project-collaborators";

export async function GET() {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!identity.primaryEmail) {
    return Response.json([]);
  }

  const prisma = await getPrisma();
  const invitations = await prisma.projectInvitation.findMany({
    where: {
      email: normalizeCollaboratorEmail(identity.primaryEmail),
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      invitedById: true,
      status: true,
      createdAt: true,
      project: { select: { id: true, name: true } },
    },
  });

  const profiles = await enrichInvitations(
    invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      invitedById: invitation.invitedById,
      status: invitation.status,
      createdAt: invitation.createdAt,
    }))
  );

  return Response.json(
    profiles.map((profile) => {
      const invitation = invitations.find((item) => item.id === profile.id);

      return {
        ...profile,
        projectId: invitation?.project.id ?? "",
        projectName: invitation?.project.name ?? "Untitled Project",
      };
    })
  );
}
