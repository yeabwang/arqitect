import { redirect } from "next/navigation";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import { fetchUserInvitations } from "@/lib/project-invitations";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client";
import type { Project } from "@/hooks/use-project-dialogs";

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  const currentProject = await getProjectWithAccess(roomId, identity);

  if (!currentProject) {
    return <AccessDenied />;
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

  const initialProjects: Project[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    isOwner: project.ownerId === identity.userId,
  }));
  const initialInvitations = await fetchUserInvitations(identity.primaryEmail);

  return (
    <EditorWorkspaceClient
      currentProject={{
        id: currentProject.id,
        name: currentProject.name,
        isOwner: currentProject.ownerId === identity.userId,
      }}
      initialProjects={initialProjects}
      initialInvitations={initialInvitations}
    />
  );
}
