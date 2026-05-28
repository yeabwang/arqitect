"use client";

import { useSyncExternalStore, useState, useCallback } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";

const DISMISS_KEY = "arqitect.dashboard.get-started.dismissed";
const DISMISS_EVENT = "arqitect:get-started:dismiss";

function subscribeDismissed(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener(DISMISS_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(DISMISS_EVENT, handler);
  };
}

function getDismissedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

interface GetStartedPanelProps {
  totalDesigns: number;
  totalSpecs: number;
  totalAiRuns: number;
}

export function GetStartedPanel({
  totalDesigns,
  totalSpecs,
  totalAiRuns,
}: GetStartedPanelProps) {
  const { openCreateDesign } = useDashboard();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getServerSnapshot
  );
  const [hidden, setHidden] = useState(false);

  const dismiss = useCallback(() => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
      window.dispatchEvent(new Event(DISMISS_EVENT));
    } catch {}
  }, []);

  if (dismissed || hidden) return null;

  const steps: { idx: number; label: string; done: boolean; action?: React.ReactNode }[] = [
    {
      idx: 1,
      label: "Create your first design",
      done: totalDesigns > 0,
      action: (
        <button
          onClick={() => openCreateDesign("blank")}
          className="font-mono text-[11px] tracking-[0.12em] text-text-secondary uppercase hover:text-text-primary"
        >
          Start <ArrowRight className="inline h-3 w-3" />
        </button>
      ),
    },
    {
      idx: 2,
      label: "Generate architecture with Arqitect AI",
      done: totalAiRuns > 0,
    },
    {
      idx: 3,
      label: "Export a technical spec",
      done: totalSpecs > 0,
    },
  ];

  return (
    <section className="relative rounded-2xl border border-border-default bg-bg-surface p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss get started"
        className="absolute top-3 right-3 flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
      >
        <X className="h-3 w-3" /> Dismiss
      </button>

      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
          Get started
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_320px]">
        <ul className="flex flex-col gap-2.5">
          {steps.map((step) => (
            <li
              key={step.idx}
              className="flex items-center gap-3 rounded-xl border border-border-faint bg-bg-elevated/40 px-3 py-2.5"
            >
              <span
                className={
                  step.done
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-md border border-state-success/40 bg-state-success/10 font-mono text-[10px] text-state-success"
                    : "inline-flex h-5 w-5 items-center justify-center rounded-md border border-border-default bg-bg-base font-mono text-[10px] text-text-muted"
                }
              >
                {step.done ? "✓" : step.idx}
              </span>
              <span
                className={
                  step.done
                    ? "flex-1 text-sm text-text-muted line-through"
                    : "flex-1 text-sm text-text-primary"
                }
              >
                {step.label}
              </span>
              {step.action}
            </li>
          ))}
        </ul>

        <div className="hidden flex-col gap-3 rounded-xl border border-border-faint bg-gradient-to-br from-bg-elevated to-bg-subtle p-4 sm:flex">
          <p className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Resources
          </p>
          <Link
            href="/dashboard/templates"
            className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-base/50 hover:text-text-primary"
          >
            <span>Browse starter templates</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
          </Link>
          <Link
            href="/"
            className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-base/50 hover:text-text-primary"
          >
            <span>Read product overview</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
