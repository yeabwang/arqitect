# 48 — LLD Chapter UI

> Phase D of `34-full-dev.md`. Depends on: 47.

## Goal

Surface LLD chapters in the Design tab: a components index, a per-component chapter view with typed section renderers (tables, custom SVG sequence and state diagrams), generation triggers, and staleness indicators.

## Current State

Chapters generate and persist (47); nothing renders them.

## Implementation

1. **Design tab structure** (`components/editor/design/design-tab.tsx` organizing 42 + 44 + this unit): three collapsible regions — `Requirements`, `Architecture (HLD)`, `Components (LLD)` — with mono numbered eyebrows (`00 / 01 / 02`) per the design system.
2. **Components index** (`components/editor/design/component-chapter-list.tsx`):
   - Lists nodes from the current canvas (live room state, not snapshot — the index reflects what the user sees) that have a `componentType` set or any LLD sections; row: shape glyph, label, componentType chip, chapter state — `Not detailed` / `N sections` / stale chip (source-hash mismatch per 47 §4).
   - Row actions: `Detail this component` (fires `/api/ai/lld`, disabled while a chapter run is active) or `Open chapter`.
   - Orphaned chapters (sections whose `targetNodeId` no longer exists on canvas) listed in a muted `Removed components` group — viewable, with a `Delete chapter` action (DELETE route below).
3. **Chapter view** (`components/editor/design/component-chapter-view.tsx`, replaces the index in-panel with a back link; also openable from the node inspector via an `Open component chapter` link added to spec 36's panel):
   - Header: node label, componentType, confidence, `Regenerate chapter`, stale banner when applicable ("This component changed on the canvas since these sections were generated").
   - Sections render in fixed order via typed renderers in `components/editor/design/sections/`:
     - `data-model-section.tsx` — per-entity bordered tables (Field / Type / Constraints / Description) with a mono `{entity} · {storageEngine}` header.
     - `api-contract-section.tsx` — per-endpoint cards: method badge + mono path, auth line, request/response tables, errors table.
     - `sequence-flow-section.tsx` — **custom SVG renderer**: participant lanes (label boxes top, vertical lifelines), numbered horizontal arrows (solid = sync, dashed = async/return), guard/fragment conditions as mono bracket labels, payload on hover title. Pure render from the zod shape — no React Flow. Self-scaling viewBox like `TemplatePreview`.
     - `state-machine-section.tsx` — simple SVG: states as pills laid out left-to-right by BFS from `initial`, transitions as labeled arrows; fall back to a transitions table when >8 states.
     - `class-model-section.tsx` — launch renderer is tabular: per-class card (name, stereotype, responsibility, attributes/methods in mono) + a relationships table; diagram rendering is post-launch (34 §6).
     - `interfaces-section.tsx`, `error-handling-section.tsx`, `design-patterns-section.tsx` — structured lists/cards.
   - Every renderer parses content through its zod schema at the boundary; invalid content renders a quiet "Section data is invalid — regenerate" stub.
4. **Manual editing of high-stakes sections:** `data-model` and `api-contract` — the content that flows verbatim into spec §7/§8 and the handoff contracts — get structured `Edit` actions: entity/field row editing for data models (field name, type, constraints, description; add/remove fields and indexes), endpoint editing for contracts (method, path, auth, request/response rows, errors — `errors[]` stays required). Saves PATCH the shared design-sections route (zod-validated, version bump, `source` → HUMAN, clears `staleAt`); regenerate-over-human-edits warns, same contract as spec 44 §5. Remaining section types (sequence, state, class model, interfaces, error-handling, patterns) stay view + regenerate at launch.
5. **Routes:** `GET /api/projects/[projectId]/design-sections?phase=lld&nodeId=` (list, content included), `PATCH /api/projects/[projectId]/design-sections/[sectionId]` (zod content validation against the section type's registry schema — shared with spec 44's editing), and `DELETE` (author/owner; used for orphan cleanup). HLD sections (44) reuse the same GET with `phase=hld` — consolidate the route here if 44 shipped a private fetch.
6. **Realtime:** while a chapter run is active, the chapter view shows the status strip (run tracking pattern) and refetches on completion.

## Error Handling

- Chapter fetch failures → inline retry; renderer-level zod failures isolate to the section (never blank the chapter).
- `Detail this component` on a metadata-empty node shows a pre-flight hint ("Add metadata first for a deeper chapter — continue anyway?") but does not block.

## Scope Limits

- Editing limited to `data-model` and `api-contract`; other section types are view + regenerate at launch.
- No cross-chapter navigation graph, no chapter export (the spec compiler consumes chapters; users export via specs).
- No zoom/pan on SVG renderers at launch (fit-to-width).

## Check When Done

- Index reflects canvas nodes + chapter state; detailing produces a live-updating chapter; all section types render from real generated content; sequence/state SVGs legible for typical sizes (≤8 participants / ≤8 states).
- Editing a data-model field and an api-contract endpoint round-trips (PATCH, HUMAN source, version bump) and the edited content appears in the next compiled spec.
- Stale chip appears after editing the node's edges + regenerating snapshot context; orphan flow works.
- Design tokens only; `npx tsc --noEmit` and `npm run build` pass.
