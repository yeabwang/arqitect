import { clerkClient } from "@clerk/nextjs/server";

export interface StoredCollaborator {
  id: string;
  email: string;
  createdAt: Date;
}

export interface ClerkCollaboratorUser {
  id?: string;
  fullName: string | null;
  imageUrl: string;
  emailAddresses: Array<{ emailAddress: string }>;
}

export type InvitationStatusValue = "PENDING" | "ACCEPTED" | "DENIED";

export interface StoredInvitation {
  id: string;
  email: string;
  invitedById: string;
  status: InvitationStatusValue;
  createdAt: Date;
}

export interface CollaboratorProfile {
  id: string;
  email: string;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface InvitationProfile {
  id: string;
  email: string;
  invitedById: string;
  inviterName: string | null;
  inviterAvatarUrl: string | null;
  status: InvitationStatusValue;
  createdAt: string;
}

export function normalizeCollaboratorEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidCollaboratorEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatCollaborators(
  collaborators: StoredCollaborator[],
  users: ClerkCollaboratorUser[]
): CollaboratorProfile[] {
  const usersByEmail = new Map<string, ClerkCollaboratorUser>();

  for (const user of users) {
    for (const email of user.emailAddresses) {
      usersByEmail.set(normalizeCollaboratorEmail(email.emailAddress), user);
    }
  }

  return collaborators.map((collaborator) => {
    const email = normalizeCollaboratorEmail(collaborator.email);
    const user = usersByEmail.get(email);

    return {
      id: collaborator.id,
      email,
      createdAt: collaborator.createdAt.toISOString(),
      displayName: user?.fullName ?? null,
      avatarUrl: user?.imageUrl ?? null,
    };
  });
}

export function canActOnInvitation(
  invitation: Pick<StoredInvitation, "email" | "status">,
  primaryEmail: string | null
): boolean {
  if (invitation.status !== "PENDING") {
    return false;
  }

  return isInvitationForEmail(invitation, primaryEmail);
}

export function isInvitationForEmail(
  invitation: Pick<StoredInvitation, "email">,
  primaryEmail: string | null
): boolean {
  if (!primaryEmail) {
    return false;
  }

  return (
    normalizeCollaboratorEmail(invitation.email) ===
    normalizeCollaboratorEmail(primaryEmail)
  );
}

export function formatInvitations(
  invitations: StoredInvitation[],
  users: ClerkCollaboratorUser[]
): InvitationProfile[] {
  const usersById = new Map<string, ClerkCollaboratorUser>();

  for (const user of users) {
    if (user.id) {
      usersById.set(user.id, user);
    }
  }

  return invitations.map((invitation) => {
    const inviter = usersById.get(invitation.invitedById);

    return {
      id: invitation.id,
      email: normalizeCollaboratorEmail(invitation.email),
      invitedById: invitation.invitedById,
      inviterName: inviter?.fullName ?? null,
      inviterAvatarUrl: inviter?.imageUrl ?? null,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
    };
  });
}

export async function enrichCollaborators(
  collaborators: StoredCollaborator[]
): Promise<CollaboratorProfile[]> {
  const emails = collaborators.map((collaborator) =>
    normalizeCollaboratorEmail(collaborator.email)
  );

  if (emails.length === 0) {
    return [];
  }

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: emails,
      limit: emails.length,
    });

    return formatCollaborators(collaborators, users.data);
  } catch {
    return formatCollaborators(collaborators, []);
  }
}

export async function enrichInvitations(
  invitations: StoredInvitation[]
): Promise<InvitationProfile[]> {
  const inviterIds = Array.from(
    new Set(invitations.map((invitation) => invitation.invitedById))
  );

  if (inviterIds.length === 0) {
    return [];
  }

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      userId: inviterIds,
      limit: inviterIds.length,
    });

    return formatInvitations(invitations, users.data);
  } catch {
    return formatInvitations(invitations, []);
  }
}
