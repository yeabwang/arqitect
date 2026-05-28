"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  DashboardProvider,
  type DashboardContextValue,
  type StartDesignMode,
} from "@/components/dashboard/dashboard-context";
import {
  StartDesignDialog,
  MAX_AI_PROMPT_LENGTH,
} from "@/components/dashboard/start-design-dialog";

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

function buildEditorPath(
  projectId: string,
  mode: StartDesignMode,
  aiPrompt: string,
): string {
  if (mode === "template") {
    return `/editor/${projectId}?start=template`;
  }
  if (mode === "ai") {
    const params = new URLSearchParams({ start: "ai" });
    const trimmed = aiPrompt.trim().slice(0, MAX_AI_PROMPT_LENGTH);
    if (trimmed.length > 0) {
      params.set("prompt", trimmed);
    }
    return `/editor/${projectId}?${params.toString()}`;
  }
  return `/editor/${projectId}`;
}

export function DashboardShell({
  invitationCount,
  workspaceName,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [mode, setMode] = useState<StartDesignMode>("blank");
  const [formName, setFormName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [slugSuffix, setSlugSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomIdPreview = useMemo(() => {
    const base = slugify(formName);
    if (!base) return "";
    return slugSuffix ? `${base}-${slugSuffix}` : base;
  }, [formName, slugSuffix]);

  const openCreateDesign = useCallback((nextMode: StartDesignMode = "blank") => {
    setMode(nextMode);
    setFormName("");
    setAiPrompt("");
    setSlugSuffix(generateSuffix());
    setError(null);
    setIsLoading(false);
    setCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setFormName("");
    setAiPrompt("");
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
      const target = buildEditorPath(project.id, mode, aiPrompt);
      closeCreate();
      router.push(target);
    } catch {
      setIsLoading(false);
      setError("Failed to create design. Please try again.");
    }
  }, [formName, roomIdPreview, mode, aiPrompt, router, closeCreate]);

  const ctx: DashboardContextValue = useMemo(
    () => ({ openCreateDesign, invitationCount }),
    [openCreateDesign, invitationCount],
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

      <StartDesignDialog
        open={createOpen}
        mode={mode}
        formName={formName}
        aiPrompt={aiPrompt}
        roomIdPreview={roomIdPreview}
        isLoading={isLoading}
        error={error}
        onModeChange={setMode}
        onFormNameChange={setFormName}
        onAiPromptChange={setAiPrompt}
        onClose={closeCreate}
        onSubmit={handleCreate}
      />
    </DashboardProvider>
  );
}
