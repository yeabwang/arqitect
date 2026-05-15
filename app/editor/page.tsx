import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { enrichInvitations, normalizeCollaboratorEmail } from "@/lib/project-collaborators";
import { EditorPageClient } from "@/components/editor/editor-page-client";
import type { ProjectInvitation } from "@/hooks/use-project-dialogs";

export default async function EditorPage() {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return null;
  }

  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: identity.userId },
        ...(identity.primaryEmail
          ? [{ collaborators: { some: { email: identity.primaryEmail } } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, ownerId: true },
  });
  const invitations = identity.primaryEmail
    ? await prisma.projectInvitation.findMany({
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
      })
    : [];
  const invitationProfiles = await enrichInvitations(
    invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      invitedById: invitation.invitedById,
      status: invitation.status,
      createdAt: invitation.createdAt,
    }))
  );
  const initialInvitations: ProjectInvitation[] = invitationProfiles.map((profile) => {
    const invitation = invitations.find((item) => item.id === profile.id);

    return {
      ...profile,
      status: "PENDING",
      projectId: invitation?.project.id ?? "",
      projectName: invitation?.project.name ?? "Untitled Project",
    };
  });

  return (
    <EditorPageClient
      initialProjects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        isOwner: p.ownerId === identity.userId,
      }))}
      initialInvitations={initialInvitations}
    />
  );
}
