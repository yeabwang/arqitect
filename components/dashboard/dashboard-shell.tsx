"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  DashboardProvider,
  type DashboardContextValue,
} from "@/components/dashboard/dashboard-context";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";

interface DashboardShellProps {
  invitationCount: number;
  workspaceName: string;
  children: React.ReactNode;
}

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

export function DashboardShell({
  invitationCount,
  workspaceName,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [slugSuffix, setSlugSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomIdPreview = useMemo(() => {
    const base = slugify(formName);
    if (!base) return "";
    return slugSuffix ? `${base}-${slugSuffix}` : base;
  }, [formName, slugSuffix]);

  const openCreateDesign = useCallback(() => {
    setFormName("");
    setSlugSuffix(generateSuffix());
    setError(null);
    setIsLoading(false);
    setCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setFormName("");
    setSlugSuffix("");
    setIsLoading(false);
    setError(null);
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
      if (!res.ok) throw new Error("Failed to create design");
      const project = await res.json();
      closeCreate();
      router.push(`/editor/${project.id}`);
    } catch {
      setIsLoading(false);
      setError("Failed to create design. Please try again.");
    }
  }, [formName, roomIdPreview, router, closeCreate]);

  const ctx: DashboardContextValue = useMemo(
    () => ({ openCreateDesign, invitationCount }),
    [openCreateDesign, invitationCount]
  );

  return (
    <DashboardProvider value={ctx}>
      <div className="min-h-screen bg-bg-base text-text-primary">
        <DashboardSidebar />
        <div className="pl-56">
          <DashboardHeader workspaceName={workspaceName} />
          <main className="px-6 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>

      <CreateProjectDialog
        open={createOpen}
        formName={formName}
        roomIdPreview={roomIdPreview}
        isLoading={isLoading}
        error={error}
        onFormNameChange={setFormName}
        onClose={closeCreate}
        onSubmit={handleCreate}
      />
    </DashboardProvider>
  );
}
