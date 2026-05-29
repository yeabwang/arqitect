"use client";

import { useRef } from "react";
import { ArrowRight, LayoutTemplate, Sparkles, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationMode } from "@/types/onboarding";

interface OnboardingHubProps {
  onChoose: (path: GenerationMode) => void;
}

const CARDS: Array<{
  mode: GenerationMode;
  label: string;
  description: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  preview: React.ReactNode;
}> = [
  {
    mode: "blank",
    label: "Blank canvas",
    description: "Start with an empty system canvas and build it your way.",
    cta: "Start blank",
    icon: Square,
    preview: <BlankPreview />,
  },
  {
    mode: "template",
    label: "Use a template",
    description: "Begin from a known architecture pattern and adjust it.",
    cta: "Browse templates",
    icon: LayoutTemplate,
    preview: <TemplatePreviewGlyph />,
  },
  {
    mode: "prompt",
    label: "Prompt Arqitect",
    description: "Describe your system. Arqitect drafts the first pass.",
    cta: "Describe it",
    icon: Sparkles,
    accent: true,
    preview: <PromptPreviewGlyph />,
  },
];

export function OnboardingHub({ onChoose }: OnboardingHubProps) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleGridKeyDown(event: React.KeyboardEvent) {
    const count = CARDS.length;
    const active = cardRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = active < 0 ? 0 : (active + 1) % count;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = active < 0 ? 0 : (active - 1 + count) % count;
    } else {
      return;
    }
    event.preventDefault();
    cardRefs.current[next]?.focus();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
          New design
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Design a system you can build from.
        </h1>
        <p className="max-w-xl text-sm text-text-secondary">
          Pick how you want to start. You can switch approaches at any time —
          you&rsquo;ll leave with a canvas ready for engineers or coding agents.
        </p>
      </div>

      <div
        className="grid w-full gap-4 sm:grid-cols-3"
        onKeyDown={handleGridKeyDown}
      >
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={card.mode}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              onClick={() => onChoose(card.mode)}
              className={cn(
                "group flex flex-col gap-4 rounded-2xl border bg-bg-surface p-5 text-left transition-colors focus-visible:border-accent-primary/60 focus-visible:outline-none",
                card.accent
                  ? "border-accent-primary/30 hover:border-accent-primary/60"
                  : "border-border-default hover:border-border-hover hover:bg-bg-elevated/40",
              )}
            >
              <div className="overflow-hidden rounded-xl border border-border-faint bg-bg-base">
                {card.preview}
              </div>
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                  card.accent
                    ? "border-accent-primary/30 bg-accent-primary-dim text-accent-primary"
                    : "border-border-default bg-bg-elevated text-text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-primary">
                  {card.label}
                </span>
                <span className="text-xs text-text-muted">
                  {card.description}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] uppercase",
                  card.accent ? "text-accent-primary" : "text-text-secondary",
                )}
              >
                {card.cta}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlankPreview() {
  return (
    <svg viewBox="0 0 200 110" className="h-28 w-full" aria-hidden>
      <defs>
        <pattern id="hub-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" className="fill-border-subtle" />
        </pattern>
      </defs>
      <rect width="200" height="110" fill="url(#hub-dots)" />
    </svg>
  );
}

function TemplatePreviewGlyph() {
  return (
    <svg viewBox="0 0 200 110" className="h-28 w-full" aria-hidden>
      <rect width="200" height="110" className="fill-bg-base" />
      <rect x="20" y="22" width="46" height="26" rx="6" className="fill-bg-elevated stroke-border-subtle" />
      <rect x="134" y="22" width="46" height="26" rx="6" className="fill-bg-elevated stroke-border-subtle" />
      <rect x="77" y="62" width="46" height="26" rx="6" className="fill-bg-elevated stroke-border-subtle" />
      <line x1="66" y1="35" x2="100" y2="62" className="stroke-text-faint" strokeWidth="1.5" />
      <line x1="134" y1="35" x2="100" y2="62" className="stroke-text-faint" strokeWidth="1.5" />
    </svg>
  );
}

function PromptPreviewGlyph() {
  return (
    <svg viewBox="0 0 200 110" className="h-28 w-full" aria-hidden>
      <rect width="200" height="110" className="fill-bg-base" />
      <rect x="20" y="24" width="120" height="12" rx="6" className="fill-bg-elevated" />
      <rect x="20" y="44" width="90" height="12" rx="6" className="fill-bg-elevated" />
      <rect x="20" y="74" width="60" height="20" rx="6" className="fill-accent-primary-dim stroke-accent-primary/40" />
      <circle cx="160" cy="40" r="14" className="fill-none stroke-accent-primary/50" strokeWidth="1.5" />
    </svg>
  );
}
