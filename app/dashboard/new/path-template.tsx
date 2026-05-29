"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { TemplatePreview } from "@/components/editor/starter-templates-modal";

interface PathTemplateProps {
  selectedId: string | null;
  nameValid: boolean;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function PathTemplate({
  selectedId,
  nameValid,
  isLoading,
  onSelect,
  onCreate,
}: PathTemplateProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        role="radiogroup"
        aria-label="Choose a template"
        className="grid gap-4 sm:grid-cols-2"
      >
        {CANVAS_TEMPLATES.map((template: CanvasTemplate) => {
          const selected = template.id === selectedId;
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(template.id)}
              className={cn(
                "group flex flex-col gap-3 rounded-2xl border bg-bg-surface p-4 text-left transition-colors",
                selected
                  ? "border-accent-primary/50 bg-accent-primary-dim"
                  : "border-border-default hover:border-border-hover hover:bg-bg-elevated/40",
              )}
            >
              <TemplatePreview template={template} />
              <div className="flex items-start justify-between gap-2">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">
                    {template.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {template.description}
                  </span>
                </span>
                {selected ? (
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent-primary/40 bg-bg-base text-accent-primary">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <Button
          onClick={onCreate}
          disabled={!nameValid || !selectedId || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Create with template
        </Button>
      </div>
    </div>
  );
}
