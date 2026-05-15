import { auth, currentUser } from "@clerk/nextjs/server";
import getPrisma from "@/lib/prisma";

export interface ProjectAccessIdentity {
  userId: string | null;
  primaryEmail: string | null;
}

export interface ProjectAccessRecord {
  ownerId: string;
  collaborators: Array<{ email: string }>;
}

export async function getCurrentProjectIdentity(): Promise<ProjectAccessIdentity> {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, primaryEmail: null };
  }

  const user = await currentUser();

  return {
    userId,
    primaryEmail: user?.primaryEmailAddress?.emailAddress ?? null,
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
