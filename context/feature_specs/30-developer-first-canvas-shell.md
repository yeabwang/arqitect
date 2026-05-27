Redesign the editor workspace into a developer-first canvas shell inspired by modern whiteboard tools without copying their layout.

## Implementation

1. Replace the full-width editor navbar with floating top controls.
   - Top-left: project drawer toggle, Arqitect label, current project name, save status.
   - Top-right: Share action and Clerk user profile.
   - Keep all controls above the canvas as overlays so the graph remains full viewport.

2. Add a left floating canvas tool rail.
   - Working tools: Arqitect toggle, select pointer, starter templates, shape insertion.
   - Shapes should expose the existing six draggable canvas shapes in a flyout.
   - Planned tools: text, frames, comments, and more tools.
   - Planned tools route to a project-scoped coming-soon page.

3. Move canvas navigation controls to the bottom-right.
   - Undo and redo remain backed by Liveblocks history.
   - Zoom out, zoom percentage, zoom in, and fit view remain backed by React Flow.
   - Remove the minimap so the bottom-right controls are not crowded.

4. Add a protected coming-soon route under the editor room.
   - Route: `/editor/[roomId]/coming-soon/[feature]`.
   - Enforce authentication and project access before rendering.
   - Show a concise empty state and a link back to the active canvas.

## Scope Limits

- Do not implement text editing, frames, threaded comments, or a full plus menu yet.
- Do not change canvas node, edge, Liveblocks, autosave, AI generation, or spec generation behavior.
- Do not change the project storage model or database schema.

## Check When Done

- Existing AI, templates, shapes, undo/redo, zoom, share, and profile entry points are visible.
- Text, frames, comments, and plus route to coming-soon pages.
- The canvas remains full viewport under floating controls.
- `npm run build` passes.
