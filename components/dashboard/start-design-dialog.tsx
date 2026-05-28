"use client";

import { LayoutTemplate, Plus, Sparkles, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StartDesignMode } from "@/components/dashboard/dashboard-context";

export const MAX_AI_PROMPT_LENGTH = 500;

interface ModeOption {
  value: StartDesignMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: "blank",
    label: "Blank canvas",
    description: "Start with an empty system canvas.",
    icon: Plus,
  },
  {
    value: "template",
    label: "Use template",
    description: "Load a known architecture pattern and adjust it.",
    icon: LayoutTemplate,
  },
  {
    value: "ai",
    label: "Prompt Arqitect",
    description: "Describe the system and let Arqitect draft the first pass.",
    icon: Sparkles,
  },
];

interface StartDesignDialogProps {
  open: boolean;
  mode: StartDesignMode;
  formName: string;
  aiPrompt: string;
  roomIdPreview: string;
  isLoading: boolean;
  error?: string | null;
  onModeChange: (mode: StartDesignMode) => void;
  onFormNameChange: (value: string) => void;
  onAiPromptChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function StartDesignDialog({
  open,
  mode,
  formName,
  aiPrompt,
  roomIdPreview,
  isLoading,
  error,
  onModeChange,
  onFormNameChange,
  onAiPromptChange,
  onClose,
  onSubmit,
}: StartDesignDialogProps) {
  const canSubmit = formName.trim().length > 0 && roomIdPreview.length > 0;
  const submitLabel =
    mode === "ai"
      ? "Prompt Arqitect"
      : mode === "template"
        ? "Pick template"
        : "Create design";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Start a new design</DialogTitle>
          <DialogDescription>
            Begin with a blank canvas, an architecture template, or an Arqitect
            prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-3">
          {MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onModeChange(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "group flex h-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors",
                  isActive
                    ? "border-text-primary bg-bg-elevated"
                    : "border-border-default bg-bg-surface hover:border-border-subtle hover:bg-bg-elevated/40",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                    isActive
                      ? "border-border-subtle bg-bg-base text-text-primary"
                      : "border-border-default bg-bg-elevated text-text-secondary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-semibold text-text-primary">
                  {option.label}
                </span>
                <span className="text-[11px] leading-snug text-text-muted">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="start-design-name"
            className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase"
          >
            Design name
          </label>
          <Input
            id="start-design-name"
            placeholder="e.g. Checkout system"
            value={formName}
            onChange={(event) => onFormNameChange(event.target.value)}
            autoFocus
          />
          {roomIdPreview ? (
            <p className="text-xs text-text-muted">
              Room ID:{" "}
              <span className="font-mono text-text-secondary">
                {roomIdPreview}
              </span>
            </p>
          ) : formName ? (
            <p className="text-xs text-text-muted">
              Room ID:{" "}
              <span className="font-mono text-text-faint">
                waiting for valid input&hellip;
              </span>
            </p>
          ) : null}
        </div>

        {mode === "ai" ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="start-design-prompt"
              className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase"
            >
              Prompt (optional)
            </label>
            <Textarea
              id="start-design-prompt"
              placeholder="Describe the system you want Arqitect to draft."
              value={aiPrompt}
              maxLength={MAX_AI_PROMPT_LENGTH}
              onChange={(event) => onAiPromptChange(event.target.value)}
              className="min-h-[88px] resize-none bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted"
            />
            <p className="text-[11px] text-text-faint">
              {aiPrompt.length} / {MAX_AI_PROMPT_LENGTH}. You can also write the
              prompt inside the editor.
            </p>
          </div>
        ) : null}

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !canSubmit}>
            {isLoading ? "Creating..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
