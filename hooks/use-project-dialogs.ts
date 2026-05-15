"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ProjectInvitation } from "@/lib/project-invitations";

export type { ProjectInvitation } from "@/lib/project-invitations";

export interface Project {
  id: string;
  name: string;
  isOwner: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateSuffix(): string {
  return crypto.randomUUID().slice(0, 6);
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function fetchProjectInvitations(): Promise<ProjectInvitation[]> {
  const res = await fetch("/api/project-invitations");
  if (!res.ok) throw new Error("Failed to fetch project invitations");
  return res.json();
}

async function getResponseMessage(
  res: Response,
  fallback: string
): Promise<string> {
  const message = await res.text().catch(() => "");
  return message.trim() || fallback;
}

export function useProjectDialogs(
  initialProjects: Project[] = [],
  initialInvitations: ProjectInvitation[] = []
) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectInvitations, setProjectInvitations] =
    useState<ProjectInvitation[]>(initialInvitations);
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState("");
  const [slugSuffix, setSlugSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationActionId, setInvitationActionId] = useState<string | null>(
    null
  );
  const [invitationActionError, setInvitationActionError] = useState<
    string | null
  >(null);

  const ownedProjects = useMemo(
    () => projects.filter((p) => p.isOwner),
    [projects]
  );

  const sharedProjects = useMemo(
    () => projects.filter((p) => !p.isOwner),
    [projects]
  );

  const roomIdPreview = useMemo(() => {
    const base = slugify(formName);
    if (!base) return "";
    return slugSuffix ? `${base}-${slugSuffix}` : base;
  }, [formName, slugSuffix]);

  const openCreateDialog = useCallback(() => {
    setFormName("");
    setSlugSuffix(generateSuffix());
    setSelectedProject(null);
    setOpenDialog("create");
  }, []);

  const openRenameDialog = useCallback((project: Project) => {
    setFormName(project.name);
    setSlugSuffix("");
    setSelectedProject(project);
    setOpenDialog("rename");
  }, []);

  const openDeleteDialog = useCallback((project: Project) => {
    setSelectedProject(project);
    setOpenDialog("delete");
  }, []);

  const closeDialog = useCallback(() => {
    setOpenDialog(null);
    setSelectedProject(null);
    setFormName("");
    setSlugSuffix("");
    setIsLoading(false);
    setError(null);
  }, []);

  const refreshProjects = useCallback(async () => {
    const data = await fetchProjects();
    setProjects(data);
  }, []);

  const refreshProjectInvitations = useCallback(async () => {
    const data = await fetchProjectInvitations();
    setProjectInvitations(data);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!roomIdPreview) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, id: roomIdPreview }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
      closeDialog();
      router.push(`/editor/${project.id}`);
    } catch {
      setIsLoading(false);
      setError("Failed to create project. Please try again.");
    }
  }, [formName, roomIdPreview, router, closeDialog]);

  const handleRename = useCallback(async () => {
    if (!selectedProject || !formName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      const renamedId = selectedProject.id;
      const newName = formName;
      setProjects((prev) =>
        prev.map((p) => (p.id === renamedId ? { ...p, name: newName } : p))
      );
      closeDialog();
      refreshProjects().catch(() => {});
    } catch {
      setIsLoading(false);
      setError("Failed to rename project. Please try again.");
    }
  }, [selectedProject, formName, refreshProjects, closeDialog]);

  const handleDelete = useCallback(async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      const deletedId = selectedProject.id;
      setProjects((prev) => prev.filter((p) => p.id !== deletedId));
      closeDialog();
      refreshProjects().catch(() => {});
    } catch {
      setIsLoading(false);
      setError("Failed to delete project. Please try again.");
    }
  }, [selectedProject, refreshProjects, closeDialog]);

  const handleAcceptInvitation = useCallback(
    async (invitation: ProjectInvitation) => {
      setInvitationActionId(invitation.id);
      setInvitationActionError(null);

      try {
        const res = await fetch(`/api/project-invitations/${invitation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        });

        if (!res.ok) {
          throw new Error(
            await getResponseMessage(res, "Failed to accept invitation")
          );
        }

        setProjectInvitations((prev) =>
          prev.filter((item) => item.id !== invitation.id)
        );
        await refreshProjects();
      } catch (err) {
        setInvitationActionError(
          err instanceof Error
            ? err.message
            : "Failed to accept invitation. Please try again."
        );
      } finally {
        setInvitationActionId(null);
      }
    },
    [refreshProjects]
  );

  const handleDenyInvitation = useCallback(
    async (invitation: ProjectInvitation) => {
      setInvitationActionId(invitation.id);
      setInvitationActionError(null);

      try {
        const res = await fetch(`/api/project-invitations/${invitation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deny" }),
        });

        if (!res.ok) {
          throw new Error(
            await getResponseMessage(res, "Failed to deny invitation")
          );
        }

        setProjectInvitations((prev) =>
          prev.filter((item) => item.id !== invitation.id)
        );
      } catch (err) {
        setInvitationActionError(
          err instanceof Error
            ? err.message
            : "Failed to update invitation. Please try again."
        );
      } finally {
        setInvitationActionId(null);
      }
    },
    []
  );

  return useMemo(
    () => ({
      projects,
      projectInvitations,
      invitationActionId,
      invitationActionError,
      ownedProjects,
      sharedProjects,
      openDialog,
      selectedProject,
      formName,
      isLoading,
      error,
      roomIdPreview,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
      closeDialog,
      setFormName,
      handleCreate,
      handleRename,
      handleDelete,
      handleAcceptInvitation,
      handleDenyInvitation,
      refreshProjectInvitations,
    }),
    [
      projects,
      projectInvitations,
      invitationActionId,
      invitationActionError,
      ownedProjects,
      sharedProjects,
      openDialog,
      selectedProject,
      formName,
      isLoading,
      error,
      roomIdPreview,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
      closeDialog,
      handleCreate,
      handleRename,
      handleDelete,
      handleAcceptInvitation,
      handleDenyInvitation,
      refreshProjectInvitations,
    ]
  );
}
