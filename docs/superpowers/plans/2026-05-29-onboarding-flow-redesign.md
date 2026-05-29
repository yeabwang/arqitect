# Full-screen Guided Onboarding Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped "new design" dialog with a full-screen `/dashboard/new` onboarding surface — a hub of three choice cards plus a consistent two-column path view (left content + name, right vertical stepper rail) for blank / template / prompt paths.

**Architecture:** A new Next.js route under `app/dashboard/new/` renders a client `OnboardingFlow` shell as a `fixed inset-0` overlay. The shell owns all state (path, name, prompt answers, template selection) and a single `createDesign(payload, destination)` helper ported from the old dialog. Path bodies are controlled presentational components. Existing onboarding backend (project create, pending-generation, interview field metadata, editor `?start=ai` review) is reused unchanged; the only editor change is auto-importing a template passed via `?template=<id>`.

**Tech Stack:** Next.js (App Router, RSC), React client components, Tailwind v4 + CSS-variable tokens, shadcn/ui (`Button`/`Input`/`Textarea`), lucide-react icons, `node:test` + `tsx` for unit tests.

---

## Spec

`docs/superpowers/specs/2026-05-29-onboarding-flow-redesign-design.md`

## Conventions (read before starting)

- **Colors:** only CSS-variable Tailwind tokens (`bg-bg-base`, `bg-bg-surface`, `bg-bg-elevated`, `border-border-default`, `border-border-hover`, `text-text-primary`, `text-text-muted`, `text-text-faint`, `accent-primary`, `accent-primary-dim`, `state-error`, `state-warning`). No raw hex, no `zinc-*`.
- **Radius:** inline `rounded-xl`, cards `rounded-2xl`, overlay `rounded-3xl` (the overlay here is full-bleed so no outer radius).
- **Icons:** lucide stroke icons, `h-4 w-4` inline / `h-5 w-5` buttons.
- **Motion:** restrained CSS/Tailwind transitions only (fade/slide on step change, focus states, meter fill). No GSAP, no celebratory animation.
- **Tests:** run a single file with `npx tsx --test <file>`. Tests use `import { describe, it } from "node:test"` and `import assert from "node:assert/strict"`. There is no DOM/component test runner — UI is verified by `npx tsc --noEmit`, touched-file ESLint, and `npm run build`.
- **Commits:** end every commit message with the Co-Authored-By trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```

## File structure

**New**
- `app/dashboard/new/page.tsx` — server page; auth via layout, reads `?path`, renders shell.
- `app/dashboard/new/onboarding-flow.tsx` — client shell; owns state + `createDesign`.
- `app/dashboard/new/onboarding-hub.tsx` — hub view (3 choice cards + SVG previews).
- `app/dashboard/new/onboarding-stepper.tsx` — right-rail vertical stepper + confidence meter.
- `app/dashboard/new/path-blank.tsx` — blank path body.
- `app/dashboard/new/path-template.tsx` — template gallery body.
- `app/dashboard/new/path-prompt.tsx` — goal-first stepper body.

**Edited**
- `types/onboarding.ts` — add `PROMPT_STEPS`.
- `components/editor/starter-templates-modal.tsx` — export `TemplatePreview`.
- `components/dashboard/dashboard-context.tsx` — `openCreateDesign` signature unchanged, now navigates.
- `components/dashboard/dashboard-shell.tsx` — drop dialog state + mount; implement nav helper.
- `components/dashboard/quick-actions.tsx` / `empty-dashboard.tsx` / `get-started-panel.tsx` / `dashboard-sidebar.tsx` — call the (now-navigating) `openCreateDesign`.
- `app/editor/[roomId]/page.tsx` — read `?template=`, thread `templateId`.
- `components/editor/editor-workspace-client.tsx` — accept + thread `templateId`.
- `components/editor/canvas-workspace.tsx` — one-shot template auto-import.

**Deleted**
- `components/dashboard/start-design-dialog.tsx`.

---

## Task 1: Add `PROMPT_STEPS` grouping to onboarding types

**Files:**
- Modify: `types/onboarding.ts`
- Test: `types/onboarding.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `types/onboarding.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INTERVIEW_FIELDS,
  INTERVIEW_FIELD_META,
  PROMPT_STEPS,
} from "./onboarding";

describe("PROMPT_STEPS", () => {
  it("covers every interview field exactly once", () => {
    const grouped = PROMPT_STEPS.flatMap((step) => step.fields);
    assert.deepEqual([...grouped].sort(), [...INTERVIEW_FIELDS].sort());
    assert.equal(grouped.length, INTERVIEW_FIELDS.length);
    assert.equal(new Set(grouped).size, grouped.length);
  });

  it("puts the required systemGoal in the first step", () => {
    assert.equal(PROMPT_STEPS[0]!.fields[0], "systemGoal");
    assert.equal(INTERVIEW_FIELD_META.systemGoal.required, true);
  });

  it("references only known fields", () => {
    for (const step of PROMPT_STEPS) {
      for (const field of step.fields) {
        assert.ok(INTERVIEW_FIELD_META[field], `unknown field ${field}`);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test types/onboarding.test.ts`
