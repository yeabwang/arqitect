"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { EditorHome } from "@/components/editor/editor-home";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { useProjectDialogs, type Project } from "@/hooks/use-project-dialogs";

interface EditorPageClientProps {
  initialProjects: Project[];
}

export function EditorPageClient({ initialProjects }: EditorPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs(initialProjects);

  return (
    <div className="min-h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={dialogs.ownedProjects}
        sharedProjects={dialogs.sharedProjects}
        onCreateProject={dialogs.openCreateDialog}
        onRenameProject={dialogs.openRenameDialog}
        onDeleteProject={dialogs.openDeleteDialog}
      />
      <main className="pt-12">
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <EditorHome onCreateProject={dialogs.openCreateDialog} />
        </div>
      </main>

      <CreateProjectDialog
        open={dialogs.openDialog === "create"}
        formName={dialogs.formName}
        roomIdPreview={dialogs.roomIdPreview}
        isLoading={dialogs.isLoading}
        onFormNameChange={dialogs.setFormName}
        onClose={dialogs.closeDialog}
        onSubmit={dialogs.handleCreate}
      />

      <RenameProjectDialog
        open={dialogs.openDialog === "rename"}
        currentName={dialogs.selectedProject?.name ?? ""}
        formName={dialogs.formName}
        isLoading={dialogs.isLoading}
        onFormNameChange={dialogs.setFormName}
        onClose={dialogs.closeDialog}
        onSubmit={dialogs.handleRename}
      />

      <DeleteProjectDialog
        open={dialogs.openDialog === "delete"}
        projectName={dialogs.selectedProject?.name ?? ""}
        isLoading={dialogs.isLoading}
        onClose={dialogs.closeDialog}
        onConfirm={dialogs.handleDelete}
      />
    </div>
  );
}
