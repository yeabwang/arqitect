"use client";

import { useState, useCallback, useMemo } from "react";

export interface Project {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", isOwner: true },
  { id: "2", name: "Analytics Dashboard", slug: "analytics-dashboard", isOwner: true },
  { id: "3", name: "Team Collaboration", slug: "team-collaboration", isOwner: false },
  { id: "4", name: "Design System", slug: "design-system", isOwner: false },
];

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ownedProjects = useMemo(
    () => projects.filter((p) => p.isOwner),
    [projects]
  );

  const sharedProjects = useMemo(
    () => projects.filter((p) => !p.isOwner),
    [projects]
  );

  const slugPreview = useMemo(() => {
    return formName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, [formName]);

  const openCreateDialog = useCallback(() => {
    setFormName("");
    setSelectedProject(null);
    setOpenDialog("create");
  }, []);

  const openRenameDialog = useCallback((project: Project) => {
    setFormName(project.name);
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
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      projects,
      ownedProjects,
      sharedProjects,
      openDialog,
      selectedProject,
      formName,
      isLoading,
      slugPreview,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
      closeDialog,
      setFormName,
      setIsLoading,
    }),
    [
      projects,
      ownedProjects,
      sharedProjects,
      openDialog,
      selectedProject,
      formName,
      isLoading,
      slugPreview,
      openCreateDialog,
      openRenameDialog,
      openDeleteDialog,
      closeDialog,
      setFormName,
      setIsLoading,
    ]
  );
}
