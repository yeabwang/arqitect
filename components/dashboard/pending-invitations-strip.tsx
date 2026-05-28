"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MailPlus } from "lucide-react";
import type { ProjectInvitation } from "@/lib/project-invitations";

export function PendingInvitationsStrip({
  initial,
}: {
  initial: ProjectInvitation[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function act(invitation: ProjectInvitation, action: "accept" | "deny") {
    setBusyId(invitation.id);
    setError(null);
    try {
      const res = await fetch(`/api/project-invitations/${invitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to ${action} invitation`);
      }
      setItems((prev) => prev.filter((i) => i.id !== invitation.id));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} invitation. Please try again.`
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-accent-primary/30 bg-accent-primary-dim p-4">
      <div className="flex items-center gap-2">
        <MailPlus className="h-3.5 w-3.5 text-accent-primary" />
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-accent-primary uppercase">
          {items.length} pending invitation{items.length === 1 ? "" : "s"}
        </h2>
      </div>
      {error ? (
        <p className="text-xs text-state-error">{error}</p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border-faint">
        {items.map((inv) => {
          const busy = busyId === inv.id;
          return (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {inv.projectName}
                </p>
                <p className="text-xs text-text-muted">
                  {inv.inviterName ?? "A collaborator"} invited you to join.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => act(inv, "accept")}
                  disabled={busy}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-text-primary px-3 text-xs font-medium text-bg-base disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => act(inv, "deny")}
                  disabled={busy}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border-default bg-bg-elevated px-3 text-xs text-text-secondary disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Deny
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
