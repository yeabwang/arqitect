# 53 — Template Library v2 (Structured Bundles)

> Phase F of `34-full-dev.md`. Depends on: 35, 38, 39, 40. Product contract: "Templates start an architecture discussion, not only a drawing."

## Goal

Upgrade starter templates from canvas snapshots to structured bundles: nodes/edges with pre-populated v1 metadata, seed assumptions, seed open questions, and clarifying questions Arqitect posts immediately after import — written into Postgres as project entities at import time.

## Current State

`components/editor/starter-templates.ts`: 3 templates (Microservices, CI/CD, Event-Driven) with display metadata (category, complexity, stack, tags) and bare nodes/edges; `instantiateTemplate()` clones with fresh ids; import appends to canvas with offset + fitView. No metadata, no seeds.

## Implementation

1. **Extend `CanvasTemplate`:**
   - Template nodes/edges carry full `metadata` (v1) — author them by hand per template with honest confidence (`high` for the pattern's core, `medium` elsewhere); this is also the reference dataset for testing metadata-driven features.
   - New bundle fields: `seedAssumptions[]` `{title, description?, confidence}`, `seedOpenQuestions[]` `{title, description?, category?}`, `clarifyingQuestions[]` `{question, targetTemplateNodeId?}` — pattern-specific (e.g. event-driven: "What is your message-ordering requirement?" targeting the bus node).
2. **Author content:** populate all three existing templates and add one new `SaaS Web Application` template (the most-requested pattern per the overview's template list) — client → gateway → app service → Postgres (+ cache, job queue, email external) with full metadata and 3–5 seeds each. Keep template data in code (no DB table, per architecture context).
3. **Import side-effects route `app/api/projects/[projectId]/template-import/route.ts`:**
   - POST `{templateId, nodeIdMap}` (the instantiation's template-node-id → fresh-canvas-id map, so clarifying-question targets resolve).
   - Auth; then transactionally: create `ProjectAssumption`/`ProjectOpenQuestion` rows (`source: TEMPLATE`, dedupe by title), create `ConversationMessage` rows for each clarifying question (`messageType: AI_CLARIFY`, `authorId: "arqitect"`, target mapped through `nodeIdMap`), write a `ProjectActivity` `template_imported` row, and write a canvas snapshot is **not** done here (client owns canvas state) — instead the client fires a `template_import` snapshot via the spec-37 POST after applying nodes.
   - Idempotence: a repeated import of the same template re-seeds nothing whose title already exists; clarifying questions always post (it's a new subgraph).
4. **Client import flow** (`handleImportTemplate` in `canvas-workspace.tsx` + the templates modal/onboarding path):
   - Apply nodes/edges as today (now carrying metadata), tagging each imported element's data with `templateImportId` (one cuid per import) so the subgraph is identifiable.
   - **Labeled subgraph:** imported nodes get a transient group label chip rendered above the subgraph bounds ("Imported: {template name} — Keep / Remove") for the session; `Remove` deletes all elements with that `templateImportId` (and is the inspect-or-remove contract); `Keep` (or any edit) dismisses the chip.
   - POST the side-effects route, then the snapshot. Surface a toast/strip: "Template imported — 4 assumptions, 3 open questions seeded. Arqitect asked 3 questions in the thread."
5. **Onboarding template path:** the `/dashboard/new` template flow gains a one-line note per template ("Ships with N assumptions and M starter questions") sourced from the bundle.

## Error Handling

- Side-effects route failure after canvas application: canvas keeps the subgraph; show a retryable inline error ("Seeds failed to import — retry"); the route is idempotent so retry is safe.
- Unknown `templateId` → 404.

## Scope Limits

- No user-authored/custom templates, no template marketplace, no DB-backed catalog.
- No automatic AI follow-up beyond the seeded clarifying messages.
- Template count: 4 at launch (3 upgraded + SaaS); further patterns are content work, not engineering.

## Check When Done

- Importing any template yields metadata-complete elements (inspector shows it), seeded assumptions/open questions in the Review tab (`TEMPLATE` source), clarifying questions in the conversation threaded to mapped nodes, the removable labeled subgraph, and a `template_import` snapshot.
- Re-import doesn't duplicate seeds; remove-subgraph cleans all imported elements.
- `npx tsc --noEmit` and `npm run build` pass.
