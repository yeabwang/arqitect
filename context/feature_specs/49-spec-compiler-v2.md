# 49 — Spec Compiler v2 (Frozen Context, Gating, Canonical Sections)

> Phase E of `34-full-dev.md`. Depends on: 37, 38, 41, and consumes 42–47 output (degrading gracefully when phases are sparse). Knowledge source: `context/design/research/04-spec-handoff.md` (authoritative section list, compile map, compilation rules).
>
> North star: **spec generation is compilation, not free generation.** Every section has a named source in the book; empty sources render visible stubs, never plausible prose.

## Goal

Replace the single-shot spec task with a compiler that: captures a frozen generation context, gates on blockers, assembles the canonical 20-section spec from defined sources (deterministic where possible, LLM only for narrative), and persists a versioned, reproducible artifact.

## Current State

- `trigger/generate-spec.ts`: one `generateText` from client-posted nodes/edges/chat → 5 generic sections → `ProjectSpec` row + private blob. No frozen context, no gating, no version links. `ProjectSpec` columns for linkage exist (38) but are unwritten.

## Implementation

1. **Route rewrite `app/api/ai/spec/route.ts`:**
   - POST `{roomId, confirm?: boolean, intentionallyOpenIds?: string[]}` — the client no longer posts nodes/edges/chat; the server owns context.
   - **Gating:** call `getGenerationBlockers` (41). If blockers/open questions exist and `confirm !== true` → 200 `{requiresConfirmation: true, blockerReviewItems, openQuestions}` (no task triggered). `intentionallyOpenIds` PATCHes those questions to `INTENTIONALLY_OPEN` (recorded) before re-evaluating. With `confirm: true`, proceed — remaining blockers are carried into the spec flagged.
   - **Frozen context capture:** write a canvas snapshot (trigger `spec_generation`) from the working copy; compute `conversationCursor` (latest message id); trigger `generate-spec` with `{projectId, roomId, canvasSnapshotId, conversationCursor, carriedBlockers}`; create `TaskRun` (`taskKind: "spec"`); 202 `{runId, publicToken}`.
   - **Hardening:** rate cap before triggering and per-project queue on the trigger (34 §5 rules 8–9) — concurrent spec generations serialize, which also makes version assignment race-free in practice; the DB constraint below is the backstop.
2. **Create `lib/spec-compiler/`** — deterministic assembly modules (pure functions, unit-testable):
   - `compile-map.ts` — the section list 0–20 from research 04 §1 with each section's named source.
   - Builders (each takes typed inputs, returns Markdown or `null` for "no source"): `build-header.ts` (§0: spec version, timestamp, snapshot id, cursor, confidence summary, carried blockers), `build-components.ts` (§5 from node metadata — table per component), `build-data-flow.ts` (§6 from edge metadata), `build-data-model.ts` (§7 from all `data-model` sections), `build-contracts.ts` (§8 from `api-surface` + `api-contract` sections), `build-capacity.ts` (§9 — re-emit estimate cards verbatim: value + calculation + assumptions), `build-deployment.ts` (§10), `build-security.ts` (§11 from boundary/sensitivity metadata + security review items), `build-resilience.ts` (§12 from `failureBehavior` + scalability-resilience section), `build-scalability.ts` (§13), `build-observability.ts` (§14 from extended requirements + observability review items), `build-phases.ts` (§15 — components grouped by `lifecycleStatus`), `build-reasoning.ts` (§16–19 from decisions/assumptions/open questions/risks + review items — decisions still in `PROPOSED` status render with a `Proposed — not yet confirmed` label so an unreviewed AI decision never reads as settled; 34 §5 rule 11), `build-future.ts` (§20 from out-of-scope + future-tagged items).
   - **Sparse-section rule:** empty source → `_Not yet specified._` + a pointer ("Add edge metadata in the canvas inspector to populate this section."). **Low-confidence rule:** sections whose sources are majority low-confidence/missing get a leading banner `> ⚠ Low confidence — based on sparse input; N fields unspecified.`
