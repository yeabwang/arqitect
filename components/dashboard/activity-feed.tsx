import Link from "next/link";
import {
  Sparkles,
  FileText,
  PenLine,
  UserPlus,
  Activity,
} from "lucide-react";

export type ActivityKind = "edit" | "spec" | "ai" | "collaborator";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  projectId: string;
  projectName: string;
  whenISO: string;
  detail?: string;
}

const KIND_META: Record<
  ActivityKind,
  { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }
> = {
  edit: { icon: PenLine, label: "Edited", tone: "text-text-secondary" },
  ai: { icon: Sparkles, label: "AI run", tone: "text-accent-primary" },
  spec: { icon: FileText, label: "Spec exported", tone: "text-state-success" },
  collaborator: {
    icon: UserPlus,
    label: "Collaborator joined",
    tone: "text-state-warning",
  },
};

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="flex flex-col rounded-2xl border border-border-default bg-bg-surface">
      <header className="flex items-center justify-between border-b border-border-faint px-5 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">Activity</h2>
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-text-faint uppercase">
          Last 14 days
        </span>
      </header>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 px-5 py-12 text-center">
          <p className="text-sm text-text-secondary">No activity yet.</p>
          <p className="text-xs text-text-muted">
            Edits, AI runs, and exports will appear here.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {items.map((item, i) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            const isLast = i === items.length - 1;
            return (
              <li key={item.id} className="relative px-5 py-3">
                {!isLast ? (
                  <span
                    aria-hidden
                    className="absolute left-[28px] top-9 bottom-0 w-px bg-border-faint"
                  />
                ) : null}
                <div className="flex items-start gap-3">
                  <span
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-elevated ${meta.tone}`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary">
                      <span className="text-text-muted">{meta.label}</span>{" "}
                      <Link
                        href={`/editor/${item.projectId}`}
                        className="font-medium text-text-primary hover:underline"
                      >
                        {item.projectName}
                      </Link>
                    </p>
                    {item.detail ? (
                      <p className="mt-0.5 text-xs text-text-muted">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[11px] text-text-muted shrink-0">
                    {formatRelative(item.whenISO)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
