"use client";

import { useMemo, useState } from "react";
import { CanvasWorkspace } from "@/components/editor/canvas-workspace";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ShareProjectDialog } from "@/components/editor/share-project-dialog";
import type { CanvasSaveStatus } from "@/hooks/useCanvasAutosave";
import {
  useProjectDialogs,
  type Project,
  type ProjectInvitation,
} from "@/hooks/use-project-dialogs";
import type { PendingGenerationPayload } from "@/types/onboarding";

export type EditorStartMode = "template" | "ai" | null;

export interface PendingGenerationClient {
  payload: PendingGenerationPayload;
  rawPrompt: string | null;
}

interface EditorWorkspaceClientProps {
  currentProject: Project;
  initialProjects: Project[];
  initialInvitations: ProjectInvitation[];
  startMode?: EditorStartMode;
  templateId?: string | null;
  pendingGeneration?: PendingGenerationClient | null;
}

export function EditorWorkspaceClient({
  currentProject,
  initialProjects,
  initialInvitations,
  startMode = null,
  templateId = null,
  pendingGeneration = null,
}: EditorWorkspaceClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(
    startMode === "ai" || startMode === null,
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(
    startMode === "template" && !templateId,
  );
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");
  const dialogs = useProjectDialogs(initialProjects, initialInvitations);

  const projectName = useMemo(
    () =>
      dialogs.projects.find((project) => project.id === currentProject.id)
        ?.name ?? currentProject.name,
    [dialogs.projects, currentProject.id, currentProject.name]
  );

  return (
    <div className="min-h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={projectName}
        onShareProject={() => setIsShareDialogOpen(true)}
        saveStatus={saveStatus}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={dialogs.ownedProjects}
        sharedProjects={dialogs.sharedProjects}
        projectInvitations={dialogs.projectInvitations}
        invitationActionId={dialogs.invitationActionId}
        invitationActionError={dialogs.invitationActionError}
        currentProjectId={currentProject.id}
        onCreateProject={dialogs.openCreateDialog}
        onRenameProject={dialogs.openRenameDialog}
        onDeleteProject={dialogs.openDeleteDialog}
        onAcceptInvitation={dialogs.handleAcceptInvitation}
        onDenyInvitation={dialogs.handleDenyInvitation}
      />

      <main className="h-screen">
        <div className="relative h-full overflow-hidden bg-background">
          {/* Canvas fills the full area; sidebars float above it so the dotted
              background stays visible edge to edge underneath them. */}
          <div className="absolute inset-0">
            <CanvasWorkspace
              roomId={currentProject.id}
              projectId={currentProject.id}
              templatesOpen={isTemplatesOpen}
              onTemplatesOpenChange={setIsTemplatesOpen}
              templateId={templateId}
              onSaveStatusChange={setSaveStatus}
              aiSidebarOpen={isAiSidebarOpen}
              onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
              onCloseAiSidebar={() => setIsAiSidebarOpen(false)}
              pendingGeneration={pendingGeneration}
            />
          </div>
        </div>
      </main>

      <CreateProjectDialog
        open={dialogs.openDialog === "create"}
        formName={dialogs.formName}
        roomIdPreview={dialogs.roomIdPreview}
        isLoading={dialogs.isLoading}
        error={dialogs.error}
        onFormNameChange={dialogs.setFormName}
        onClose={dialogs.closeDialog}
        onSubmit={dialogs.handleCreate}
      />

      <RenameProjectDialog
        open={dialogs.openDialog === "rename"}
        currentName={dialogs.selectedProject?.name ?? ""}
        formName={dialogs.formName}
        isLoading={dialogs.isLoading}
        error={dialogs.error}
        onFormNameChange={dialogs.setFormName}
        onClose={dialogs.closeDialog}
        onSubmit={dialogs.handleRename}
      />

      <DeleteProjectDialog
        open={dialogs.openDialog === "delete"}
        projectName={dialogs.selectedProject?.name ?? ""}
        isLoading={dialogs.isLoading}
        error={dialogs.error}
        onClose={dialogs.closeDialog}
        onConfirm={dialogs.handleDelete}
      />

      <ShareProjectDialog
        open={isShareDialogOpen}
        projectId={currentProject.id}
        projectName={projectName}
        onClose={() => setIsShareDialogOpen(false)}
      />
    </div>
  );
}
