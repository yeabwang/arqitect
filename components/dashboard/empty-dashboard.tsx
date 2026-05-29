"use client";

import { ArrowRight, Sparkles, Plus, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function EmptyDashboard() {
  const { openCreateDesign } = useDashboard();
  return (
    <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-surface">
      <div className="grid gap-0 sm:grid-cols-[1fr_minmax(280px,40%)]">
        <div className="flex flex-col gap-5 p-7">
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Welcome to Arqitect
          </span>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-text-primary">
            Draft your first system in minutes.
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            Sketch it on the canvas, prompt the AI architect, or import a
            template. Arqitect turns the result into a spec you can ship.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateDesign}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-text-primary px-3.5 text-[13px] font-medium text-bg-base transition-colors hover:bg-interactive-inverse-hover"
            >
              <Plus className="h-4 w-4" />
              New design
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={openCreateDesign}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated/60 px-3.5 text-[13px] font-medium text-text-primary transition-colors hover:border-border-subtle hover:bg-bg-elevated"
            >
              <Sparkles className="h-4 w-4 text-accent-primary" />
              Generate with AI
            </button>
            <Link
              href="/dashboard/templates"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated/40 px-3.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </Link>
          </div>
        </div>
        <div className="relative min-h-[220px] border-t border-border-faint sm:border-t-0 sm:border-l">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <svg
            viewBox="0 0 260 180"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <line
              x1="40"
              y1="40"
              x2="130"
              y2="80"
              stroke="var(--canvas-edge-muted)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="130"
              y1="80"
              x2="220"
              y2="40"
              stroke="var(--canvas-edge-muted)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="130"
              y1="80"
              x2="130"
              y2="140"
              stroke="var(--canvas-edge-muted)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="20"
              y="30"
              width="40"
              height="22"
              rx="3"
              fill="var(--node-neutral-fill)"
              stroke="var(--canvas-node-stroke)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="110"
              y="68"
              width="40"
              height="22"
              rx="11"
              fill="var(--node-blue-fill)"
              stroke="var(--node-blue-stroke)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="200"
              y="30"
              width="40"
              height="22"
              rx="3"
              fill="var(--node-purple-fill)"
              stroke="var(--node-purple-stroke)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              cx="130"
              cy="150"
              rx="22"
              ry="14"
              fill="var(--node-green-fill)"
              stroke="var(--node-green-stroke)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
