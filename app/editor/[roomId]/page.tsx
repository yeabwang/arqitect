import { redirect } from "next/navigation";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import { fetchUserInvitations } from "@/lib/project-invitations";
import { AccessDenied } from "@/components/editor/access-denied";
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";
import {
  EditorWorkspaceClient,
  type EditorStartMode,
  type PendingGenerationClient,
} from "@/components/editor/editor-workspace-client";
import type { Project } from "@/hooks/use-project-dialogs";
import { parsePendingGenerationPayload } from "@/types/onboarding";

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ start?: string; template?: string }>;
}

function resolveStartMode(start: string | undefined): EditorStartMode {
  if (start === "template" || start === "ai") {
    return start;
  }
  return null;
}

function hasExpired(date: Date): boolean {
  return date.getTime() <= Date.now();
}

export default async function EditorWorkspacePage({
  params,
  searchParams,
}: EditorWorkspacePageProps) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  const { start, template } = await searchParams;
  const startMode = resolveStartMode(start);
  const templateId =
    startMode === "template" &&
    template &&
    CANVAS_TEMPLATES.some((item) => item.id === template)
      ? template
      : null;

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

  // Only the AI start path reads a captured interview; the row is deleted once
  // the user confirms generation in the editor.
  let pendingGeneration: PendingGenerationClient | null = null;
  if (startMode === "ai") {
    const pending = await prisma.pendingGeneration.findUnique({
      where: { projectId: currentProject.id },
    });
    if (pending && !hasExpired(pending.expiresAt)) {
      const payload = parsePendingGenerationPayload(pending.payload);
      if (payload) {
        pendingGeneration = { payload, rawPrompt: pending.rawPrompt };
      }
    }
  }

  return (
    <EditorWorkspaceClient
      currentProject={{
        id: currentProject.id,
        name: currentProject.name,
        isOwner: currentProject.ownerId === identity.userId,
      }}
      initialProjects={initialProjects}
      initialInvitations={initialInvitations}
      startMode={startMode}
      templateId={templateId}
      pendingGeneration={pendingGeneration}
    />
  );
}
