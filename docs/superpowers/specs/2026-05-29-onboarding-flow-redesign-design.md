# Full-screen guided onboarding redesign

**Date:** 2026-05-29
**Status:** Approved design, pending implementation plan
**Replaces:** `components/dashboard/start-design-dialog.tsx` (the cramped `max-w-lg` "Prompt Arqitect" modal)

## Problem

The current new-design flow is a small centered dialog. It feels AI-generated, cramped,
and form-like. Clicking any of the three quick-starts (blank / template / prompt) still
dumps the user into the same generic dialog. The prompt path is an 8-question, one-at-a-time
gated form that reads as a burden. Template selection happens *after* project creation,
inside the editor.

This is not a one-time onboarding. Users return to this flow every time they start a design
("vibe their way to it"), so it must stay fast and pleasant on repeat use, not just first run.

## Goals

- Replace the dialog with a full-screen, consistent onboarding surface.
- One shell, central layout; only the body content varies by path.
- Make the three paths distinct but consistent.
- Blank: name → straight to canvas.
- Template: name + a modern gallery → canvas with the template applied.
- Prompt: a calm, guided, goal-first flow that invites depth without forcing it.
- Apply onboarding best practices: minimize friction, personalize via path self-identification,
  progressive disclosure, visible progress, always-available escape hatch, fast first win.

## Non-goals

- No change to AI generation execution (still owned by the existing `?start=ai` review +
  spec 03 auto-run deferral).
- No change to the pending-generation backend contract or interview field set.
- No new animation dependency (GSAP not used). Motion is restrained CSS/Tailwind only.
- No redesign of the in-editor template import modal (kept for later imports).

## Tone and motion (design constraint)

Clean, modern, well-designed, inviting — **not** heavily animated or emotional, and **not** a
rigid boring form. The middle: intentional, quiet motion that signals state, never decorates.

- Allowed: gentle fade/slide on step change, focus-state transitions, confidence-meter fill,
  a single subtle entrance fade for the surface.
- Avoided: bouncy celebrations, confetti, dopamine micro-rewards, looping animations.
- Prompt Architect reads as a calm guided conversation with breathing room around one focused
  question group at a time — conversational framing, soft prompts, optional example hints —
  but it is not a chatbot UI and not a dense form.
- All color via existing `globals.css` tokens. Monochrome base; `accent-primary` reserved for
  the AI/prompt path and active state, per `context/ui-context.md`.

## Architecture

### New route

```
app/dashboard/new/
  page.tsx            -- server component: auth gate, passes template list to client
  onboarding-flow.tsx -- client shell: path state, name, create + navigation logic
  path-selector.tsx   -- 3-segment path switcher
  blank-path.tsx      -- blank body
  template-path.tsx   -- template gallery body (reuses TemplatePreview SVG)
  prompt-path.tsx     -- goal-first stepper body
```

`page.tsx` reads `?path=blank|template|prompt` (default `blank`) for the initial segment.
The list of templates is `CANVAS_TEMPLATES` from `components/editor/starter-templates.ts`
(static; can be referenced directly on the client, so the server page mainly enforces auth and
renders the client shell).

### Entry points

`components/dashboard/quick-actions.tsx`, `empty-dashboard.tsx`, `get-started-panel.tsx`, and
the sidebar "New design" button stop calling `openCreateDesign(mode)` and instead navigate:

```
router.push(`/dashboard/new?path=${mode}`)   // mode: "blank" | "template" | "prompt"
```

`DashboardContext.openCreateDesign` is repointed to a `router.push` helper so existing callers
keep working without prop churn. The dialog state (`createOpen`, `createMode`, `createSuffix`,
`openSeq`) and the `<StartDesignDialog>` mount are removed from `dashboard-shell.tsx`.

`components/dashboard/start-design-dialog.tsx` is **deleted**.

### Consistent shell (`onboarding-flow.tsx`)

Full-viewport `bg-bg-base`, centered max-width column. Same chrome for all three paths:

- **Top bar:** Arqitect mark (left); `X` close (right) → `router.push("/dashboard")`.
- **Path switcher:** three segments (Blank · Template · Prompt). Switching updates the URL
  `?path=` (shallow) and the body; the entered name persists across switches. This is the
  personalization / self-identification moment.
- **Name field:** always visible. Live Room ID preview via `buildRoomId(name, suffix)`.
  Suffix minted once on mount (`generateRoomIdSuffix`).
- **Footer:** primary action + contextual secondary (back/skip). The prompt path adds a
  progress/confidence meter here.

State owned by the shell: `path`, `name`, `suffix`, `isLoading`, `error`,
`createdProjectIdRef` (retry-safe, same pattern as today). The create + navigate logic is
lifted from the current dialog largely unchanged.

### Path bodies

**Blank** — name + `Create design`. Creates the project, navigates `/editor/[roomId]`.
Nothing else. Fastest path to first win.

**Template** — name + a responsive gallery grid. Each card reuses the existing
`TemplatePreview` SVG renderer (self-scaling diagram on a canvas-dotted background), card name,
description, hover lift, and a selected-state ring. Selecting a card enables
`Create with template`. On submit: create project, then navigate
`/editor/[roomId]?start=template&template=<id>`. The editor auto-imports the chosen template on
canvas-ready (see Editor handoff). No template modal in this path.

**Prompt** — name + goal-first stepper:

