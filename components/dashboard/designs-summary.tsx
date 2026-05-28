import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { DesignThumbnail } from "@/components/dashboard/design-thumbnail";

export interface DesignsSummaryItem {
  id: string;
  name: string;
  updatedAtISO: string;
  isOwner: boolean;
  collaboratorCount: number;
}

function relative(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = 60_000;
  const h = 60 * m;
  const d = 24 * h;
  if (diff < m) return "now";
  if (diff < h) return `${Math.floor(diff / m)}m`;
  if (diff < d) return `${Math.floor(diff / h)}h`;
  if (diff < 7 * d) return `${Math.floor(diff / d)}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function DesignsSummary({ items }: { items: DesignsSummaryItem[] }) {
  return (
    <section className="flex flex-col rounded-2xl border border-border-default bg-bg-surface">
      <header className="flex items-center justify-between border-b border-border-faint px-5 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Your designs</h2>
        <Link
          href="/dashboard/designs"
          className="flex items-center gap-1 font-mono text-[11px] tracking-[0.12em] text-text-muted uppercase hover:text-text-primary"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </header>
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-text-muted">
          No designs yet.
        </div>
      ) : (
        <ul className="divide-y divide-border-faint">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/editor/${item.id}`}
                className="grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated/40"
              >
                <span className="overflow-hidden rounded-md border border-border-faint">
                  <DesignThumbnail seed={item.id} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {item.name}
                    </span>
                    <span
                      className={
                        item.isOwner
                          ? "rounded-md border border-border-faint bg-bg-elevated px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-text-muted uppercase"
                          : "rounded-md border border-accent-primary/30 bg-accent-primary-dim px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-accent-primary uppercase"
                      }
                    >
                      {item.isOwner ? "Owner" : "Shared"}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                    {item.collaboratorCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.collaboratorCount}
                      </span>
                    ) : (
                      <span className="text-text-faint">solo</span>
                    )}
                    <span className="font-mono">
                      Edited {relative(item.updatedAtISO)} ago
                    </span>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
