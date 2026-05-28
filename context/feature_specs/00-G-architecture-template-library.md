# 00-G - Architecture Template Library

Expand starter templates from a small import modal into a practical architecture pattern library aligned with Arqitect's target customers.

## Product Intent

Templates help users reach the success moment faster. The research identifies common launch patterns: SaaS app, AI app, event-driven backend, marketplace, internal tool, data pipeline, and migration plan.

This feature makes templates more useful without introducing user-created templates, server-side template storage, or marketplace behavior.

## Current State

- `components/editor/starter-templates.ts` contains a small static template array.
- Templates include nodes and edges using shared canvas types.
- `starter-templates-modal.tsx` previews and imports templates.
- Templates can be imported into the active Liveblocks room.

## User Story

As a technical founder or engineering lead, I want to start from a realistic system pattern, so that I spend time adapting architecture decisions instead of drawing common components from scratch.

## Implementation

1. Expand the static template catalog.

   Add templates for:

   - SaaS web app.
   - AI application with retrieval or tool use.
   - Event-driven backend.
   - Marketplace.
   - Internal operations tool.
   - Data pipeline.
   - Monolith-to-services migration.

   Keep existing templates if they are still useful.

2. Add template metadata.

   Extend `CanvasTemplate` with:

   - `category`
   - `persona`
   - `difficulty`
   - `bestFor`
   - `includes`
   - `assumptions`
   - `openQuestions`

   Example categories:

   - `saas`
   - `ai`
   - `backend`
   - `data`
   - `migration`
   - `internal-tool`

   Difficulty can be `simple`, `standard`, or `advanced`.

3. Add semantic metadata to template nodes and edges.

   If `00-B` is implemented, templates should fill relevant node/edge semantic fields:

   - component type,
   - responsibility,
   - runtime,
   - persistence role,
   - protocol,
   - interaction mode,
   - data exchanged.

   If `00-B` is not implemented yet, keep template metadata limited to current canvas fields and document that semantic enrichment is deferred.

4. Improve the template modal.

   The modal should support:

   - category filtering,
   - search by name/description,
   - compact template detail preview,
   - import action.

   Keep the preview lightweight. Do not mount React Flow inside template cards.

5. Add template detail view.

   When a template is selected, show:

   - name,
   - description,
   - best for,
   - assumptions,
   - open questions,
   - includes list,
   - preview diagram.

   This can be a right pane in the modal or an expanded card. Avoid a separate route.

6. Import behavior.

   Preserve current behavior unless changed by product decision:

   - importing a template into an existing canvas should ask for confirmation if nodes/edges already exist,
   - default action should replace the current canvas,
   - the imported template should use fresh node and edge IDs,
   - view should fit after import.

7. Dashboard Templates page.

   Replace the coming soon page for `/dashboard/templates` with a read-only template library page if the route already exists.

   The dashboard page should:

   - list the same templates,
   - show categories and short descriptions,
   - let users create a new design from a selected template,
   - reuse the start-design flow from `00-A` where possible.

   Do not build template editing.

8. Tests.

   Add focused tests for:

   - template IDs are unique,
   - every template has at least one node and edge,
   - every edge references valid node IDs,
   - categories are valid,
   - instantiate/import still remaps IDs.

## UI Details

- Keep the modal dense and technical.
- Use tokens only.
- Use filters as compact segmented controls or buttons.
- Template cards should have stable dimensions.
- Avoid marketing copy. Use practical labels like "Best for", "Assumptions", and "Open questions".

## Data Flow

1. User opens Templates from dashboard, onboarding flow, or editor.
2. User searches/filters the static template catalog.
3. User previews a template.
4. User creates a design or imports into current canvas.
5. Template nodes/edges are instantiated with fresh IDs.
6. Existing Liveblocks canvas state receives the update.
7. Existing autosave persists the snapshot.

## Error Handling

- Invalid template IDs should no-op with a visible error.
- Import into a non-empty canvas should require confirmation.
- Template data validation failures should be caught by tests, not runtime users.
- Empty search results should show a compact empty state.

## Scope Limits

- Do not add user-created templates.
- Do not add server-stored templates.
- Do not add paid template packs.
- Do not import external Miro/Lucid/draw.io files.
- Do not implement template versioning.
- Do not implement organization template governance.

## Dependencies

- Existing starter template system.
- Optional onboarding path from `00-A`.
- Optional semantic metadata from `00-B`.

## Check When Done

- Template library includes at least seven target architecture patterns.
- Templates have useful metadata and realistic architecture nodes/edges.
- Template modal supports search/filter/detail preview.
- Dashboard templates page is useful instead of coming soon.
- Creating a design from a template works through the existing project creation flow.
- Template import still syncs through Liveblocks and fits the view.
- TypeScript and build pass.
