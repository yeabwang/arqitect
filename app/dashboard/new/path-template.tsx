"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Layers,
  Loader2,
  Pencil,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
  type TemplateComplexity,
} from "@/components/editor/starter-templates";
import { TemplatePreview } from "@/components/editor/starter-templates-modal";

interface PathTemplateProps {
  name: string;
  roomId: string;
  nameValid: boolean;
  step: 1 | 2;
  selectedId: string | null;
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onStepChange: (step: 1 | 2) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

const COMPLEXITIES: TemplateComplexity[] = [
  "Starter",
  "Intermediate",
  "Advanced",
];

const COMPLEXITY_TONE: Record<TemplateComplexity, string> = {
  Starter: "text-state-success",
  Intermediate: "text-state-warning",
  Advanced: "text-accent-primary",
};

export function PathTemplate({
  name,
  roomId,
  nameValid,
  step,
  selectedId,
  isLoading,
  onNameChange,
  onStepChange,
  onSelect,
  onCreate,
}: PathTemplateProps) {
  if (step === 1) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Name your design
          </h1>
          <p className="text-sm text-text-secondary">
            Give the system a short, clear name. You&rsquo;ll pick a pattern
            next.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="design-name"
            className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase"
          >
            Design name
          </label>
          <Input
            id="design-name"
            autoFocus
            placeholder="e.g. Billing service"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && nameValid) {
                event.preventDefault();
                onStepChange(2);
              }
            }}
          />
          {roomId ? (
            <p className="text-xs text-text-muted">
              Room ID:{" "}
              <span className="font-mono text-text-secondary">{roomId}</span>
            </p>
          ) : null}
        </div>

        <div>
          <Button disabled={!nameValid} onClick={() => onStepChange(2)}>
            Choose a template
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TemplateChooser
      name={name}
      selectedId={selectedId}
      isLoading={isLoading}
      onEditName={() => onStepChange(1)}
      onSelect={onSelect}
      onCreate={onCreate}
    />
  );
}

interface TemplateChooserProps {
  name: string;
  selectedId: string | null;
  isLoading: boolean;
  onEditName: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

function TemplateChooser({
  name,
  selectedId,
  isLoading,
  onEditName,
  onSelect,
  onCreate,
}: TemplateChooserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<TemplateComplexity | null>(null);

  const categories = useMemo(() => {
    const set = new Set(CANVAS_TEMPLATES.map((t) => t.category));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CANVAS_TEMPLATES.filter((template) => {
      if (category && template.category !== category) return false;
      if (complexity && template.complexity !== complexity) return false;
      if (!q) return true;
      const haystack = [
        template.name,
        template.description,
        template.useCase,
        template.stack,
        template.category,
        ...template.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category, complexity]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Choose a template
          </h1>
          <p className="text-sm text-text-secondary">
            Start from a proven architecture and adapt it on the canvas.
          </p>
        </div>
        <button
          type="button"
          onClick={onEditName}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
        >
          <span className="font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
            Design
          </span>
          <span className="max-w-[160px] truncate font-medium text-text-primary">
            {name || "Untitled"}
          </span>
          <Pencil className="h-3 w-3 text-text-muted" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            autoFocus
            value={query}
            placeholder="Search templates, stacks, or tags…"
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            label="All patterns"
            active={category === null}
            onClick={() => setCategory(null)}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => setCategory(category === cat ? null : cat)}
            />
          ))}
          <span aria-hidden className="mx-1 h-4 w-px bg-border-default" />
          {COMPLEXITIES.map((level) => (
            <FilterChip
              key={level}
              label={level}
              active={complexity === level}
              onClick={() =>
                setComplexity(complexity === level ? null : level)
              }
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border-faint bg-bg-surface/40 px-6 py-12 text-center">
          <Layers className="h-6 w-6 text-text-faint" />
          <p className="text-sm text-text-secondary">
            No templates match those filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
              setComplexity(null);
            }}
            className="text-xs text-accent-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-label="Choose a template"
          className="grid gap-4 sm:grid-cols-2"
        >
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={template.id === selectedId}
              onSelect={() => onSelect(template.id)}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-border-faint bg-bg-base/90 px-1 py-4 backdrop-blur">
        <p className="text-xs text-text-muted">
          {selectedId
            ? "Template selected — open the canvas to adapt it."
            : "Select a template to continue."}
        </p>
        <Button disabled={!selectedId || isLoading} onClick={onCreate}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Create design
        </Button>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors",
        active
          ? "border-accent-primary/40 bg-accent-primary-dim text-accent-primary"
          : "border-border-default bg-bg-surface text-text-muted hover:border-border-hover hover:text-text-secondary",
      )}
    >
      {label}
    </button>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: CanvasTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-bg-surface p-4 text-left transition-colors",
        selected
          ? "border-accent-primary/50 bg-accent-primary-dim"
          : "border-border-default hover:border-border-hover hover:bg-bg-elevated/40",
      )}
    >
      <TemplatePreview template={template} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-text-primary">
            {template.name}
          </span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-text-muted uppercase">
            {template.category}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected
              ? "border-accent-primary/40 bg-bg-base text-accent-primary"
              : "border-border-default text-transparent group-hover:border-border-hover",
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        {template.description}
      </p>

      <div className="flex flex-col gap-1.5 border-t border-border-faint pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-text-secondary">
            <span className="text-text-faint">Best for </span>
            {template.useCase}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] text-text-muted">
            {template.stack}
          </span>
          <span
            className={cn(
              "shrink-0 font-mono text-[10px] tracking-[0.1em] uppercase",
              COMPLEXITY_TONE[template.complexity],
            )}
          >
            {template.complexity}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {template.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border-faint bg-bg-base px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-text-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
