import { redirect } from "next/navigation";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import { enrichInvitations, normalizeCollaboratorEmail } from "@/lib/project-collaborators";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client";
import type { Project, ProjectInvitation } from "@/hooks/use-project-dialogs";

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

  const initialProjects: Project[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    isOwner: project.ownerId === identity.userId,
  }));
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
