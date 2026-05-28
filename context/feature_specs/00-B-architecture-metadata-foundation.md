# 00-B - Architecture Metadata Foundation

Add structured architecture metadata to canvas nodes and edges so Arqitect can become an architecture workspace instead of a generic diagramming surface.

## Product Intent

The research in `00-user_persona.md` says Arqitect's strongest wedge is the architecture-to-implementation loop. That loop requires the canvas to carry semantic information beyond shape, label, color, and position.

This feature adds a minimal, typed metadata foundation and a lightweight inspector for editing it. The goal is to make later AI review and spec generation materially better without making the canvas feel heavy.

## Current State

- `types/canvas.ts` defines shared canvas node and edge types.
- Nodes currently carry visual data such as label, shape, color, and size.
- Edges carry a label and visual routing behavior.
- The canvas is synchronized through Liveblocks and React Flow.
- Spec generation summarizes labels, shapes, and edges, but has limited implementation context.

## User Story

As a system designer, I want each component and relationship to carry lightweight architecture meaning, so that AI review and generated specs can understand responsibility, ownership, protocols, data flow, and risk.

## Implementation

1. Extend the canvas data types.

   Add optional semantic fields to `CanvasNodeData`:

   - `componentType`
   - `responsibility`
   - `owner`
   - `runtime`
   - `persistenceRole`
   - `externalDependency`
   - `securityBoundary`
   - `scalingConcern`
   - `lifecycleStatus`
   - `notes`

   Add optional semantic fields to `CanvasEdgeData`:

   - `protocol`
   - `interactionMode`
   - `dataExchanged`
   - `failureBehavior`
   - `latencySensitivity`
   - `securitySensitivity`
   - `confidence`
   - `notes`

2. Use constrained values where useful.

   Define readonly option arrays in `types/canvas.ts` for fields that should be selectable:

   - `componentType`: service, database, queue, cache, external-system, client, worker, gateway, storage, function, unknown.
   - `persistenceRole`: source-of-truth, cache, derived, transient, none, unknown.
   - `lifecycleStatus`: proposed, accepted, needs-review, deprecated.
   - `interactionMode`: sync, async, batch, stream, unknown.
   - `latencySensitivity`: low, medium, high, unknown.
   - `securitySensitivity`: public, internal, sensitive, regulated, unknown.
   - `confidence`: low, medium, high.

   Keep free text fields for responsibility, owner, runtime, data exchanged, failure behavior, and notes.

3. Keep backward compatibility.

   - Existing canvases without metadata must still render.
   - Existing templates must still import.
   - Existing AI generation must still work even if it only fills labels and shapes.
   - All new fields are optional.

4. Add a selected-element inspector.

   Create a project-specific editor component, for example `components/editor/architecture-inspector.tsx`.

   The inspector should:

   - appear only when exactly one node or one edge is selected,
   - sit as a compact floating panel or right-side panel section inside the existing editor chrome,
   - show node fields for nodes and edge fields for edges,
   - use compact labels and inputs suitable for engineering users,
   - update data through `useReactFlow().updateNodeData` and `useReactFlow().updateEdgeData`,
   - rely on the existing Liveblocks flow sync instead of direct persistence calls.

5. Preserve the current fast editing path.

   - Inline label editing must remain available.
   - Edge label editing must remain available.
   - Color, shape, resize, drag, and connection behavior must remain unchanged.
   - Metadata editing is additive.

6. Add metadata badges sparingly.

   The canvas should not become noisy. Add at most one compact metadata hint on selected elements, such as:

   - node component type,
   - edge protocol or interaction mode.

   Prefer showing metadata in the inspector over rendering many labels on the canvas.

7. Update starter templates only enough to prove the schema.

   Add semantic metadata to existing templates where obvious:

   - database nodes get `componentType: "database"` and `persistenceRole: "source-of-truth"` or similar.
   - queue nodes get `componentType: "queue"`.
   - external systems get `componentType: "external-system"`.
   - edges get protocol/interaction mode labels when obvious.

   Do not create new templates in this unit.

8. Add focused tests.

   Add lightweight tests for:

   - metadata option arrays containing expected values,
   - existing minimal node/edge data remaining valid,
   - template data still conforming to shared types if a local test pattern already exists.

## UI Details

- Use existing design tokens only.
- Use shadcn/ui primitives if a select/input component already exists. If no select component exists, use native `select` styled with tokens rather than adding a large new dependency.
- Keep the inspector dense and technical.
- Use `font-mono` for field labels only where it improves scanability.
- Do not use large cards or decorative panels.

## Data Flow

1. User selects one node or edge.
2. Inspector reads selected element data from React Flow.
3. User edits semantic fields.
4. Inspector updates node/edge data through React Flow helpers.
5. Existing Liveblocks synchronization broadcasts the change.
6. Existing canvas autosave persists the updated canvas snapshot as part of normal behavior.

## Error Handling

- Empty text fields should store empty string or remove the optional field consistently.
- Unknown enum values from older/future data should not crash the inspector.
- If no element or multiple elements are selected, hide the inspector.
- Invalid selected element references should no-op.

## Scope Limits

- Do not add Prisma columns for metadata.
- Do not change Vercel Blob storage structure.
- Do not implement AI metadata generation in this unit.
- Do not implement AI review.
- Do not change spec generation prompts except if a minimal type import requires it; richer spec generation belongs to `00-D`.
- Do not create a full properties database or schema editor.

## Dependencies

- Existing React Flow canvas.
- Existing Liveblocks flow synchronization.
- Existing canvas autosave.

## Check When Done

- Nodes and edges support optional semantic metadata.
- Existing canvases and templates still render.
- Selected nodes and selected edges can be edited through the inspector.
- Metadata updates sync to other collaborators through existing canvas state.
- Existing label, color, resize, drag, and edge interactions still work.
- TypeScript and build pass.
