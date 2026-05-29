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
