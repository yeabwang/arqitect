# Onboarding Popup + Path-Page Polish + Shared Keyboard Nav

**Date:** 2026-05-30
**Status:** Approved (design)
**Scope:** `/dashboard/new` onboarding experience — convert to popup, polish path pages, centralize keyboard navigation.

## Problem

From `context/current-issues.md` and screenshots:

1. `/dashboard/new` is a full-screen route. It should be a **popup** floating over the dashboard, freely closeable/openable (this is a pre-commitment step). Keyboard arrows + Enter should select start options.
2. Keyboard navigation is duplicated locally (hub grid, template grid) instead of being a reusable, centralized hook.
3. `/dashboard/new?path=...` pages look like an **unfinished demo** — sparse layout, low-contrast primary button, large dead space, weak chat experience. They need UI/UX polish to feel finished and trustworthy.

The product idea and step structure are good. This is a visual-design and flow-polish job, not a re-architecture.

## Non-Goals

- No new template data or categories.
- No changes to the AI onboarding prompt or `/api/ai/onboarding` behavior.
- No auth/route-protection changes.
- No new dependencies. Reuse existing `Dialog`, `Button`, design tokens.
- No flow re-architecture of the steps (stepper stays).

## Architecture

### Current

- `app/dashboard/layout.tsx` renders `DashboardShell` (sidebar + header) around `{children}`.
- `app/dashboard/new/page.tsx` resolves `?path` and renders `<OnboardingFlow>`.
- `OnboardingFlow` paints `fixed inset-0 z-50 bg-bg-base` — a self-made full-screen overlay covering the shell.
- Navigation in: `dashboard-shell.openCreateDesign(mode?)` → `router.push("/dashboard/new[?path=mode]")`; also direct URL.

### Target

Use Next.js **parallel + intercepting routes** so in-app navigation shows a modal over the dashboard while direct visit / refresh still renders the full page.

```
app/dashboard/
  layout.tsx              # renders {children} and a new `modal` slot
  @modal/
    default.tsx           # returns null (no modal by default)
    (.)new/page.tsx       # intercepts in-app nav to /dashboard/new → modal
  new/page.tsx            # full-screen page (direct visit / refresh fallback)
```

- `(.)new` intercepts the sibling `new` segment under `app/dashboard/`. The `@modal` slot lives at the same level, so `(.)` is the correct interception depth.
- `@modal/default.tsx` returns `null` so the slot renders nothing on all other dashboard routes.
- `app/dashboard/new/page.tsx` keeps current behavior for hard navigation (shareable URL, refresh, SSR fallback).

### Component decomposition

`OnboardingFlow` becomes **chrome-agnostic** — it owns state + step bodies (hub, blank, template, prompt) but not the outer container.

- New prop `variant: "page" | "modal"` (or equivalent), controlling:
  - container chrome (full-screen vs Dialog panel),
  - the `close()` behavior: `router.back()` in modal (returns to dashboard without reload), `router.push("/dashboard")` on page.
- Modal wrapper (`@modal/(.)new/page.tsx`): a Dialog-based shell — dimmed dashboard behind, `rounded-3xl`, backdrop blur, Esc + click-outside + X close, scroll-contained. Reads `?path` from search params and passes `initialPath`.
- Page wrapper (`new/page.tsx`): unchanged full-screen shell.

Both wrappers render the same internal hub/path bodies. No body logic is duplicated.

The header (logo, "All start options" back link, X) stays inside the shared body so both variants share it; the modal additionally supports Esc / click-outside via the Dialog.

### Keyboard navigation — `hooks/use-roving-focus.ts`

A single reusable hook implementing the standard roving-tabindex pattern, replacing the two ad-hoc `handleKeyDown` functions in `onboarding-hub.tsx` and `path-template.tsx`.

Responsibilities:

