import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { normalizeCollaboratorEmail } from "@/lib/project-collaborators";
import {
  DesignsPageClient,
  type DesignsPageProject,
} from "@/components/dashboard/designs-page-client";

export default async function DesignsPage() {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) return null;

  const prisma = await getPrisma();
  const userId = identity.userId;
  const normalizedEmail = identity.primaryEmail
    ? normalizeCollaboratorEmail(identity.primaryEmail)
    : null;

  const sharedFilter = normalizedEmail
    ? [{ collaborators: { some: { email: normalizedEmail } } }]
    : [];

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, ...sharedFilter],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      ownerId: true,
      updatedAt: true,
    },
  });

  const ownerIds = Array.from(
    new Set(projects.filter((p) => p.ownerId !== userId).map((p) => p.ownerId))
  );

  const ownerNames: Record<string, string | null> = {};
  if (ownerIds.length > 0) {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    await Promise.all(
      ownerIds.map(async (id) => {
        try {
          const u = await client.users.getUser(id);
          ownerNames[id] =
            u.firstName ||
            u.username ||
            u.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            null;
        } catch {
          ownerNames[id] = null;
        }
      })
    );
  }

  const data: DesignsPageProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    isOwner: p.ownerId === userId,
    updatedAt: p.updatedAt.toISOString(),
    ownerName: p.ownerId === userId ? null : ownerNames[p.ownerId] ?? null,
  }));

  return <DesignsPageClient initialProjects={data} />;
}
