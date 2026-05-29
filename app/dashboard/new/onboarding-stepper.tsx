"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  title: string;
  subtitle: string;
  state: "done" | "active" | "upcoming";
  onJump?: () => void;
}

interface OnboardingStepperProps {
  steps: StepperStep[];
  /** Optional content rendered beneath the rail (e.g. the confidence meter). */
  footer?: React.ReactNode;
}

export function OnboardingStepper({ steps, footer }: OnboardingStepperProps) {
  return (
    <nav aria-label="Progress" className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const Indicator = (
          <span
            className={cn(
              "relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors",
              step.state === "done" &&
                "border-accent-primary/40 bg-accent-primary-dim text-accent-primary",
              step.state === "active" &&
                "border-accent-primary bg-bg-base text-text-primary",
              step.state === "upcoming" &&
                "border-border-default bg-bg-base text-text-faint",
            )}
          >
            {step.state === "done" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              index + 1
            )}
          </span>
        );

        const Label = (
          <span className="flex min-w-0 flex-col">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                step.state === "upcoming"
                  ? "text-text-muted"
                  : "text-text-primary",
              )}
            >
              {step.title}
            </span>
            <span className="text-xs text-text-faint">{step.subtitle}</span>
          </span>
        );

        return (
          <div key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute top-7 left-[13px] h-[calc(100%-1.25rem)] w-px bg-border-default"
              />
            ) : null}
            {step.onJump ? (
              <button
                type="button"
                onClick={step.onJump}
                className="flex flex-1 items-start gap-3 rounded-lg text-left"
              >
                {Indicator}
                {Label}
              </button>
            ) : (
              <div className="flex flex-1 items-start gap-3">
                {Indicator}
                {Label}
              </div>
            )}
          </div>
        );
      })}
      {footer ? <div className="mt-2">{footer}</div> : null}
    </nav>
  );
}
