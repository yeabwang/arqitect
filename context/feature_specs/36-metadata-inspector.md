# 36 — Metadata Inspector Panel

> Phase A of `34-full-dev.md`. Depends on: 35.

## Goal

Let users view and edit v1 metadata on the selected node or edge, with completeness and low-confidence visibility, so the canvas stops being a drawing and starts carrying architecture semantics. "Missing or low-confidence values are visible in the UI" is a product contract.

## Current State

Nodes expose label editing (double-click), color toolbar, and resize. Edges expose label editing. No metadata surface exists.

## Implementation

1. **Create `components/editor/metadata-inspector.tsx`** — a floating right-side panel mounted inside `CollaborativeCanvas` (so it has room context), positioned to not collide with the AI sidebar (offset left of it when the sidebar is open; reuse the floating-overlay treatment: `bg-bg-surface/95 backdrop-blur-md border border-border-default rounded-2xl`).
   - Visible only when exactly one node or one edge is selected (track selection from React Flow `useOnSelectionChange`). Multi-select or empty selection hides it.
   - Header: element label (or "Untitled component"/"Connection"), element kind chip (mono, muted), completeness counter `n/9` (nodes) or `n/7` (edges) from the spec-35 helpers, and a close button (collapses until next selection change).
2. **Node form fields** (in contract order): `componentType` (select), `responsibility` (textarea, 1–2 lines), `owner` (input), `runtime` (input), `persistenceRole` (select), `securityBoundary` (input), `externalDependency` (toggle), `lifecycleStatus` (select), `confidence` (3-segment control), `storageEngine` (input, shown only when `componentType === "datastore"` or `persistenceRole !== "none"/unset`), `notes` (textarea).
3. **Edge form fields:** `protocol` (select), `interactionMode` (select), `dataExchanged` (textarea), `producerRole`/`consumerRole` (inputs), `failureBehavior` (select), `securitySensitivity` (select), `confidence` (segment), `notes` (textarea).
4. **Write path:** every field change calls `useReactFlow().updateNodeData(id, { metadata })` / `updateEdgeData(id, { metadata })` so changes route through the existing Liveblocks-synced change handlers (same pattern as color/label). Debounce free-text inputs ~400 ms; selects/toggles write immediately. Never write empty-string values — omit the key instead.
5. **Visibility of gaps:**
   - Unset selects render an "Unspecified" placeholder option in `text-text-muted`.
   - When `confidence === "low"` show a small `state-warning` dot next to the confidence control and a one-line hint ("Low confidence — AI review will flag this").
   - On the canvas node itself, render a tiny completeness indicator in the node's top-right corner (a muted dot when 0 fields filled, an accent-dim count chip `3/9` when partially filled, hidden when complete). Implement inside `canvas-node.tsx` behind the existing hover/selected styling; keep it visually quiet (edges get no on-canvas indicator at launch).
6. **Field metadata** (labels, placeholder copy, helper text) lives in a `NODE_FIELD_META` / `EDGE_FIELD_META` map inside the component module — copy follows `ui-context.md` voice (e.g. responsibility placeholder: "What is this component responsible for?").

## Error Handling

- Selection of an element with malformed metadata renders the empty form (parse helper returned `undefined`); first edit writes a clean object.
- Updates to a concurrently-deleted element are no-ops (React Flow update on missing id) — panel hides on the next selection-change event.

## Scope Limits

- No required fields, no validation errors — all fields optional by contract.
- No bulk editing, no metadata on multi-select.
- No v2 fields. No AI assistance in the panel (clarify/review modes own that).
- Do not move or restyle existing node toolbar/resize behavior.

## Check When Done

- Selecting a node/edge shows the inspector; edits sync live to a second browser via Liveblocks.
- Completeness counts and low-confidence indicators render correctly; metadata survives autosave round-trip (save, reload, fields persist).
- Empty state ("Unspecified") visible for unset fields; no hardcoded colors; `npm run build` passes.