- Register an ordered collection of focusable elements (via ref-callback or a container ref + selector).
- Arrow keys (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`) move focus across the collection with wrap-around.
- `Home`/`End` jump to first/last.
- `Enter`/`Space` activate the focused item (native for `<button>`; the hook only guarantees focus management — it does not re-implement click).
- Roving `tabIndex`: active item `0`, the rest `-1`.
- Optional `autoFocusFirst` so arrows work immediately on mount (fixes "nothing happens until I Tab" on the hub). Respect not stealing focus from a typing user.
- Orientation-agnostic (grids treat all four arrows as next/prev, matching current behavior).

Consumers:

- `onboarding-hub.tsx`: the 3 start-option cards. Auto-focus first card when the hub mounts (accent "Prompt Arqitect" can be the default focus, or first card — implementation decides; first card is the safe default).
- `path-template.tsx`: the template radio-grid cards.

Escape-to-close is handled by the modal Dialog, not this hook. The canvas hook `hooks/useKeyboardShortcuts.ts` is unrelated and untouched.

### Path-page polish (structure preserved)

Goal: remove the "unfinished demo" feel. No step/flow changes.

- **Name step (blank + template step 1):**
  - Vertically center the form in available space instead of floating top-left in a void.
  - Constrain width; give the panel calm framing consistent with tokens.
  - Fix the primary button — currently reads as low-contrast grey; make it the clear primary action with correct hover/focus-visible states.
- **Prompt chat (`path-prompt.tsx`):**
  - Tighten thread density; keep architect/you avatars.
  - Subtle enter-motion on new messages.
  - Persistent design-name chip, focused composer, clearer option chips.
  - Anchor thread + dock composer so the large vertical void is filled / balanced.
- **Global:** consistent spacing scale, `focus-visible` rings, hairline borders, radii per `context/ui-context.md` (`rounded-xl` inline, `rounded-2xl` cards, `rounded-3xl` modal). Dark-only tokens; no hardcoded colors.

## Data Flow

- `?path` query param continues to seed `initialPath` (`blank` | `template` | `prompt` | none) in both variants.
- In-modal path switching keeps using `window.history.replaceState` to reflect `?path` without remount; on modal close, `router.back()` returns to the underlying dashboard.
- Project creation flow (`POST /api/projects`, `pending-generation`, navigate to `/editor/...`) is unchanged.

## Error Handling

- Existing error states preserved: `createDesign` failure surfaces inline error; agent failure in `path-prompt` keeps Retry / "open canvas with what I wrote".
- Modal close is disabled while a create request is in flight (existing `isLoading` guards on header buttons carry over; Dialog dismissal also guarded during `isLoading`).

## Testing

- Manual: in-app "New design" opens modal over dimmed dashboard; Esc / click-outside / X / browser-back all close to dashboard; direct visit to `/dashboard/new` and refresh render full page.
- Manual: keyboard — on hub open, arrows move between cards immediately, Enter selects; on template grid, arrows roam cards, Enter selects.
- Manual: each path renders polished layout with no large dead space; primary buttons read as primary; chat composer focused and legible.
- Lint/typecheck must pass. No new runtime deps.

## Files Touched

- `app/dashboard/layout.tsx` — add `modal` parallel slot.
- `app/dashboard/@modal/default.tsx` — new, returns null.
- `app/dashboard/@modal/(.)new/page.tsx` — new, modal wrapper.
- `app/dashboard/new/page.tsx` — keep full-page; pass `variant`.
- `app/dashboard/new/onboarding-flow.tsx` — chrome-agnostic + `variant`, close behavior.
- `app/dashboard/new/onboarding-hub.tsx` — consume `use-roving-focus`, auto-focus.
- `app/dashboard/new/path-template.tsx` — consume `use-roving-focus`; name-step polish.
- `app/dashboard/new/path-prompt.tsx` — chat polish.
- `app/dashboard/new/path-blank.tsx` — minor polish for centered layout.
- `hooks/use-roving-focus.ts` — new shared hook.
- `context/progress-tracker.md` — update after implementation.

## Open Questions

None.
