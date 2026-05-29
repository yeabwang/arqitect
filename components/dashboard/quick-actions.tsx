"use client";

import { Square, LayoutTemplate, Sparkles, ArrowRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { GenerationMode } from "@/types/onboarding";

interface QuickActionTile {
  mode: GenerationMode;
  label: string;
  description: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

const TILES: QuickActionTile[] = [
  {
    mode: "blank",
    label: "Blank canvas",
    description: "Start with an empty system canvas.",
    cta: "New design",
    icon: Square,
  },
  {
    mode: "prompt",
    label: "Prompt Arqitect",
    description: "Describe your system. Arqitect will draft the first pass.",
    cta: "Describe it",
    icon: Sparkles,
    accent: true,
  },
  {
    mode: "template",
    label: "Use template",
    description: "Begin from a known architecture pattern and adjust it.",
    cta: "Browse",
    icon: LayoutTemplate,
  },
];

export function QuickActions() {
  const { openCreateDesign } = useDashboard();

  return (
    <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">
      {TILES.map((tile) => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.mode}
            type="button"
            onClick={() => openCreateDesign(tile.mode)}
            className="group flex flex-col gap-2 rounded-2xl border border-border-default bg-bg-surface p-4 text-left transition-colors hover:border-border-subtle hover:bg-bg-elevated/40"
          >
            <span
              className={
                tile.accent
                  ? "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary-dim text-accent-primary"
                  : "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-text-primary"
              }
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="mt-1 text-sm font-semibold text-text-primary">
              {tile.label}
            </span>
            <span className="text-xs text-text-muted">{tile.description}</span>
            <span
              className={
                tile.accent
                  ? "mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-accent-primary uppercase"
                  : "mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-text-secondary uppercase"
              }
            >
              {tile.cta} <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </section>
  );
}
