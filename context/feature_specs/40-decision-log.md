# 40 — Decision Log: Decisions, Assumptions, Risks, Open Questions

> Phase B of `34-full-dev.md`. Depends on: 38. Blocks: 41 (panel placement), 42, 43, 49.

## Goal

CRUD APIs and workspace panels for the four reasoning entities, linked to canvas elements — the layer that makes specs carry *why*, not just *what* (outcome criterion 19: specs generated against projects with ≥1 decision, ≥1 assumption).

## Current State

Models exist (spec 38). No routes, no UI.

## Implementation

1. **Create `lib/design-entities.ts`:** shared zod schemas per entity (create/update shapes mirroring the spec-38 fields), a `links` validator (`{kind, id}[]` against the target-kind enum), and thin create/update/list helpers used by both routes and AI tasks (43/46 reuse them with `source: AI`).
2. **Routes** (all auth via `getCurrentProjectIdentity` + `getProjectWithAccess`; thin per code standards):
   - `app/api/projects/[projectId]/decisions/route.ts` — GET (list, newest first), POST (create; `status` defaults `PROPOSED`).
   - `app/api/projects/[projectId]/decisions/[decisionId]/route.ts` — PATCH (any field incl. status transitions), DELETE.
   - Same pair for `assumptions`, `risks`, `open-questions` (`[assumptionId]` etc. — descriptive params per naming rules). Open-question PATCH to `RESOLVED`/`INTENTIONALLY_OPEN` requires `resolution` text and stamps `resolvedById`.
   - Any collaborator can create/edit/resolve (per access model); only owner can DELETE entities they didn't author — keep simple: DELETE allowed for author or project owner.
3. **Review tab shell:** restructure `ai-sidebar.tsx` tabs to the 34 §3.5 IA (`Arqitect | Design | Review | Artifacts` — Design and Artifacts may render placeholder empty states until their specs land). The **Review** tab hosts, below the review-items area (spec 41 fills it), four collapsible sections.
4. **Panels** `components/editor/review/decision-log-panel.tsx`, `assumption-panel.tsx`, `risk-panel.tsx`, `open-question-panel.tsx` plus a shared `entity-list-section.tsx`:
   - Each section: mono header with count badge (open/active counts, not totals), `+` create button, list of rows (title, status chip, source glyph — `Bot` for AI, avatar/initials for human), empty state with one-line guidance copy.
   - Row click expands inline detail (all fields, links as chips that select the canvas element — same navigation helper as spec 39 threading, same `target deleted` fallback).
   - Create/edit via a shared dialog `entity-editor-dialog.tsx`: fields per entity type; a "Link to selection" affordance adds the currently selected node/edge to `links`.
   - Status changes inline (select on the row detail): decision PROPOSED→ACCEPTED→SUPERSEDED; assumption ACTIVE→VALIDATED/INVALIDATED; risk OPEN→MITIGATED/ACCEPTED/RESOLVED; open question OPEN→RESOLVED/INTENTIONALLY_OPEN (with required resolution text dialog).
5. **Copy:** follow `ui-context.md` — `Save decision`, `Record assumption`, `Log risk`, `Add open question`; empty states explain what each captures and that all four flow into generated specs.

## Error Handling

- Optimistic list updates with rollback on API failure; inline error pill per section.
- Concurrent edits: last-write-wins (PATCH whole-field); acceptable at launch.

## Scope Limits

- No review items here (spec 41).
- No AI creation paths here (43/46 call the lib helpers).
- No entity-to-entity link *editing* UI beyond canvas-element links (entities created by AI may carry richer links; render them, don't author them).
- No pagination (cap lists at 200, newest first).

## Check When Done

- All four entities: create, edit, status-change, delete, link-to-element, navigate-from-link work end to end for owner and collaborator.
- Counts and source glyphs correct; deleted canvas targets degrade gracefully.
- Route auth rejects non-members (404) — verified manually or via focused test on the lib helpers.
- `npx tsc --noEmit` and `npm run build` pass.
