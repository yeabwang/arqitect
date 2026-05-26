import getPrisma from "@/lib/prisma";
import {
  enrichInvitations,
  normalizeCollaboratorEmail,
  type InvitationProfile,
} from "@/lib/project-collaborators";

export interface ProjectInvitation {
  id: string;
  email: string;
  projectId: string;
  projectName: string;
  invitedById: string;
  inviterName: string | null;
  inviterAvatarUrl: string | null;
  status: "PENDING";
  createdAt: string;
}

export interface PendingProjectInvitationRecord {
  id: string;
  email: string;
  invitedById: string;
  status: "PENDING";
  createdAt: Date;
  project: { id: string; name: string };
}

export function formatPendingProjectInvitations(
  invitations: PendingProjectInvitationRecord[],
  profiles: InvitationProfile[]
): ProjectInvitation[] {
  return profiles.map((profile) => {
    const invitation = invitations.find((item) => item.id === profile.id);

    return {
      ...profile,
      status: "PENDING",
      projectId: invitation?.project.id ?? "",
      projectName: invitation?.project.name ?? "Untitled Project",
    };
  });
}

export async function fetchUserInvitations(
  primaryEmail: string | null
): Promise<ProjectInvitation[]> {
  if (!primaryEmail) {
    return [];
  }

  const prisma = await getPrisma();
  const invitations = await prisma.projectInvitation.findMany({
    where: {
      email: normalizeCollaboratorEmail(primaryEmail),
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

  const pendingInvitations: PendingProjectInvitationRecord[] =
    invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      invitedById: invitation.invitedById,
      status: "PENDING",
      createdAt: invitation.createdAt,
      project: invitation.project,
    }));
  const profiles = await enrichInvitations(pendingInvitations);

  return formatPendingProjectInvitations(pendingInvitations, profiles);
}