Expected: FAIL — `PROMPT_STEPS` is not exported (`SyntaxError`/`undefined`).

- [ ] **Step 3: Add `PROMPT_STEPS`**

Append to `types/onboarding.ts` (after `INTERVIEW_FIELD_META`, before `InterviewAnswers`):

```ts
/**
 * Field groupings for the goal-first guided prompt flow. Pure grouping over the
 * existing INTERVIEW_FIELDS — the per-field metadata, payload schema, and
 * deriveOpenQuestions are all unchanged. Step 1 holds the only required field.
 */
export const PROMPT_STEPS = [
  {
    id: "goal",
    title: "Goal",
    subtitle: "What you're designing",
    fields: ["systemGoal"],
  },
  {
    id: "people",
    title: "People & flows",
    subtitle: "Users and critical paths",
    fields: ["primaryUsers", "criticalFlows"],
  },
  {
    id: "data",
    title: "Data & integrations",
    subtitle: "What it stores and talks to",
    fields: ["dataStores", "integrations"],
  },
  {
    id: "ops",
    title: "Runtime, scale & limits",
    subtitle: "Where it runs and constraints",
    fields: ["runtimeContext", "scaleExpectations", "constraints"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  subtitle: string;
  fields: ReadonlyArray<InterviewField>;
}>;

export type PromptStep = (typeof PROMPT_STEPS)[number];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test types/onboarding.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add types/onboarding.ts types/onboarding.test.ts
git commit -m "feat: add PROMPT_STEPS grouping for guided onboarding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Export `TemplatePreview` for gallery reuse

**Files:**
- Modify: `components/editor/starter-templates-modal.tsx:143`

- [ ] **Step 1: Add the `export` keyword**

In `components/editor/starter-templates-modal.tsx`, change the declaration at line 143 from:

```tsx
function TemplatePreview({ template }: { template: CanvasTemplate }) {
```

to:

```tsx
export function TemplatePreview({ template }: { template: CanvasTemplate }) {
```

Leave the body unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/editor/starter-templates-modal.tsx
git commit -m "refactor: export TemplatePreview for onboarding gallery reuse

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Route shell + hub + stepper + blank path

This task produces a reachable, building `/dashboard/new` route. Entry points are rewired in Task 6, so until then the route is reached by typing the URL.

**Files:**
- Create: `app/dashboard/new/page.tsx`
- Create: `app/dashboard/new/onboarding-flow.tsx`
- Create: `app/dashboard/new/onboarding-hub.tsx`
- Create: `app/dashboard/new/onboarding-stepper.tsx`
- Create: `app/dashboard/new/path-blank.tsx`

- [ ] **Step 1: Create the server page**

`app/dashboard/new/page.tsx`:

```tsx
import type { GenerationMode } from "@/types/onboarding";
import { OnboardingFlow } from "./onboarding-flow";

// Auth is enforced by app/dashboard/layout.tsx (redirects unauthenticated users).
interface NewDesignPageProps {
  searchParams: Promise<{ path?: string }>;
}

function resolvePath(path: string | undefined): GenerationMode | null {
  if (path === "blank" || path === "template" || path === "prompt") {
    return path;
  }
  return null;
}

export default async function NewDesignPage({
  searchParams,
}: NewDesignPageProps) {
  const { path } = await searchParams;
  return <OnboardingFlow initialPath={resolvePath(path)} />;
}
```

- [ ] **Step 2: Create the stepper rail**

`app/dashboard/new/onboarding-stepper.tsx`:

```tsx
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
```

- [ ] **Step 3: Create the hub view**

`app/dashboard/new/onboarding-hub.tsx`:

```tsx
"use client";

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

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.mode}
              type="button"
              onClick={() => onChoose(card.mode)}
              className={cn(
                "group flex flex-col gap-4 rounded-2xl border bg-bg-surface p-5 text-left transition-colors",
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
```

- [ ] **Step 4: Create the blank path body**

`app/dashboard/new/path-blank.tsx`:

```tsx
"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PathBlankProps {
  nameValid: boolean;
  isLoading: boolean;
  onCreate: () => void;
}

export function PathBlank({ nameValid, isLoading, onCreate }: PathBlankProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-secondary">
        We&rsquo;ll open an empty canvas under your design name. Add components,
        draw connections, and bring in Arqitect whenever you want a hand.
      </p>
      <div>
        <Button onClick={onCreate} disabled={!nameValid || isLoading}>
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
```

- [ ] **Step 5: Create the shell (hub + blank wired; template/prompt stubbed)**

`app/dashboard/new/onboarding-flow.tsx`:

```tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildRoomId, generateRoomIdSuffix } from "@/lib/project-slug";
import type {
  GenerationMode,
  PendingGenerationPayload,
} from "@/types/onboarding";
import { OnboardingHub } from "./onboarding-hub";
import { OnboardingStepper, type StepperStep } from "./onboarding-stepper";
import { PathBlank } from "./path-blank";

interface OnboardingFlowProps {
  initialPath: GenerationMode | null;
}

const PATH_COPY: Record<
  GenerationMode,
  { title: string; subtitle: string }
> = {
  blank: {
    title: "Start from a blank canvas",
    subtitle: "Name it, then jump straight into the editor.",
  },
  template: {
    title: "Start from a template",
    subtitle: "Name it and pick a pattern to begin from.",
  },
  prompt: {
    title: "Describe your system",
    subtitle: "A few focused questions so Arqitect drafts something real.",
  },
};

export function OnboardingFlow({ initialPath }: OnboardingFlowProps) {
  const router = useRouter();

  const [path, setPath] = useState<GenerationMode | null>(initialPath);
  const [name, setName] = useState("");
  const [suffix] = useState(() => generateRoomIdSuffix());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createdProjectIdRef = useRef<string | null>(null);

  const roomId = useMemo(() => buildRoomId(name, suffix), [name, suffix]);
  const nameValid = name.trim().length > 0 && roomId.length > 0;

  const choosePath = useCallback(
    (next: GenerationMode) => {
      setPath(next);
      setError(null);
      window.history.replaceState(null, "", `/dashboard/new?path=${next}`);
    },
    [],
  );

  const backToHub = useCallback(() => {
    setPath(null);
    setError(null);
    window.history.replaceState(null, "", "/dashboard/new");
  }, []);

  const close = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Single create + navigate helper, ported from the old start-design dialog.
  // Does not clear isLoading on success — navigation is in flight.
  const createDesign = useCallback(
    async (
      payload: PendingGenerationPayload | null,
      destination: (projectId: string) => string,
    ) => {
      if (!nameValid || isLoading) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        let projectId = createdProjectIdRef.current;
        if (!projectId) {
          const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), id: roomId }),
          });
          if (!res.ok) {
            throw new Error("create-project");
          }
          const project = (await res.json()) as { id: string };
          projectId = project.id;
          createdProjectIdRef.current = projectId;
        }

        if (payload) {
          const res = await fetch(
            `/api/projects/${projectId}/pending-generation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload }),
            },
          );
          if (!res.ok) {
            throw new Error("pending-generation");
          }
        }

        router.push(destination(projectId));
      } catch {
        setIsLoading(false);
        setError("Couldn't create your design. Please try again.");
      }
    },
    [isLoading, name, nameValid, roomId, router],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg-base">
      <header className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <span className="font-mono text-sm font-semibold tracking-tight text-text-primary">
          Arqitect
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          disabled={isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {path === null ? (
        <OnboardingHub onChoose={choosePath} />
      ) : (
        <div className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_240px]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                {PATH_COPY[path].title}
              </h1>
              <p className="text-sm text-text-secondary">
                {PATH_COPY[path].subtitle}
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
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
              />
              {roomId ? (
                <p className="text-xs text-text-muted">
                  Room ID:{" "}
                  <span className="font-mono text-text-secondary">
                    {roomId}
                  </span>
                </p>
              ) : null}
            </div>

            {path === "blank" ? (
              <PathBlank
                nameValid={nameValid}
                isLoading={isLoading}
                onCreate={() =>
                  void createDesign(null, (id) => `/editor/${id}`)
                }
              />
            ) : (
              <p className="text-sm text-text-muted">Coming in the next task.</p>
            )}

            {error ? (
              <p className="text-xs text-state-error">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={backToHub}
              disabled={isLoading}
              className="self-start text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
            >
              ← Back to start
            </button>
          </div>

          <aside className="hidden lg:block">
            <OnboardingStepper steps={blankSteps(nameValid)} />
          </aside>
        </div>
      )}
    </div>
  );
}

function blankSteps(nameValid: boolean): StepperStep[] {
  return [
    {
      id: "name",
      title: "Name your design",
      subtitle: "Give it a short, clear name",
      state: nameValid ? "done" : "active",
    },
    {
      id: "canvas",
      title: "Open canvas",
      subtitle: "Start building",
      state: "upcoming",
    },
  ];
}
```

- [ ] **Step 6: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint app/dashboard/new/`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds; `/dashboard/new` appears in the route list.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/new/
git commit -m "feat: full-screen onboarding route with hub, stepper, blank path

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Template gallery path

**Files:**
- Create: `app/dashboard/new/path-template.tsx`
- Modify: `app/dashboard/new/onboarding-flow.tsx`

- [ ] **Step 1: Create the template gallery body**

`app/dashboard/new/path-template.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire template state into the shell**

In `app/dashboard/new/onboarding-flow.tsx`:

Add the import near the other path imports:

```tsx
import { PathTemplate } from "./path-template";
```

Add template-selection state next to the other `useState` calls:

```tsx
  const [templateId, setTemplateId] = useState<string | null>(null);
```

Replace the body branch (the `path === "blank" ? ... : <p>Coming in the next task.</p>` block) with:

```tsx
            {path === "blank" ? (
              <PathBlank
                nameValid={nameValid}
                isLoading={isLoading}
                onCreate={() =>
                  void createDesign(null, (id) => `/editor/${id}`)
                }
              />
            ) : path === "template" ? (
              <PathTemplate
                selectedId={templateId}
                nameValid={nameValid}
                isLoading={isLoading}
                onSelect={(id) => {
                  setTemplateId(id);
                  if (error) setError(null);
                }}
                onCreate={() =>
                  void createDesign(
                    null,
                    (id) =>
                      `/editor/${id}?start=template&template=${templateId}`,
                  )
                }
              />
            ) : (
              <p className="text-sm text-text-muted">Coming in the next task.</p>
            )}
```

Replace the right-rail `<OnboardingStepper steps={blankSteps(nameValid)} />` with a path-aware selection:

```tsx
            <OnboardingStepper
              steps={
                path === "template"
                  ? templateSteps(nameValid, templateId !== null)
                  : blankSteps(nameValid)
              }
            />
```

Add the `templateSteps` helper next to `blankSteps`:

```tsx
function templateSteps(nameValid: boolean, picked: boolean): StepperStep[] {
  return [
    {
      id: "name",
      title: "Name your design",
      subtitle: "Give it a short, clear name",
      state: nameValid ? "done" : "active",
    },
    {
      id: "pick",
      title: "Choose a template",
      subtitle: "Start from a known pattern",
      state: picked ? "done" : nameValid ? "active" : "upcoming",
    },
    {
      id: "canvas",
      title: "Open canvas",
      subtitle: "Adjust and build",
      state: "upcoming",
    },
  ];
}
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint app/dashboard/new/`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/new/
git commit -m "feat: template gallery onboarding path

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Goal-first prompt path

The prompt step/answer state lives in the shell so the right-rail stepper and the left body stay in sync.

**Files:**
- Create: `app/dashboard/new/path-prompt.tsx`
- Modify: `app/dashboard/new/onboarding-flow.tsx`

- [ ] **Step 1: Create the prompt body**

`app/dashboard/new/path-prompt.tsx`:

```tsx
"use client";

import { ArrowLeft, ArrowRight, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERVIEW_FIELD_META,
  PROMPT_STEPS,
  type InterviewAnswers,
  type InterviewField,
} from "@/types/onboarding";

export type PromptStyle = "interview" | "free-form";

interface PathPromptProps {
  answers: InterviewAnswers;
  stepIndex: number;
  promptStyle: PromptStyle;
  freePrompt: string;
  nameValid: boolean;
  isLoading: boolean;
  goalAnswered: boolean;
  onAnswerChange: (field: InterviewField, value: string) => void;
  onStepChange: (index: number) => void;
  onFreePromptChange: (value: string) => void;
  onUseFreeForm: () => void;
  onUseInterview: () => void;
  onSubmit: () => void;
}

export function PathPrompt({
  answers,
  stepIndex,
  promptStyle,
  freePrompt,
  nameValid,
  isLoading,
  goalAnswered,
  onAnswerChange,
  onStepChange,
  onFreePromptChange,
  onUseFreeForm,
  onUseInterview,
  onSubmit,
}: PathPromptProps) {
  if (promptStyle === "free-form") {
    return (
      <div className="flex flex-col gap-4">
        <Textarea
          autoFocus
          value={freePrompt}
          placeholder="Describe the system you want Arqitect to draft..."
          onChange={(event) => onFreePromptChange(event.target.value)}
          className="min-h-[180px] resize-none bg-bg-elevated text-sm"
        />
        <p className="rounded-lg border border-state-warning/30 bg-state-warning/10 px-3 py-2 text-xs text-state-warning">
          Free-form prompts produce designs with more open questions and lower
          confidence. That&rsquo;s visible in the result, not hidden.
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onUseInterview}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
          >
            <PenLine className="h-3.5 w-3.5" />
            Back to guided questions
          </button>
          <Button
            onClick={onSubmit}
            disabled={isLoading || !nameValid || freePrompt.trim().length === 0}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Draft now
          </Button>
        </div>
      </div>
    );
  }

  const step = PROMPT_STEPS[stepIndex]!;
  const isLastStep = stepIndex === PROMPT_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {step.fields.map((field, fieldIndex) => {
          const meta = INTERVIEW_FIELD_META[field];
          const value = answers[field];
          return (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">
                {meta.question}
                {meta.required ? null : (
                  <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-text-faint uppercase">
                    Optional
                  </span>
                )}
              </label>
              <p className="text-xs text-text-muted">{meta.hint}</p>
              {meta.multiline ? (
                <Textarea
                  autoFocus={fieldIndex === 0}
                  value={value}
                  placeholder={meta.placeholder}
                  onChange={(event) => onAnswerChange(field, event.target.value)}
                  className="min-h-[88px] resize-none bg-bg-elevated text-sm"
                />
              ) : (
                <Input
                  autoFocus={fieldIndex === 0}
                  value={value}
                  placeholder={meta.placeholder}
                  onChange={(event) => onAnswerChange(field, event.target.value)}
                  className="bg-bg-elevated"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStepChange(stepIndex - 1)}
          disabled={isLoading || stepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {!isLastStep ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStepChange(stepIndex + 1)}
              disabled={isLoading}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            onClick={onSubmit}
            disabled={isLoading || !nameValid || !goalAnswered}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Draft now
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={onUseFreeForm}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 self-start text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
      >
        <PenLine className="h-3.5 w-3.5" />
        Skip the questions and write a free-form prompt
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire prompt state into the shell**

In `app/dashboard/new/onboarding-flow.tsx`:

Extend imports:

```tsx
import {
  INTERVIEW_FIELDS,
  INTERVIEW_FIELD_META,
  PROMPT_STEPS,
  deriveOpenQuestions,
  emptyInterviewAnswers,
  type GenerationMode,
  type InterviewAnswers,
  type PendingGenerationPayload,
} from "@/types/onboarding";
import { PathPrompt, type PromptStyle } from "./path-prompt";
```

(Remove the now-duplicated narrow `import type { GenerationMode, PendingGenerationPayload }` line if present — keep a single combined import.)

Add prompt state next to the other `useState` calls:

```tsx
  const [answers, setAnswers] = useState<InterviewAnswers>(
    emptyInterviewAnswers,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [promptStyle, setPromptStyle] = useState<PromptStyle>("interview");
  const [freePrompt, setFreePrompt] = useState("");

  const goalAnswered = answers.systemGoal.trim().length > 0;
```

Add the prompt submit handler after `createDesign`:

```tsx
  const submitPrompt = useCallback(() => {
    if (promptStyle === "free-form") {
      const trimmed = freePrompt.trim();
      if (trimmed.length === 0) {
        setError("Add a prompt, or switch back to the guided questions.");
        return;
      }
      const payload: PendingGenerationPayload = {
        kind: "free-form",
        prompt: trimmed,
        openQuestions: INTERVIEW_FIELDS.filter(
          (field) => !INTERVIEW_FIELD_META[field].required,
        ).map((field) => INTERVIEW_FIELD_META[field].openQuestion),
      };
      void createDesign(payload, (id) => `/editor/${id}?start=ai`);
      return;
    }

    if (answers.systemGoal.trim().length === 0) {
      setError("A system goal is required before we can draft anything.");
      setStepIndex(0);
      return;
    }

    const trimmedAnswers = INTERVIEW_FIELDS.reduce((acc, field) => {
      acc[field] = answers[field].trim();
      return acc;
    }, {} as InterviewAnswers);

    const payload: PendingGenerationPayload = {
      kind: "interview",
      answers: trimmedAnswers,
      openQuestions: deriveOpenQuestions(trimmedAnswers),
    };
    void createDesign(payload, (id) => `/editor/${id}?start=ai`);
  }, [answers, createDesign, freePrompt, promptStyle]);
```

Replace the `<p>Coming in the next task.</p>` fallback with the prompt body:

```tsx
            ) : (
              <PathPrompt
                answers={answers}
                stepIndex={stepIndex}
                promptStyle={promptStyle}
                freePrompt={freePrompt}
                nameValid={nameValid}
                isLoading={isLoading}
                goalAnswered={goalAnswered}
                onAnswerChange={(field, value) => {
                  setAnswers((prev) => ({ ...prev, [field]: value }));
                  if (error) setError(null);
                }}
                onStepChange={(index) =>
                  setStepIndex(
                    Math.min(Math.max(index, 0), PROMPT_STEPS.length - 1),
                  )
                }
                onFreePromptChange={(value) => {
                  setFreePrompt(value);
                  if (error) setError(null);
                }}
                onUseFreeForm={() => {
                  setPromptStyle("free-form");
                  setError(null);
                }}
                onUseInterview={() => {
                  setPromptStyle("interview");
                  setError(null);
                }}
                onSubmit={submitPrompt}
              />
            )}
```

Extend the right-rail selection to handle the prompt path with a confidence meter:

```tsx
            <OnboardingStepper
              steps={
                path === "template"
                  ? templateSteps(nameValid, templateId !== null)
                  : path === "prompt"
                    ? promptSteps(answers, stepIndex, promptStyle, setStepIndex)
                    : blankSteps(nameValid)
              }
              footer={
                path === "prompt" && promptStyle === "interview" ? (
                  <ConfidenceMeter answers={answers} />
                ) : null
              }
            />
```

Add the prompt rail helper + confidence meter at the bottom of the file:

```tsx
function promptSteps(
  answers: InterviewAnswers,
  stepIndex: number,
  promptStyle: PromptStyle,
  onJump: (index: number) => void,
): StepperStep[] {
  if (promptStyle === "free-form") {
    return [
      {
        id: "free",
        title: "Free-form prompt",
        subtitle: "Describe it your way",
        state: "active",
      },
    ];
  }
  return PROMPT_STEPS.map((step, index) => ({
    id: step.id,
    title: step.title,
    subtitle: step.subtitle,
    state:
      index < stepIndex ? "done" : index === stepIndex ? "active" : "upcoming",
    onJump: () => onJump(index),
  }));
}

function ConfidenceMeter({ answers }: { answers: InterviewAnswers }) {
  const recommended = INTERVIEW_FIELDS.filter(
    (field) => !INTERVIEW_FIELD_META[field].required,
  );
  const answered = recommended.filter(
    (field) => answers[field].trim().length > 0,
  ).length;
  const pct = Math.round((answered / recommended.length) * 100);
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border-faint bg-bg-elevated/40 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
          Confidence
        </span>
        <span className="font-mono text-[10px] text-text-secondary">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-base">
        <div
          className="h-full rounded-full bg-accent-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-text-faint">
        Unanswered fields become open questions on the draft.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint app/dashboard/new/`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/new/
git commit -m "feat: goal-first prompt onboarding path with confidence meter

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Rewire entry points to the route; delete the dialog

**Files:**
- Modify: `components/dashboard/dashboard-context.tsx`
- Modify: `components/dashboard/dashboard-shell.tsx`
- Modify: `components/dashboard/dashboard-sidebar.tsx`
- Delete: `components/dashboard/start-design-dialog.tsx`
- (`quick-actions.tsx`, `empty-dashboard.tsx`, `get-started-panel.tsx` already call `openCreateDesign` — no change needed once the context navigates.)

- [ ] **Step 1: Keep the context type, clarify the doc comment**

In `components/dashboard/dashboard-context.tsx`, update the JSDoc on `openCreateDesign` (signature unchanged):

```tsx
  /** Navigate to the full-screen /dashboard/new onboarding, optionally preselecting a path. */
  openCreateDesign: (mode?: GenerationMode) => void;
```

- [ ] **Step 2: Make the shell navigate instead of opening a dialog**

Replace the entire contents of `components/dashboard/dashboard-shell.tsx` with:

```tsx
"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  DashboardProvider,
  type DashboardContextValue,
} from "@/components/dashboard/dashboard-context";
import type { GenerationMode } from "@/types/onboarding";

interface DashboardShellProps {
  invitationCount: number;
  workspaceName: string;
  children: React.ReactNode;
}

export function DashboardShell({
  invitationCount,
  workspaceName,
  children,
}: DashboardShellProps) {
  const router = useRouter();

  const openCreateDesign = useCallback(
    (mode?: GenerationMode) => {
      router.push(mode ? `/dashboard/new?path=${mode}` : "/dashboard/new");
    },
    [router],
  );

  const ctx: DashboardContextValue = useMemo(
    () => ({ openCreateDesign, invitationCount }),
    [openCreateDesign, invitationCount],
  );

  return (
    <DashboardProvider value={ctx}>
      <div className="min-h-screen bg-bg-base text-text-primary">
        <DashboardSidebar />
        <div className="pl-56">
          <DashboardHeader workspaceName={workspaceName} />
          <main className="px-6 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 3: Point the sidebar "New design" button at the route**

In `components/dashboard/dashboard-sidebar.tsx`, find the primary "New design" control. If it uses `useDashboard().openCreateDesign`, no change is needed. If it is a `Link`/`href` or a hardcoded handler, ensure it calls `openCreateDesign()` (no arg) or links to `/dashboard/new`. Confirm by reading the file:

Run: `grep -n "New design\|openCreateDesign\|/dashboard/new" components/dashboard/dashboard-sidebar.tsx`
Apply the minimal edit only if it is not already wired through `openCreateDesign`.

- [ ] **Step 4: Delete the old dialog**

```bash
git rm components/dashboard/start-design-dialog.tsx
```

- [ ] **Step 5: Verify nothing else imports the deleted dialog**

Run: `grep -rn "start-design-dialog\|StartDesignDialog" --include=*.ts --include=*.tsx .`
Expected: only matches in `docs/` and `context/` (and the progress tracker). No live import remains.

- [ ] **Step 6: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/dashboard/`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/
git commit -m "feat: route dashboard create actions to /dashboard/new, remove dialog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Editor template auto-import via `?template=`

**Files:**
- Modify: `app/editor/[roomId]/page.tsx`
- Modify: `components/editor/editor-workspace-client.tsx`
- Modify: `components/editor/canvas-workspace.tsx`

- [ ] **Step 1: Read `?template=` on the editor page**

In `app/editor/[roomId]/page.tsx`:

Change the `searchParams` type:

```tsx
  searchParams: Promise<{ start?: string; template?: string }>;
```

Add a template-id import near the top:

```tsx
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";
```

After `const { start } = await searchParams;` extend to also read template:

```tsx
  const { start, template } = await searchParams;
  const startMode = resolveStartMode(start);
  const templateId =
    startMode === "template" &&
    template &&
    CANVAS_TEMPLATES.some((t) => t.id === template)
      ? template
      : null;
```

Pass it to the client (add the prop in the returned JSX):

```tsx
      startMode={startMode}
      templateId={templateId}
      pendingGeneration={pendingGeneration}
```

- [ ] **Step 2: Thread `templateId` through the editor client**

In `components/editor/editor-workspace-client.tsx`:

Add to `EditorWorkspaceClientProps`:

```tsx
  templateId?: string | null;
```

Add to the destructured props (with default):

```tsx
  startMode = null,
  templateId = null,
  pendingGeneration = null,
```

Pass it to `<CanvasWorkspace>`:

```tsx
              templatesOpen={isTemplatesOpen}
              onTemplatesOpenChange={setIsTemplatesOpen}
              templateId={templateId}
```

- [ ] **Step 3: Accept + thread `templateId` in CanvasWorkspace**

In `components/editor/canvas-workspace.tsx`:

Add `templateId?: string | null;` to both `CanvasWorkspaceProps` (line ~103) and `CollaborativeCanvasProps` (line ~115).

In the `CanvasWorkspace` wrapper function, accept `templateId` and pass it to `<CollaborativeCanvas templateId={templateId} ... />`.

Add the import for templates near the existing `instantiateTemplate` import:

```tsx
import {
  CANVAS_TEMPLATES,
  instantiateTemplate,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
```

(Adjust to merge with the existing import from that module — do not create a duplicate import statement.)

- [ ] **Step 4: One-shot auto-import inside CollaborativeCanvas**

In `CollaborativeCanvas`, accept the prop:

```tsx
function CollaborativeCanvas({
  roomId,
  projectId,
  templatesOpen,
  onTemplatesOpenChange,
  templateId,
  onSaveStatusChange,
  aiSidebarOpen,
  onToggleAiSidebar,
  onCloseAiSidebar,
  pendingGeneration,
}: CollaborativeCanvasProps) {
```

After `handleImportTemplate` is defined (it is a `useCallback` ending around line 446), add a one-shot effect that imports the chosen template once the canvas has loaded and is still empty. Place this directly after the `handleImportTemplate` definition:

```tsx
  // Auto-import a template chosen during onboarding (?template=<id>). Runs once,
  // only after the saved-canvas load settled and the room is still empty, so it
  // never clobbers existing work or double-imports on re-render.
  const hasAutoImportedRef = useRef(false);
  useEffect(() => {
    if (hasAutoImportedRef.current || !templateId || !isCanvasLoaded) {
      return;
    }
    hasAutoImportedRef.current = true;
    if (reactFlow.getNodes().length > 0) {
      return;
    }
    const template = CANVAS_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      handleImportTemplate(template);
    }
  }, [templateId, isCanvasLoaded, handleImportTemplate, reactFlow]);
```

Note: `useRef`, `useEffect`, `useReactFlow`, and `isCanvasLoaded` are already in scope in this file. `CanvasTemplate` is imported in Step 3 (used by `handleImportTemplate`'s existing signature).

- [ ] **Step 5: Confirm the template start path no longer force-opens the modal**

The existing `EditorWorkspaceClient` opens the template modal when `startMode === "template"`. With auto-import, that modal pop is redundant for the onboarding path. Change the initial state in `components/editor/editor-workspace-client.tsx` so the modal only auto-opens when there is **no** template id:

```tsx
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(
    startMode === "template" && !templateId,
  );
```

- [ ] **Step 6: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint app/editor/ components/editor/canvas-workspace.tsx components/editor/editor-workspace-client.tsx`
Expected: no new errors (a pre-existing `react-hooks/set-state-in-effect` warning in `canvas-workspace.tsx` may remain — do not "fix" unrelated code).

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add app/editor/ components/editor/
git commit -m "feat: auto-import onboarding-selected template in editor

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Manual verification + progress tracker

**Files:**
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Manual smoke test (dev server)**

Run: `npm run dev` (and, per project convention, `npx trigger.dev@latest dev` in a second terminal if exercising AI generation).

Verify in the browser:
1. From the dashboard, each entry tile (quick actions, empty state, get-started, sidebar "New design") navigates to `/dashboard/new` (with the matching `?path=` where applicable).
2. Hub shows three cards; choosing one switches to the path view and updates the URL.
3. Blank: name → `Create design` → lands in the editor on an empty canvas.
4. Template: name + pick a card → `Create with template` → editor opens with that template already on the canvas, no modal.
5. Prompt: step 1 goal unlocks `Draft now`; Continue advances; the right-rail steps tick and the confidence meter fills; free-form toggle round-trips; submit → editor `?start=ai` shows the existing pending-generation review.
6. `Back to start` returns to the hub; `X` returns to the dashboard.

- [ ] **Step 2: Run the full gate suite**

Run: `npx tsx --test types/onboarding.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Update the progress tracker**

Add an entry under the implementation log in `context/progress-tracker.md` summarizing: the new `/dashboard/new` route (hub + two-column path view + right-rail stepper), the three reused/restructured paths, `PROMPT_STEPS`, the exported `TemplatePreview`, the entry-point rewiring + dialog deletion, and the editor `?template=` auto-import. Note that the pending-generation backend and `?start=ai` review are unchanged.

- [ ] **Step 4: Commit**

```bash
git add context/progress-tracker.md
git commit -m "docs: log full-screen onboarding redesign in progress tracker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review notes

- **Spec coverage:** route + overlay (T3), hub (T3), two-column path view + stepper (T3), blank (T3), template gallery + handoff (T4, T7), goal-first prompt + confidence + free-form (T5), `PROMPT_STEPS` (T1), entry-point rewire + dialog delete (T6), editor `?template=` auto-import (T7), recurring/non-gated (route is always reachable — T3), tone/motion (CSS transitions in stepper + meter, no GSAP). All covered.
- **Backend reuse:** `/api/projects`, `/api/projects/[id]/pending-generation`, `buildGenerationPrompt`, `deriveOpenQuestions`, `INTERVIEW_FIELD_META`, `?start=ai` review — untouched.
- **Type consistency:** `createDesign(payload, destination)`, `StepperStep`, `PromptStyle`, `PROMPT_STEPS`/`PromptStep`, `templateId` thread (`page → EditorWorkspaceClient → CanvasWorkspace → CollaborativeCanvas`) are named consistently across tasks.
- **Error handling:** create failure resets `isLoading` + inline error, `createdProjectIdRef` retained for retry; prompt goal-empty guard; free-form empty guard; invalid `?template=`/`?path=` fall back safely.
