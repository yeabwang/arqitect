"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

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

export function useProjectDialogs(initialProjects: Project[] = []) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState("");
  const [slugSuffix, setSlugSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

  const refreshProjects = useCallback(async () => {
    const data = await fetchProjects();
    setProjects(data);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!roomIdPreview) return;
    setIsLoading(true);
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
    }
  }, [formName, roomIdPreview, router, closeDialog]);

  const handleRename = useCallback(async () => {
    if (!selectedProject || !formName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      await refreshProjects();
      closeDialog();
    } catch {
      setIsLoading(false);
    }
  }, [selectedProject, formName, refreshProjects, closeDialog]);

  const handleDelete = useCallback(async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      await refreshProjects();
      closeDialog();
    } catch {
      setIsLoading(false);
    }
  }, [selectedProject, refreshProjects, closeDialog]);

  return useMemo(
    () => ({
      projects,
      ownedProjects,
      sharedProjects,
      openDialog,
      selectedProject,
      formName,
      isLoading,
      roomIdPreview,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
      closeDialog,
      setFormName,
      handleCreate,
      handleRename,
      handleDelete,
    }),
    [
      projects,
      ownedProjects,
      sharedProjects,
      openDialog,
      selectedProject,
      formName,
      isLoading,
      roomIdPreview,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
      closeDialog,
      handleCreate,
      handleRename,
      handleDelete,
    ]
  );
}
