# 43 — HLD Designer v2 (Metadata-Populating Design Generation)

> Phase C of `34-full-dev.md`. Depends on: 35, 37, 38, 42. Knowledge source: `context/design/research/02-hld.md` (request-flow skeleton, decision forks, guardrails).

## Goal

Upgrade `trigger/design-agent.ts` from "draw labeled shapes" to a real HLD Designer: every generated node carries v1 metadata, every edge carries protocol/mode/failure semantics, every major fork (monolith vs microservices, SQL vs NoSQL, sync vs async, caching, consistency) is emitted as a `ProjectDecision` with rationale, and unknowns become assumptions/open questions instead of fabricated values. Design generation remains **the only AI mode that mutates the canvas**.

## Current State

- `lib/design-agent/schema.ts`: action plan schema (addNode/moveNode/resizeNode/updateNodeData/deleteNode/addEdge/deleteEdge) with shape/color/size validation; `DESIGN_SYSTEM_PROMPT` covers shapes/colors/layout only.
- `trigger/design-agent.ts`: `generateObject` → `mutateFlow` application, status feed, AI presence cursor. No metadata, no reasoning output, no snapshot on completion.

## Implementation

1. **Extend `lib/design-agent/schema.ts`:**
   - `addNode` gains optional `metadata` (the spec-35 `nodeMetadataSchema`); `addEdge` gains optional `metadata` (`edgeMetadataSchema`) and optional `label`.
   - New actions: `setNodeMetadata { nodeId, metadata }`, `setEdgeMetadata { edgeId, metadata }` (merge semantics) so the agent can enrich existing user-drawn elements.
   - Plan schema gains top-level reasoning output: `decisions[]` `{title, context, optionsConsidered[], decision, rationale, alternativesRejected?, links?}`, `assumptions[]` `{title, description?, confidence, isDefault}`, `openQuestions[]` `{title, description?, category?, proposedDefault?}` — capped (≤8 / ≤10 / ≤10).
   - `summary` stays.
2. **Rewrite the system prompt** (`DESIGN_SYSTEM_PROMPT` → composed builder taking the requirements document):
   - Default to the canonical request-flow skeleton (edge/gateway → services → data → async → auth/observability) and prune what the requirements don't need.
   - Shape semantics retained; **metadata rules**: every node MUST have `componentType`, `responsibility`, `lifecycleStatus`, `confidence`; every edge MUST have `protocol`, `interactionMode`, `failureBehavior`, `confidence`. Fields the input doesn't support → set `confidence: "low"` and leave the field unset — never invent owners, runtimes, or engines (no-fabrication invariant).
   - **Decision rules** (research 02 §2): record a decision for each fork the design actually hits, with the requirement/estimate that drove it; prefer simplicity (monolith, vertical scale, single Postgres) unless requirements force otherwise; name storage engines per datastore node via `storageEngine` when justified.
   - **Guardrails** (§6): no node without a responsibility; no bare arrows; flag SPOFs as open questions; don't re-solve what the requirements left out — emit an open question.
3. **Task input context:** the route/task assembles: user prompt or pending-generation brief, the `RequirementsDocument` content when present (serialized compactly), the current canvas (nodes + edges + existing metadata), and existing decision/assumption/open-question titles (to avoid duplicates). Token budget: cap canvas serialization at 200 nodes / 400 edges; truncate older context first.
   - **Route hardening** (the pattern every later `/api/ai/*` route copies): call `lib/ai-rate-limit.ts` (34 §5 rule 9 — `TaskRun` count for `taskKind: "design"` in the last hour; over cap → 429) before triggering; trigger with the per-project queue `queue: { name: \`project-${projectId}\`, concurrencyLimit: 1 }` (34 §5 rule 8) so concurrent collaborator runs serialize instead of interleaving `mutateFlow` mutations; stamp `taskKind` on the `TaskRun` row.
4. **Task output handling (`trigger/design-agent.ts`):**
   - Apply canvas actions via `mutateFlow` as today, now writing `data.metadata`.
   - Persist `decisions`/`assumptions`/`openQuestions` via `lib/design-entities.ts` helpers with `source: AI`, `authorId: "arqitect"`, skipping title duplicates.
   - On successful completion, write a canvas snapshot (`lib/canvas-snapshots.ts`, trigger `design_generation`) from the post-mutation room state (read back via the Liveblocks server client / room storage — same read path the task already uses for `mutateFlow` context).
   - Completion conversation message (spec 39 helper) summarizing: components added/updated, decisions recorded, open questions raised.
5. **Frontend — proposed-decision review (builder chooses technologies, not just reads them):** ArchitectTab completion bubble becomes a review prompt: "Arqitect proposed N decisions — review them". Clicking opens the Review tab's decision section filtered to `PROPOSED`, where each row offers inline `Accept` / `Edit` / `Supersede` (the spec-40 status machinery — no new infra). The Review tab badge counts unreviewed proposed decisions until acted on. M open questions noted in the same bubble. Status phases unchanged.

## Error Handling

- Plan validation failure → one retry with the validation error appended to the prompt (existing Trigger retry policy covers transport); persistent failure → status `error`, no partial entity writes (entities persist only after canvas application succeeds).
- Actions referencing missing elements remain skip-counted (existing behavior); `setNodeMetadata` on a missing node skips.

## Scope Limits

- No proposal/diff review of canvas changes — design generation is contractually allowed to mutate directly; clarify/review modes (45/46) are the non-mutating paths.
- No HLD doc-sections here (tech-stack/deployment/capacity → spec 44).
- No multi-turn agentic loop; one plan per run (iterate by prompting again).

## Check When Done

- A generation from a project with a requirements document yields nodes with populated metadata (inspector shows it), semantically-tagged edges, AI-sourced decisions/assumptions/open questions in the Review tab, and a `design_generation` snapshot row.
- Two simultaneous generation triggers on one project serialize (queue), and an 11th run within an hour returns 429.
- The completion prompt routes to proposed decisions; accept/edit/supersede works inline.
- Unsupported fields are unset + low confidence — spot-check no fabricated owners/runtimes.
- Existing-canvas enrichment works (`setNodeMetadata` path).
- `npx tsc --noEmit` and `npm run build` pass.
