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

interface EditorWorkspaceClientProps {
  currentProject: Project;
  initialProjects: Project[];
  initialInvitations: ProjectInvitation[];
}

export function EditorWorkspaceClient({
  currentProject,
  initialProjects,
  initialInvitations,
}: EditorWorkspaceClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
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
        onOpenStarterTemplates={() => setIsTemplatesOpen(true)}
        onShareProject={() => setIsShareDialogOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        hideUserButton
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

      <main className="pt-12">
        <div className="relative h-[calc(100vh-3rem)] overflow-hidden bg-background">
          {/* Canvas fills the full area; sidebars float above it so the dotted
              background stays visible edge to edge underneath them. */}
          <div className="absolute inset-0">
            <CanvasWorkspace
              roomId={currentProject.id}
              projectId={currentProject.id}
              templatesOpen={isTemplatesOpen}
              onTemplatesOpenChange={setIsTemplatesOpen}
              onSaveStatusChange={setSaveStatus}
              aiSidebarOpen={isAiSidebarOpen}
              onCloseAiSidebar={() => setIsAiSidebarOpen(false)}
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
