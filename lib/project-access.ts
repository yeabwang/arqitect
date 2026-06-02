import { auth, currentUser } from "@clerk/nextjs/server";
import getPrisma from "@/lib/prisma";

export interface ProjectAccessIdentity {
  userId: string | null;
  primaryEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ProjectAccessRecord {
  ownerId: string;
  collaborators: Array<{ email: string }>;
}

interface ClerkUserSummary {
  firstName?: string | null;
  fullName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
}

interface ProjectIdentityInput {
  userId: string | null;
  sessionClaims?: unknown;
  user?: ClerkUserSummary | null;
}

function readClaim(claims: unknown, key: string): string | null {
  if (!claims || typeof claims !== "object") {
    return null;
  }

  const value = (claims as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readFirstClaim(claims: unknown, keys: string[]): string | null {
  for (const key of keys) {
    const value = readClaim(claims, key);
    if (value) {
      return value;
    }
  }
  return null;
}

function emailName(email: string | null): string | null {
  return email?.split("@")[0] || null;
}

export function resolveProjectIdentity({
  userId,
  sessionClaims,
  user,
}: ProjectIdentityInput): ProjectAccessIdentity {
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    readFirstClaim(sessionClaims, [
      "email",
      "email_address",
      "primary_email_address",
    ]);

  const firstName = readFirstClaim(sessionClaims, ["first_name", "given_name"]);
  const lastName = readFirstClaim(sessionClaims, ["last_name", "family_name"]);
  const claimFullName = [firstName, lastName].filter(Boolean).join(" ");

  const displayName =
    user?.firstName ??
    user?.fullName ??
    user?.username ??
    readFirstClaim(sessionClaims, ["name", "username"]) ??
    (claimFullName.length > 0 ? claimFullName : null) ??
    emailName(primaryEmail);

  return {
    userId,
    primaryEmail,
    displayName,
    avatarUrl: user?.imageUrl ?? null,
  };
}

export async function getCurrentProjectIdentity(): Promise<ProjectAccessIdentity> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return resolveProjectIdentity({ userId: null });
  }

  const user = await currentUser().catch(() => null);

  return resolveProjectIdentity({
    userId,
    sessionClaims,
    user,
  });
}

/**
 * Lightweight display identity (name + avatar) for UI greetings. Reads from the
 * session token claims first — zero backend round-trip — and only falls back to
 * a single `currentUser()` fetch when the claims aren't populated yet.
 *
 * Kept separate from `getCurrentProjectIdentity` on purpose: that helper feeds
 * access control (email matching) and must not skip the backend fetch. This one
 * only powers cosmetic greetings, so a missing value degrades gracefully.
 *
 * Fast path requires the Clerk session token to expose the claims below
 * (Dashboard → Sessions → Customize session token):
 *   { "first_name": "{{user.first_name}}", "image_url": "{{user.image_url}}" }
 */
export async function getDisplayIdentity(): Promise<{
  displayName: string | null;
  avatarUrl: string | null;
}> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return { displayName: null, avatarUrl: null };
  }

  const claimName = readFirstClaim(sessionClaims, [
    "first_name",
    "given_name",
    "name",
    "username",
  ]);
  const claimAvatar =
    readClaim(sessionClaims, "image_url") ?? readClaim(sessionClaims, "picture");

  // Fast path: session token already carries a name — no backend fetch.
  if (claimName) {
    return { displayName: claimName, avatarUrl: claimAvatar };
  }

  // Claims not customized yet: one fetch keeps the greeting correct meanwhile.
  const user = await currentUser().catch(() => null);
  return {
    displayName: user?.firstName ?? user?.fullName ?? user?.username ?? null,
    avatarUrl: claimAvatar ?? user?.imageUrl ?? null,
  };
}

export function hasProjectAccess(
  project: ProjectAccessRecord,
  identity: ProjectAccessIdentity
): boolean {
  if (!identity.userId) {
    return false;
  }

  if (project.ownerId === identity.userId) {
    return true;
  }

  if (!identity.primaryEmail) {
    return false;
  }

  const normalizedEmail = identity.primaryEmail.toLowerCase();

  return project.collaborators.some(
    (collaborator) => collaborator.email.toLowerCase() === normalizedEmail
  );
}

export async function getProjectWithAccess(
  projectId: string,
  identity: ProjectAccessIdentity
) {
  if (!identity.userId) {
    return null;
  }

  const prisma = await getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: { select: { email: true } },
    },
  });

  if (!project || !hasProjectAccess(project, identity)) {
    return null;
  }

  return project;
}
