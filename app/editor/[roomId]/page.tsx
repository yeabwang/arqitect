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
import type { EditorStartMode } from "@/components/editor/editor-start-state";

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const MAX_INITIAL_PROMPT_LENGTH = 500;

function parseStartParams(query: { [key: string]: string | string[] | undefined }): {
  mode: EditorStartMode;
  prompt: string;
} {
  const rawStart = Array.isArray(query.start) ? query.start[0] : query.start;
  const rawPrompt = Array.isArray(query.prompt) ? query.prompt[0] : query.prompt;

  let mode: EditorStartMode = "none";
  if (rawStart === "template") mode = "template";
  else if (rawStart === "ai") mode = "ai";

  const prompt =
    typeof rawPrompt === "string"
      ? rawPrompt.slice(0, MAX_INITIAL_PROMPT_LENGTH)
      : "";

  return { mode, prompt };
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
  const query = await searchParams;
  const { mode: initialStartMode, prompt: initialStartPrompt } =
    parseStartParams(query);

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
      initialStartMode={initialStartMode}
      initialStartPrompt={initialStartPrompt}
    />
  );
}
