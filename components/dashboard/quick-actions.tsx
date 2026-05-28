"use client";

import Link from "next/link";
import { Plus, Sparkles, LayoutTemplate, ArrowRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function QuickActions() {
  const { openCreateDesign } = useDashboard();

  return (
    <section
      aria-label="Quick actions"
      className="grid gap-3 sm:grid-cols-3"
    >
      <button
        type="button"
        onClick={openCreateDesign}
        className="group flex flex-col gap-2 rounded-2xl border border-border-default bg-bg-surface p-4 text-left transition-colors hover:border-border-subtle hover:bg-bg-elevated/40"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-text-primary">
          <Plus className="h-4 w-4" />
        </span>
        <span className="mt-1 text-sm font-semibold text-text-primary">
          Blank canvas
        </span>
        <span className="text-xs text-text-muted">
          Start drawing from scratch.
        </span>
        <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-text-secondary uppercase">
          New design <ArrowRight className="h-3 w-3" />
        </span>
      </button>

      <button
        type="button"
        onClick={openCreateDesign}
        className="group flex flex-col gap-2 rounded-2xl border border-border-default bg-bg-surface p-4 text-left transition-colors hover:border-border-subtle hover:bg-bg-elevated/40"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary-dim text-accent-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="mt-1 text-sm font-semibold text-text-primary">
          Prompt the AI architect
        </span>
        <span className="text-xs text-text-muted">
          Describe a system, Arqitect drafts it.
        </span>
        <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-accent-primary uppercase">
          Generate <ArrowRight className="h-3 w-3" />
        </span>
      </button>

      <Link
        href="/dashboard/templates"
        className="group flex flex-col gap-2 rounded-2xl border border-border-default bg-bg-surface p-4 text-left transition-colors hover:border-border-subtle hover:bg-bg-elevated/40"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-text-primary">
          <LayoutTemplate className="h-4 w-4" />
        </span>
        <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
          Start from template
          <span className="rounded-md border border-border-faint bg-bg-base px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-text-faint uppercase">
            Soon
          </span>
        </span>
        <span className="text-xs text-text-muted">
          Monolith, microservices, event-driven.
        </span>
        <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
          Browse <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    </section>
  );
}
