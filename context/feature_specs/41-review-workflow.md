# 41 — Unified Review Workflow

> Phase B of `34-full-dev.md`. Depends on: 38, 40 (Review tab shell). Blocks: 46, 49 (gating).

## Goal

One review primitive for human comments and AI findings: create, assign, resolve with reason, dismiss with reason — plus the gating helper spec generation consumes. "AI-surfaced risks and review items share a single data model with human-raised review items" is a product contract.

## Current State

`ProjectReviewItem` model exists (spec 38). No routes, UI, or gating.

## Implementation

1. **Routes:**
   - `app/api/projects/[projectId]/review-items/route.ts` — GET (filter query params: `status`, `severity`, `targetId`), POST (create: title, description?, severity, targetKind/targetId?, assigneeId?; `source: HUMAN`, `status: OPEN`).
   - `app/api/projects/[projectId]/review-items/[reviewItemId]/route.ts` — PATCH for: edit fields; `status: RESOLVED` (requires `resolutionReason`, stamps `resolverId`); `status: DISMISSED` (requires `resolutionReason`); reopen (`status: OPEN`, clears resolver/reason); assign/unassign. Any collaborator can resolve/dismiss any item (contract: "Any collaborator can resolve any review item; the resolver and resolution reason are recorded"). Write a `ProjectActivity` row on resolve/dismiss.
2. **Create `lib/spec-gating.ts`:**
   - `getGenerationBlockers(projectId)` → `{ blockerReviewItems: [...], openQuestions: [...] }` — open `BLOCKER`-severity review items + `OPEN`-status open questions (excludes `INTENTIONALLY_OPEN`). Used by spec 49's route and by the Review tab summary. Focused test `lib/spec-gating.test.ts`.
3. **Review tab UI** (`components/editor/review/review-items-panel.tsx`, top of the Review tab above the spec-40 sections):
   - Header: open count + severity breakdown dots (`state-error` for blockers, `state-warning` for suggestions, muted for info) + filter chips (Open / Resolved / Dismissed / All) + `New review item` button.
   - Rows: severity dot, title, source glyph (Bot vs avatar), target chip (navigates to element; `target deleted` fallback), assignee avatar when set.
   - Row detail (expand): description, metadata, action buttons — `Resolve` / `Dismiss` open a small dialog requiring a reason; `Assign` offers project members (owner + collaborators from the existing collaborators API); discussion link: "Discuss in thread" posts focus to the Arqitect tab composer pre-targeted at this review item (`targetKind: REVIEW_ITEM`) — messages targeting the item render in the detail as a mini-thread (query conversation by target).
   - Blocker banner: when blockers exist, a compact `state-error`-bordered strip at the top: "N blockers will gate spec generation."
4. **Canvas badges:** in `canvas-node.tsx`, render a small severity-colored dot on nodes that are the target of ≥1 open review item (data supplied via a lightweight context populated from the GET list, refreshed on Review tab mutations and on `ai-review` completion). Edges skip badges at launch.
5. **Create-from-canvas:** node/edge context (inspector panel from spec 36) gains a `Raise review item` action pre-filling the target.

## Error Handling

- Resolve/dismiss without reason → 400; dialog enforces client-side too.
- Assignee no longer a member: render as "Former collaborator"; PATCH to reassign works regardless.

## Scope Limits

- AI item *production* is spec 46.
- No notification system, no email; no per-item watchers.
- Gating *enforcement* in the spec route is spec 49; this unit only ships the helper + UI awareness.

## Check When Done

- Human items: create (panel + from canvas), assign, resolve with reason, dismiss with reason, reopen — recorded with resolver identity.
- Filters and severity visuals correct; node badges appear/disappear with item state.
- `getGenerationBlockers` returns exactly open blockers + open (non-intentional) questions; test passes.
- `npx tsc --noEmit` and `npm run build` pass.
