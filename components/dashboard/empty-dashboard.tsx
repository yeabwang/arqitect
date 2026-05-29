"use client";

import { ArrowRight, LayoutTemplate, Sparkles, Square } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { GenerationMode } from "@/types/onboarding";

interface StartPath {
  mode: GenerationMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

const START_PATHS: StartPath[] = [
  {
    mode: "blank",
    label: "Blank canvas",
    description: "Start with an empty system canvas.",
    icon: Square,
  },
  {
    mode: "prompt",
    label: "Prompt Arqitect",
    description: "Describe your system. Arqitect drafts the first pass.",
    icon: Sparkles,
    accent: true,
  },
  {
    mode: "template",
    label: "Use template",
    description: "Begin from a known architecture pattern.",
    icon: LayoutTemplate,
  },
];

export function EmptyDashboard() {
  const { openCreateDesign } = useDashboard();

  return (
    <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-surface">
      <div className="flex flex-col gap-6 p-7 sm:p-9">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            New workspace
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-text-primary">
            Design systems your team and AI can build from.
          </h2>
          <p className="max-w-xl text-sm text-text-secondary">
            You&rsquo;ll leave with a canvas and a Markdown spec ready for
            engineers or coding agents.
          </p>
        </div>

        <div
          role="group"
          aria-label="Start a design"
          className="grid gap-3 sm:grid-cols-3"
        >
          {START_PATHS.map((path) => {
            const Icon = path.icon;
            return (
              <button
                key={path.mode}
                type="button"
                onClick={() => openCreateDesign(path.mode)}
                className="group flex flex-col gap-2 rounded-xl border border-border-default bg-bg-base/40 p-4 text-left transition-colors hover:border-border-hover hover:bg-bg-elevated/50"
              >
                <span
                  className={
                    path.accent
                      ? "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-primary/30 bg-accent-primary-dim text-accent-primary"
                      : "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-bg-elevated text-text-secondary"
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm font-medium text-text-primary">
                  {path.label}
                  <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
                <span className="text-xs text-text-muted">
                  {path.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
