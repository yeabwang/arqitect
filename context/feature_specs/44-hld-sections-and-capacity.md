# 44 — HLD Sections + Capacity Estimator

> Phase C of `34-full-dev.md`. Depends on: 38, 42, 43. Knowledge sources: research briefs 02 (§1, §3, §5) and 04 (§3 capacity conventions).

## Goal

Produce the non-graph HLD artifacts as typed `DesignSection` rows — tech stack with rationale, deployment topology, capacity estimates **with shown calculations**, scalability/resilience strategy, and the high-level API surface — rendered in the Design tab. Estimates that show their math are the cheap, high-trust competitor-parity feature.

## Current State

`DesignSection` model exists (spec 38). No content schemas, task, routes, or renderers.

## Implementation

1. **Create `types/design-sections.ts`** — zod content schemas per HLD section type:
   - `tech-stack`: `rows[]` `{layer, choice, alternativeConsidered?, rationale}`.
   - `deployment`: `{hostingModel, regions?, orchestration?, network?, scalingUnits?, narrative}` (short strings + one prose field).
   - `capacity-estimation`: `estimates[]` `{metric, value (display string with ~ and unit), calculation (the multiplication shown inline), assumptions[] (each magic number named), derivedFrom? (scale input key)}` — the §3.3 presentation template, enforced: `calculation` is required, no bare numbers.
   - `scalability-resilience`: `{scalingApproach, bottlenecks[], strategies[] {concern, strategy, rationale}}` covering caching, sharding/replication, load balancing, rate limiting, redundancy.
   - `api-surface`: `endpoints[]` `{method, path, description, auth}` (high-level; LLD owns full contracts).
   - A `SECTION_TYPE_REGISTRY` map: type → phase, schema, display title — shared with spec 47's LLD types.
2. **Task `trigger/generate-hld-sections.ts`** (`id: "generate-hld-sections"`):
   - Input: `{projectId, roomId}`. Reads: latest canvas snapshot (write one at start, trigger `checkpoint`, if the current pointer is stale >5 min — cheap freshness), `RequirementsDocument` (especially `scaleEstimateInputs`), existing decisions.
   - One `generateObject` call per section type (sequential, status-feed phase per section: "Drafting tech stack…", etc.), each with a focused system prompt encoding its research rules:
     - Capacity Estimator prompt: formula templates (QPS = requests/day ÷ 86,400; peak = avg × stated peak factor; storage/day × retention × replication overhead), **average ≠ peak, reads ≠ writes**, every input either comes from `scaleEstimateInputs` or becomes a named assumption; missing required inputs (DAU absent entirely) → emit zero estimates for that metric and an open-question gap instead.
     - Tech-stack prompt: every choice traces to a requirement/estimate/decision; respect constraints; alternative named.
   - Upsert `DesignSection` rows (one per type per project, `phase: HLD`, version bump on regenerate, `source: AI`, `runId`). Gap outputs → `ProjectOpenQuestion` rows via the shared helper (no duplicates by title).
   - Model: `REQUESTY_DESIGN_MODEL` (or `REQUESTY_HLD_SECTIONS_MODEL` override).
3. **Route `app/api/ai/hld-sections/route.ts`** — POST `{roomId, sectionTypes?}` (default all five), auth, trigger, `TaskRun` row, 202 `{runId, publicToken}` (mint inline like `/api/ai/design`).
4. **Design tab — HLD sections area** (`components/editor/design/hld-sections-panel.tsx`, below the requirements panel):
   - `Complete the HLD` button when sections are absent; per-section `Regenerate` (with confirm: "Replaces the current section — version history is kept in the row version only") when present.
   - Renderers per type: `tech-stack` + `api-surface` as bordered tables (mono headers); `capacity-estimation` as estimate cards — value large, calculation in `font-mono text-text-secondary`, assumptions as a muted list (the §3.3 template, visually); `deployment` and `scalability-resilience` as structured prose blocks.
   - Stale hint: when the section's `updatedAt` predates `Project.currentSnapshotId`'s snapshot `createdAt`, show a quiet `Canvas changed since this was drafted` chip (sets up the staleness language used across artifacts).
5. **Manual editing (builder fixes the 10%, not re-rolls the 100%):** every section gets an `Edit` action opening a structured editor dialog matching its zod content schema — row add/edit/delete for `tech-stack`, `api-surface`, and `capacity-estimation` (calculation + assumptions remain required per row), field-level editing for `deployment` and `scalability-resilience`. Saving PATCHes `/api/projects/[projectId]/design-sections/[sectionId]` (route shared with spec 48): zod-validates content, bumps `version`, flips `source` to `HUMAN`, clears `staleAt`. `Regenerate` on a human-edited section warns "This section has manual edits — regenerating replaces them."
6. **Task triggering:** route applies the shared rate-cap helper (`taskKind: "hld-sections"`) and the per-project queue (34 §5 rules 8–9).
7. **Conversation note:** task completion posts an AI conversation message ("HLD sections drafted: tech stack, deployment, capacity (N estimates)…").

## Error Handling

- A failing section doesn't abort the run: catch per-section, record which failed in the completion status text, leave prior version intact.
- Schema-invalid generations retry once with the validation error; then skip that section.

## Scope Limits

- Manual editing stays inside the zod content shapes — no free-form prose sections, no schema escape hatches.
- No `uml-deployment` diagram; deployment is structured prose.
- No automatic re-run on canvas change (staleness indicator only).

## Check When Done

- Running "Complete the HLD" on a generated project yields all five sections with correct typed rendering; every capacity card shows value + calculation + assumptions; missing scale inputs produce open questions, not invented numbers.
- Editing a tech-stack row round-trips: PATCH persists, `source` shows HUMAN, version bumps, regenerate warns before replacing.
- Regenerate bumps versions; staleness chip appears after canvas edits + new snapshot.
- `npx tsc --noEmit` and `npm run build` pass.
