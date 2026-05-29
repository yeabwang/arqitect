"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Layers,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRovingFocus } from "@/hooks/use-roving-focus";
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
  selectedId: string | null;
  isLoading: boolean;
  /** Project-creation error surfaced by the parent flow. */
  createError?: string | null;
  onNameChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

type RightView = "filters" | "detail";

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

const COMPLEXITY_DOT: Record<TemplateComplexity, string> = {
  Starter: "bg-state-success",
  Intermediate: "bg-state-warning",
  Advanced: "bg-accent-primary",
};

export function PathTemplate({
  name,
  roomId,
  nameValid,
  selectedId,
  isLoading,
  createError,
  onNameChange,
  onSelect,
  onCreate,
}: PathTemplateProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<TemplateComplexity | null>(null);
  const [rightView, setRightView] = useState<RightView>("filters");
  const [mobileFilters, setMobileFilters] = useState(false);

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

  const selected = useMemo(
    () => CANVAS_TEMPLATES.find((t) => t.id === selectedId) ?? null,
    [selectedId],
  );

  const selectedIndex = useMemo(
    () => filtered.findIndex((t) => t.id === selectedId),
    [filtered, selectedId],
  );

  const grid = useRovingFocus<HTMLButtonElement>({
    itemCount: filtered.length,
    selectedIndex: selectedIndex >= 0 ? selectedIndex : undefined,
    columns: "auto",
  });

  const activeFilters =
    (query.trim() ? 1 : 0) + (category ? 1 : 0) + (complexity ? 1 : 0);
  const canCreate = Boolean(selectedId) && nameValid && !isLoading;

  const statusText = !selectedId
    ? "Select a template to continue."
    : !nameValid
      ? "Name your design to continue."
      : "Ready — open the canvas to adapt it.";

  function clearFilters() {
    setQuery("");
    setCategory(null);
    setComplexity(null);
  }

  function pick(id: string) {
    onSelect(id);
    setRightView("detail");
    setMobileFilters(false);
  }

  function openFilters() {
    setRightView("filters");
    setMobileFilters((v) => !v);
  }

  const filterControls = (
    <FilterControls
      query={query}
      category={category}
      complexity={complexity}
      categories={categories}
      resultCount={filtered.length}
      activeFilters={activeFilters}
      onQuery={setQuery}
      onCategory={setCategory}
      onComplexity={setComplexity}
      onClear={clearFilters}
    />
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left — name + gallery */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header: title left, compact name + filter toggle right */}
        <div className="shrink-0 border-b border-border-default">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-8 py-5">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
                Start from a pattern
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">
                Choose a template
              </h1>
            </div>

            <div className="flex items-end gap-2.5">
              <div className="flex w-56 flex-col gap-1.5">
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
                    if (event.key === "Enter" && canCreate) {
                      event.preventDefault();
                      onCreate();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={openFilters}
                aria-pressed={rightView === "filters"}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs transition-colors focus-visible:border-accent-primary/60 focus-visible:outline-none",
                  activeFilters > 0
                    ? "border-accent-primary/40 bg-accent-primary-dim text-accent-primary"
                    : "border-border-default bg-bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilters > 0 ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 font-mono text-[9px] text-bg-base">
                    {activeFilters}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {mobileFilters ? (
          <div className="shrink-0 border-b border-border-default bg-bg-surface/40 px-8 py-4 lg:hidden">
            {filterControls}
          </div>
        ) : null}

        {/* Scrollable grid */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="mx-8 my-8 flex flex-col items-center gap-2 rounded-2xl border border-border-faint bg-bg-surface/40 px-6 py-12 text-center">
              <Layers className="h-6 w-6 text-text-faint" />
              <p className="text-sm text-text-secondary">
                No templates match those filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-accent-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="Choose a template"
              onKeyDown={grid.handleKeyDown}
              className="grid gap-3 px-8 py-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={template.id === selectedId}
                  itemProps={grid.getItemProps(index)}
                  onSelect={() => pick(template.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile action bar — detail panel hidden below lg */}
        <div className="shrink-0 border-t border-border-default bg-bg-base/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-8 py-4">
            <p className="text-xs text-text-muted">{statusText}</p>
            <Button disabled={!canCreate} onClick={onCreate}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Create design
            </Button>
          </div>
        </div>
      </div>

      {/* Right — filters / detail panel */}
      <aside className="hidden w-[380px] shrink-0 flex-col border-l border-border-default lg:flex">
        {/* Panel header — filters view only */}
        {rightView === "detail" && selected ? null : (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default px-5 py-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
              Filter templates
            </span>
            <span className="font-mono text-[10px] text-text-faint">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Panel body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rightView === "detail" && selected ? (
            <DetailContent template={selected} />
          ) : (
            <div className="p-5">{filterControls}</div>
          )}
        </div>

        {/* Shared create footer */}
        <div className="shrink-0 border-t border-border-default p-5">
          {createError ? (
            <p className="mb-2 text-xs text-state-error">{createError}</p>
          ) : null}
          <Button className="w-full" disabled={!canCreate} onClick={onCreate}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Create design
          </Button>
          <p className="mt-2 text-center text-[11px] text-text-faint">
            {statusText}
            {roomId ? (
              <>
                {" · "}
                <span className="font-mono text-text-muted">{roomId}</span>
              </>
            ) : null}
          </p>
        </div>
      </aside>
    </div>
  );
}

function FilterControls({
  query,
  category,
  complexity,
  categories,
  resultCount,
  activeFilters,
  onQuery,
  onCategory,
  onComplexity,
  onClear,
}: {
  query: string;
  category: string | null;
  complexity: TemplateComplexity | null;
  categories: string[];
  resultCount: number;
  activeFilters: number;
  onQuery: (value: string) => void;
  onCategory: (value: string | null) => void;
  onComplexity: (value: TemplateComplexity | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          placeholder="Search templates, stacks, tags…"
          onChange={(event) => onQuery(event.target.value)}
          className="pl-9"
        />
      </div>

      <FilterGroup label="Pattern">
        <FilterChip
          label="All"
          active={category === null}
          onClick={() => onCategory(null)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            label={cat}
            active={category === cat}
            onClick={() => onCategory(category === cat ? null : cat)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Complexity">
        {COMPLEXITIES.map((level) => (
          <FilterChip
            key={level}
            label={level}
            active={complexity === level}
            onClick={() => onComplexity(complexity === level ? null : level)}
          />
        ))}
      </FilterGroup>

      <div className="flex items-center justify-between border-t border-border-faint pt-4">
        <span className="font-mono text-[10px] text-text-faint">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </span>
        {activeFilters > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function DetailContent({ template }: { template: CanvasTemplate }) {
  return (
    <div className="flex flex-col gap-5 p-5">
      <TemplatePreview
        template={template}
        className="h-44 rounded-2xl border-border-default"
      />

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
          {template.category}
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
          {template.name}
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-text-secondary">
        {template.description}
      </p>

      <dl className="flex flex-col gap-3 border-t border-border-faint pt-4">
        <DetailRow label="Best for" value={template.useCase} />
        <DetailRow label="Stack" value={template.stack} mono />
        <div className="flex items-center justify-between gap-3">
          <dt className="font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
            Complexity
          </dt>
          <dd
            className={cn(
              "font-mono text-[11px] tracking-[0.1em] uppercase",
              COMPLEXITY_TONE[template.complexity],
            )}
          >
            {template.complexity}
          </dd>
        </div>
      </dl>

      {template.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border-faint pt-4">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border-faint bg-bg-base px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "text-right text-xs leading-relaxed text-text-secondary",
          mono && "font-mono text-text-muted",
        )}
      >
        {value}
      </dd>
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
        "rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors focus-visible:border-accent-primary/60 focus-visible:outline-none",
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
  itemProps,
  onSelect,
}: {
  template: CanvasTemplate;
  selected: boolean;
  itemProps: {
    ref: (node: HTMLButtonElement | null) => void;
    tabIndex: number;
    onFocus: () => void;
  };
  onSelect: () => void;
}) {
  const nodeCount = template.nodes.length;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      {...itemProps}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:border-accent-primary/60 focus-visible:outline-none",
        selected
          ? "border-accent-primary/50 bg-accent-primary-dim"
          : "border-border-default bg-bg-surface hover:border-border-hover hover:bg-bg-elevated/40",
      )}
    >
      {/* Top: category + selected check */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
              selected
                ? "border-accent-primary/40 bg-bg-base text-accent-primary"
                : "border-border-default bg-bg-elevated text-text-muted group-hover:text-text-secondary",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
          </span>
          <span className="truncate font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
            {template.category}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected
              ? "border-accent-primary/40 bg-bg-base text-accent-primary"
              : "border-transparent text-transparent",
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>

      {/* Name + description */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold tracking-tight text-text-primary">
          {template.name}
        </span>
        <span className="line-clamp-2 text-xs leading-relaxed text-text-muted">
          {template.description}
        </span>
      </div>

      {/* Footer: stack + node count + complexity */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-faint pt-3">
        <span className="truncate font-mono text-[10px] text-text-muted">
          {template.stack}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-[10px] text-text-faint">
            {nodeCount} node{nodeCount === 1 ? "" : "s"}
          </span>
          <span aria-hidden className="h-2.5 w-px bg-border-default" />
          <span className="inline-flex items-center gap-1">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                COMPLEXITY_DOT[template.complexity],
              )}
            />
            <span
              className={cn(
                "font-mono text-[10px] tracking-[0.1em] uppercase",
                COMPLEXITY_TONE[template.complexity],
              )}
            >
              {template.complexity}
            </span>
          </span>
        </span>
      </div>
    </button>
  );
}