| Step | Fields | Required | Notes |
| ---- | ------ | -------- | ----- |
| 1. What are you designing? | `systemGoal` | yes | Large focused input. Unlocks `Draft now`. |
| 2. Who & what flows | `primaryUsers`, `criticalFlows` | no | Skippable. |
| 3. Data & integrations | `dataStores`, `integrations` | no | Skippable. |
| 4. Runtime, scale, limits | `runtimeContext`, `scaleExpectations`, `constraints` | no | Skippable. |

- One step group visible at a time, with calm spacing and conversational copy (reusing the
  existing per-field `question`/`hint`/`placeholder` from `INTERVIEW_FIELD_META`).
- A **confidence meter** in the footer fills as recommended fields are answered.
- `Draft now` is available from step 1 onward (skip the rest at any time).
- A **free-form toggle** persists (single textarea + the existing low-confidence warning).
- On submit: build the `PendingGenerationPayload` exactly as today
  (`kind: "interview"` with `deriveOpenQuestions`, or `kind: "free-form"`), POST `/api/projects`,
  POST `/api/projects/[id]/pending-generation`, navigate `/editor/[roomId]?start=ai`.

### New step grouping (single source of truth)

Add to `types/onboarding.ts`:

```ts
export const PROMPT_STEPS = [
  { id: "goal",   title: "What are you designing?", fields: ["systemGoal"] },
  { id: "people", title: "Who and what flows",      fields: ["primaryUsers", "criticalFlows"] },
  { id: "data",   title: "Data and integrations",   fields: ["dataStores", "integrations"] },
  { id: "ops",    title: "Runtime, scale, limits",  fields: ["runtimeContext", "scaleExpectations", "constraints"] },
] as const;
```

Field-level metadata (`INTERVIEW_FIELD_META`), the field list, the zod payload schema, and
`deriveOpenQuestions` are all reused unchanged. `PROMPT_STEPS` only groups existing fields.

### Editor handoff (template auto-import)

`app/editor/[roomId]/page.tsx`:

- Extend `searchParams` to include `template?: string`.
- Validate the id against `CANVAS_TEMPLATES`; pass a `templateId: string | null` to
  `EditorWorkspaceClient` (only when `startMode === "template"`).

`EditorWorkspaceClient` → `CanvasWorkspace` → `CollaborativeCanvas`:

- When `templateId` is present, auto-run the existing `handleImportTemplate(instantiateTemplate(
  CANVAS_TEMPLATES.find(...)))` once on canvas-ready, instead of opening the picker modal.
- A ref guard ensures it imports exactly once (StrictMode / re-render safe).
- `startMode === "template"` without a `templateId` falls back to opening the modal (back-compat).

`?start=ai` and the pending-generation review path are untouched.

## Data flow

```
Dashboard entry tile
  -> router.push(/dashboard/new?path=<mode>)
  -> OnboardingFlow (name, path switch)
       blank    -> POST /api/projects                       -> /editor/[id]
       template -> POST /api/projects                       -> /editor/[id]?start=template&template=<tid>
       prompt   -> POST /api/projects
                   POST /api/projects/[id]/pending-generation -> /editor/[id]?start=ai
  -> Editor
       template: auto-import template once on canvas-ready
       ai:       render existing PendingGenerationReview in AI sidebar
```

## Error handling

- Project create failure: inline error in the footer, `createdProjectIdRef` retained so retry
  does not 409 (existing pattern).
- Pending-generation POST failure (prompt path): inline error; project already exists, retry
  re-POSTs the payload only (id cached).
- Prompt step 1 empty on `Draft now`: block, focus step 1, inline message.
- Free-form empty on submit: block with the existing message.
- Invalid/unknown `?template=` id in editor: ignored; falls back to modal (no crash).
- Unknown `?path=` value: default to `blank`.

## Testing

- Unit: `PROMPT_STEPS` covers every field in `INTERVIEW_FIELDS` exactly once;
  `deriveOpenQuestions` behavior unchanged.
- Component: path switch preserves name; blank create navigates; template select gates the CTA;
  prompt `Draft now` available after step 1; free-form toggle round-trips.
- Manual: each path end-to-end into the editor; template auto-import lands on canvas; AI review
  still renders from the pending row.
- Gates: `npx tsc --noEmit`, touched-file ESLint, `npm run build`.

## Files

**New**
- `app/dashboard/new/page.tsx`
- `app/dashboard/new/onboarding-flow.tsx`
- `app/dashboard/new/path-selector.tsx`
- `app/dashboard/new/blank-path.tsx`
- `app/dashboard/new/template-path.tsx`
- `app/dashboard/new/prompt-path.tsx`

**Edited**
- `types/onboarding.ts` (add `PROMPT_STEPS`)
- `components/dashboard/dashboard-context.tsx` (`openCreateDesign` → router push)
- `components/dashboard/dashboard-shell.tsx` (drop dialog state + mount)
- `components/dashboard/quick-actions.tsx`, `empty-dashboard.tsx`, `get-started-panel.tsx`,
  `dashboard-sidebar.tsx` (navigate to route)
- `app/editor/[roomId]/page.tsx` (read `?template=`)
- `components/editor/editor-workspace-client.tsx` (accept + thread `templateId`)
- `components/editor/canvas-workspace.tsx` (`CollaborativeCanvas` owns `handleImportTemplate`;
  add a one-shot auto-import effect guarded by a ref when `templateId` is set)

**Deleted**
- `components/dashboard/start-design-dialog.tsx`

## Open questions

None blocking. Template library is currently 3 entries (`CANVAS_TEMPLATES`); the gallery is
built to scale as more are added.
