import Link from "next/link";
import { ArrowRight, Users, Clock } from "lucide-react";
import { DesignThumbnail } from "@/components/dashboard/design-thumbnail";

export interface ContinueWorkingProject {
  id: string;
  name: string;
  updatedAtISO: string;
  isOwner: boolean;
  collaboratorCount: number;
  ownerName?: string | null;
}

function relative(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = 60_000;
  const h = 60 * m;
  const d = 24 * h;
  if (diff < m) return "moments ago";
  if (diff < h) return `${Math.floor(diff / m)} min ago`;
  if (diff < d) return `${Math.floor(diff / h)} hr ago`;
  if (diff < 7 * d) return `${Math.floor(diff / d)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ContinueWorking({ project }: { project: ContinueWorkingProject }) {
  return (
    <Link
      href={`/editor/${project.id}`}
      className="group relative grid overflow-hidden rounded-2xl border border-border-default bg-bg-surface transition-colors hover:border-border-subtle sm:grid-cols-[1fr_minmax(260px,40%)]"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Pick up where you left off
          </span>
          <span className="h-1 w-1 rounded-full bg-state-success" />
          <span className="font-mono text-[10px] tracking-[0.14em] text-state-success uppercase">
            Last edited
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold text-text-primary">
            {project.name}
          </h2>
          <p className="text-sm text-text-secondary">
            {project.isOwner
              ? "Owned by you"
              : `Shared by ${project.ownerName ?? "a collaborator"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {relative(project.updatedAtISO)}
          </span>
          {project.collaboratorCount > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {project.collaboratorCount}{" "}
              {project.collaboratorCount === 1 ? "collaborator" : "collaborators"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Solo canvas
            </span>
          )}
        </div>
        <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-md bg-text-primary px-3 py-2 text-[13px] font-medium text-bg-base transition-colors group-hover:bg-interactive-inverse-hover">
          Open canvas
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="relative min-h-[200px] border-t border-border-faint sm:border-t-0 sm:border-l">
        <div className="absolute inset-0">
          <DesignThumbnail seed={project.id} />
        </div>
      </div>
    </Link>
  );
}
