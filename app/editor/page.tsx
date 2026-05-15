import getPrisma from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { fetchUserInvitations } from "@/lib/project-invitations";
import { EditorPageClient } from "@/components/editor/editor-page-client";

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
  const initialInvitations = await fetchUserInvitations(identity.primaryEmail);

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
