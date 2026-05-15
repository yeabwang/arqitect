"use client";

import { useMemo, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ShareProjectDialog } from "@/components/editor/share-project-dialog";
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
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
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
        <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
          <section className="relative flex min-w-0 flex-1 items-center justify-center bg-background">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-default)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-default)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-medium text-foreground">
                  Canvas workspace placeholder
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  The collaborative system design canvas will render here.
                </p>
              </div>
            </div>
          </section>

          <aside
            className={cn(
              "hidden w-80 shrink-0 border-l border-border bg-card transition-[width] duration-200 md:flex",
              !isAiSidebarOpen && "w-0 border-l-0"
            )}
            aria-hidden={!isAiSidebarOpen}
          >
            {isAiSidebarOpen ? (
              <div className="flex min-w-80 flex-1 flex-col">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-sm font-medium text-foreground">
                    AI assistant
                  </h2>
                </div>
                <div className="flex flex-1 items-center justify-center px-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-accent-ai-text">
                      <Bot className="h-5 w-5" />
                    </div>
                    <p className="max-w-48 text-sm text-muted-foreground">
                      Future AI chat controls will appear here.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
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
