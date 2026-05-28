"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DesignThumbnail } from "@/components/dashboard/design-thumbnail";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";

export interface DesignsPageProject {
  id: string;
  name: string;
  isOwner: boolean;
  updatedAt: string;
  ownerName?: string | null;
}

interface DesignsPageClientProps {
  initialProjects: DesignsPageProject[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < hr) return `${Math.max(1, Math.floor(diff / min))}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DesignsPageClient({ initialProjects }: DesignsPageClientProps) {
  const router = useRouter();
  const { openCreateDesign } = useDashboard();
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<"all" | "owned" | "shared">("all");
  const [query, setQuery] = useState("");

  const [renameTarget, setRenameTarget] = useState<DesignsPageProject | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<DesignsPageProject | null>(
    null
  );
  const [formName, setFormName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter === "owned" && !p.isOwner) return false;
      if (filter === "shared" && p.isOwner) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    });
  }, [projects, query, filter]);

  const openRename = useCallback((p: DesignsPageProject) => {
    setRenameTarget(p);
    setFormName(p.name);
    setError(null);
    setIsLoading(false);
  }, []);

  const openDelete = useCallback((p: DesignsPageProject) => {
    setDeleteTarget(p);
    setError(null);
    setIsLoading(false);
  }, []);

  const closeRename = useCallback(() => {
    setRenameTarget(null);
    setFormName("");
    setError(null);
    setIsLoading(false);
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteTarget(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleRename = useCallback(async () => {
    if (!renameTarget || !formName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName }),
      });
      if (!res.ok) throw new Error("Failed to rename design");
      const target = renameTarget;
      const name = formName;
      setProjects((prev) =>
        prev.map((p) => (p.id === target.id ? { ...p, name } : p))
      );
      closeRename();
      router.refresh();
    } catch {
      setIsLoading(false);
      setError("Failed to rename design. Please try again.");
    }
  }, [renameTarget, formName, closeRename, router]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete design");
      const target = deleteTarget;
      setProjects((prev) => prev.filter((p) => p.id !== target.id));
      closeDelete();
      router.refresh();
    } catch {
      setIsLoading(false);
      setError("Failed to delete design. Please try again.");
    }
  }, [deleteTarget, closeDelete, router]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Designs
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Your designs
          </h1>
          <p className="text-sm text-text-secondary">
            Architecture canvases owned by you or shared with you.
          </p>
        </div>
        <Button onClick={() => openCreateDesign("blank")} size="sm" className="gap-1.5">
          <Plus />
          New design
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designs"
            className="pl-8"
          />
        </div>
        <div
          role="tablist"
          aria-label="Filter designs"
          className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface p-0.5"
        >
          {(["all", "owned", "shared"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded-md bg-bg-elevated px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-text-primary uppercase"
                  : "rounded-md px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-text-muted uppercase hover:text-text-secondary"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          onNew={() => openCreateDesign("blank")}
          hasAny={projects.length > 0}
          query={query}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <li key={project.id}>
              <DesignCard
                project={project}
                onRename={openRename}
                onDelete={openDelete}
              />
            </li>
          ))}
        </ul>
      )}

      <RenameProjectDialog
        open={!!renameTarget}
        currentName={renameTarget?.name ?? ""}
        formName={formName}
        isLoading={isLoading}
        error={error}
        onFormNameChange={setFormName}
        onClose={closeRename}
        onSubmit={handleRename}
      />
      <DeleteProjectDialog
        open={!!deleteTarget}
        projectName={deleteTarget?.name ?? ""}
        isLoading={isLoading}
        error={error}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function DesignCard({
  project,
  onRename,
  onDelete,
}: {
  project: DesignsPageProject;
  onRename: (p: DesignsPageProject) => void;
  onDelete: (p: DesignsPageProject) => void;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-surface transition-colors hover:border-border-subtle">
      <Link
        href={`/editor/${project.id}`}
        className="flex flex-col gap-0"
        aria-label={`Open ${project.name}`}
      >
        <DesignThumbnail seed={project.id} />
        <div className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-text-primary">
              {project.name}
            </h3>
            <span
              className={
                project.isOwner
                  ? "rounded-md border border-border-faint bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-text-muted uppercase"
                  : "rounded-md border border-accent-primary/30 bg-accent-primary-dim px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-accent-primary uppercase"
              }
            >
              {project.isOwner ? "Owner" : "Shared"}
            </span>
          </div>
          <p className="font-mono text-[11px] text-text-muted">
            {formatDate(project.updatedAt)}
            {project.ownerName && !project.isOwner
              ? ` · by ${project.ownerName}`
              : ""}
          </p>
        </div>
      </Link>
      {project.isOwner ? (
        <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRename(project);
            }}
            aria-label={`Rename ${project.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default bg-bg-elevated/90 text-text-secondary backdrop-blur-sm hover:text-text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project);
            }}
            aria-label={`Delete ${project.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default bg-bg-elevated/90 text-text-secondary backdrop-blur-sm hover:text-state-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({
  onNew,
  hasAny,
  query,
}: {
  onNew: () => void;
  hasAny: boolean;
  query: string;
}) {
  if (hasAny && query) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-default bg-bg-surface/30 text-center">
        <p className="text-sm text-text-secondary">
          No designs match &ldquo;{query}&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-default bg-bg-surface/30 px-6 text-center">
      <p className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
        Empty canvas
      </p>
      <h2 className="text-lg font-semibold text-text-primary">
        Start your first design
      </h2>
      <p className="max-w-sm text-sm text-text-secondary">
        Spin up a collaborative architecture canvas, import a template, or
        prompt Arqitect AI to draft one for you.
      </p>
      <Button onClick={onNew} className="mt-2 gap-1.5" size="sm">
        <Plus />
        New design
      </Button>
    </div>
  );
}