3. **Task rewrite `trigger/generate-spec.ts`:**
   - Load: snapshot content by id (never the live room — invariant 12), requirements document, all `DesignSection` rows, all reasoning entities + review items, conversation up to the cursor.
   - **Token budgets (large projects must not blow the context window):** deterministic builders have no LLM limit — they handle any size. The three narrative LLM calls get explicit input budgets: canvas serialization capped at 200 nodes / 400 edges (the spec-43 convention), conversation capped at the most recent 150 messages before the cursor (older dropped first), each `DesignSection` content capped at ~8 KB serialized (oversize sections summarized to their top-level structure: entity names + field counts, endpoint list). Truncation order when a prompt still oversizes: conversation → sections → requirements detail (goal statement always kept). Every truncation is recorded in `generationContext.truncated[]` and noted in the §0 header ("Compiled with truncated conversation context").
   - **Deterministic pass:** run all builders → structured section drafts.
   - **Narrative pass (LLM, constrained):** exactly three `generateText` calls — §1 Overview, §2 Goals/non-goals, §3 User journeys & critical flows — each prompt embedding only its named sources (requirements, scope, use-case/sequence content) with the instruction "summarize and structure the provided material; introduce no component, integration, or guarantee not present in it." §4 Architecture diagram summary is deterministic (grouped component/edge inventory) plus one short LLM paragraph under the same constraint. Model `REQUESTY_SPEC_MODEL`.
   - Concatenate per the compile map; persist: `ProjectSpec` row with `version` assigned inside a transaction (`max(version) + 1` for the project; the `@@unique([projectId, version])` constraint from spec 38 makes a race a retryable constraint error, not a duplicate version), `canvasSnapshotId`, `conversationCursor`, `generationContext` JSONB `{entityCounts, carriedBlockerIds, intentionallyOpenIds, lowConfidenceSections[], truncated[]}`, `createdById`; blob `specs/{projectId}/{specId}.md` with `allowOverwrite: false` (immutable — change from current `true`).
   - Status feed `kind: "spec"` phases per stage; completion conversation message ("Spec v3 generated — N sections, 2 marked low-confidence").
   - `ProjectActivity` row `spec_generated`.
4. **Confirmation UI** (Artifacts tab / generate button): when the route returns `requiresConfirmation`, open `spec-generation-gate-dialog.tsx` — lists blockers (link to Review tab) and open questions with per-row `Mark intentionally open`, plus `Resolve first` (closes) and `Generate anyway` (re-POST with `confirm: true`). Copy explains flagged items will appear in the spec.
5. **Tests:** unit tests for representative builders (components, capacity passthrough, sparse stubs, low-confidence banner) under `lib/spec-compiler/*.test.ts`.

## Error Handling

- Snapshot write failure aborts before triggering (no orphan runs). Task failures leave no `ProjectSpec` row (row created only after Markdown is assembled — create row → upload → fill `filePath`, deleting the row on upload failure, matching the spec-28 pattern but with overwrite disabled).
- LLM narrative failure falls back to a deterministic stub for that section (`_Narrative unavailable — see sources._`) rather than failing the run.

## Scope Limits

- No spec editing; artifacts are immutable.
- No automatic regeneration on canvas change (staleness surfaces in 50).
- Existing download/preview routes keep working unchanged (same `ProjectSpec` + blob model).

## Check When Done

- Generating against a full-ladder project produces all 20 canonical sections with real compiled content; against a canvas-only project produces the same skeleton with visible `_Not yet specified._` stubs — never invented prose.
- Blockers trigger the confirmation flow; `intentionally open` is recorded; proceeding flags them in §0/§18/§19.
- Proposed (unaccepted) decisions carry the `Proposed — not yet confirmed` label in §16.
- Concurrent generation attempts serialize via the project queue; version numbers are unique under the DB constraint; truncation on an oversized project is recorded in §0, not silent.
- Spec row links snapshot + cursor; blob is immutable; builder tests, `npx tsc --noEmit`, `npm run build` pass.
