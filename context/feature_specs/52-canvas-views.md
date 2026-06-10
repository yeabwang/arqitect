# 52 — Canvas Views: Engineering / Executive / Implementation

> Phase F of `34-full-dev.md`. Depends on: 35 (metadata drives the derivations). Product contract: views are derived from the canvas, not separately maintained; no separate persistence in v1.

## Goal

Three lightweight views over the same canvas: full-detail engineering view (current behavior), an executive summary view, and an implementation plan view — pure client-side filters/groupings over live room state.

## Current State

One view. Metadata exists (35/36) but nothing consumes it visually beyond the inspector.

## Implementation

1. **View switcher** — a compact 3-segment control in the floating top controls (next to save status): `Engineering · Executive · Implementation` (mono labels). State lives in `EditorWorkspaceClient` (local, not persisted, defaults Engineering); threaded into `CollaborativeCanvas`.
2. **Create `lib/canvas-views.ts`** — pure derivation functions with unit tests:
   - `deriveExecutiveView(nodes, edges)` — keep nodes where `componentType ∈ {client, gateway, service, external}` OR (`componentType === "datastore"` AND `persistenceRole === "system_of_record"`); drop `cache`, `job`, `queue` (unless a kept node has no other connection through them — keep it simple at launch: drop unconditionally), and nodes with `persistenceRole === "ephemeral"`. Drop edges with a hidden endpoint. Untagged nodes (no `componentType`) are kept — hiding unknowns would misrepresent the design.
   - `deriveImplementationView(nodes, edges)` — group nodes into horizontal lanes by `lifecycleStatus` order `existing → new → planned → deprecated` (untagged last, labeled "Unphased"): recompute `position` per lane (preserve relative x-order, stack rows within lane height); lanes get background group labels. Edge styling map: stroke color by `failureBehavior` (`undefined`/unset → `state-warning`, `fail_open` → `state-error`-leaning, others default) and dashed when `securitySensitivity ∈ {sensitive, regulated}` — exact token mapping centralized in `globals.css` view tokens.
3. **Rendering mode:** in Executive/Implementation, the canvas becomes **read-only** (React Flow `nodesDraggable/nodesConnectable/elementsSelectable` off, shape rail + inspector hidden, a quiet banner chip "Derived view — edit in Engineering"). Derived nodes/edges are rendered from the derivation output via separate `nodes`/`edges` props — Liveblocks state is never written from a derived view. Presence cursors remain visible (they're flow-space; acceptable drift in implementation view is fine at launch — hide cursors in Implementation view since positions are recomputed).
4. **Node rendering in derived views:** reuse `canvas-node.tsx`; executive view enlarges labels slightly via a `viewMode` prop (no new component); implementation view appends a small `lifecycleStatus` chip.
5. **Fit view** on every mode switch.

## Error Handling

- Empty derivation (e.g. nothing matches executive criteria) shows a centered empty hint ("Tag components with a type to build the executive view") instead of a blank canvas.

## Scope Limits

- No view persistence, no per-view annotations, no export-from-view.
- No implementation-phase field beyond `lifecycleStatus` (explicit phase numbers are post-launch).
- Engineering view behavior is untouched.

## Check When Done

- Switching views filters/groups correctly per the derivation tests; derived views are read-only and never mutate room state (verify second-client state unchanged after switching/staying in a derived view).
- Edge risk coloring matches the token map; untagged elements handled as specified.
- `npx tsx --test lib/canvas-views.test.ts`, `npx tsc --noEmit`, `npm run build` pass.
