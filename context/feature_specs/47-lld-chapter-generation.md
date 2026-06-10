# 47 — LLD Chapter Generation

> Phase D of `34-full-dev.md`. Depends on: 35, 38, 43. Knowledge source: `context/design/research/03-lld.md` (authoritative for the D0–D8 pipeline, section schemas, SOLID/pattern rules). LLD depth is the competitive moat — sysdesai stops at HLD.

## Goal

"Detail this component": one Trigger.dev task decomposes a single HLD node into an LLD chapter — data model, API contracts, sequence flows, state machines, class model, interfaces, error handling — persisted as typed `DesignSection` rows keyed by `targetNodeId`. Launch decision (34 §3.1): chapters are structured documents rendered by typed components, not child canvases.

## Current State

`DesignSection` model exists; HLD section types exist (44). No LLD content schemas, task, or route.

## Implementation

1. **Create `types/lld-sections.ts`** — zod content schemas per research brief 03 §2 (registered in the spec-44 `SECTION_TYPE_REGISTRY`, `phase: LLD`):
   - `data-model`: `entities[]` `{entity, storageEngine, tableOrCollection, fields[] {name, type, constraints[], description?}, indexes[]? {name, fields[], unique?}, relationships[]? {to, cardinality, via}}`.
   - `api-contract`: `endpoints[]` `{method (or event name for async), path, summary, auth {scheme, roles[]?}, request? {pathParams[]?, queryParams[]?, bodySchema?}, responses[] {status, bodySchema?, description}, errors[] {status, code, when}, idempotent}`.
   - `sequence-flow`: `flows[]` `{scenario, participants[] {id, name, kind (actor|service|db|external)}, steps[] {seq, from, to, message, messageType (sync|async|return|self), payload?, guard?, fragment? (alt:|opt:|loop: prefixed condition)}, preconditions[]?, postconditions[]?}`.
   - `state-machine`: `machines[]` `{subject, initial, states[] {name}, final[], transitions[] {from, to, trigger, guard?, action?}}`.
   - `class-model`: `classes[]` `{name, stereotype?, responsibility (one sentence — the SRP check), attributes[] {name, type, visibility}, methods[] {name, params[] {name, type}, returnType, visibility}, extends?, implements[]?}`, `relationships[]` `{from, to, type (association|aggregation|composition|generalization|realization|dependency)}`, `appliedPrinciples[]?` `{principle, where, rationale}`.
   - `interfaces`: `items[]` `{name, ownerModule, methods[] {signature, inputs[], outputs[], throws[]?}, protocolRules[]?}`.
   - `error-handling`: `{validationRules[], errorCases[] {condition, handling, surfacedAs}, failureModes[], retryPolicy?}`.
   - `design-patterns`: `patterns[]` `{pattern, family, problemSolved, appliedTo[], rationale}` — `problemSolved` required (no problem → no pattern, the anti-overuse guard).
2. **Task `trigger/lld-chapter.ts`** (`id: "lld-chapter"`, `maxDuration: 480`):
   - Input zod: `{projectId, roomId, nodeId}`.
   - **D0 scoping:** load the latest snapshot; resolve the node + its metadata + all inbound/outbound edges with metadata + the requirements FRs (full doc summary) — abort with a clear error if the node is absent from the snapshot.
   - **Section plan (deterministic, from metadata — not LLM-decided):** always generate `class-model` + `interfaces` + `error-handling`; `data-model` when `componentType ∈ {service, datastore}` or `persistenceRole ≠ none/unset`; `api-contract` when any inbound edge has `protocol ∈ {http, grpc, websocket, sse}` or the node is a gateway; `sequence-flow` always (key operations crossing this node); `state-machine` only when the prior `data-model` output contains an entity with a status/lifecycle field (the GfG trigger rule); `design-patterns` last (consumes the class model).
   - Sequential `generateObject` per planned section (status feed `kind: "lld"`, phase text per section), each prompt carrying: the D0 scope block, previously generated sections of this run (consistency), and per-section rules from research 03 — SOLID checks for class-model, engine-per-entity for data-model, `errors[]` mandatory per endpoint, alt/error fragments expected in sequences, one-sentence responsibility per class.
   - **Reconciliation gate (D-final):** programmatic check that every `data-model` entity name appears in the class model (or is listed in a `pureStorageRecords[]` escape hatch in the class-model content); mismatches appended as a `metadata_gap`-style note inside the chapter's `error-handling` content `failureModes` is wrong — instead: record mismatches as `ProjectOpenQuestion` rows ("Class/data model mismatch: X").
   - Upsert `DesignSection` rows per `(projectId, targetNodeId, sectionType)` with version bump; `confidence` derived from the node's metadata confidence + input sparsity (low when node metadata <3 fields filled).
   - Completion conversation message threaded to the node.
   - Model: `REQUESTY_LLD_MODEL` fallback `REQUESTY_DESIGN_MODEL`.
3. **Route `app/api/ai/lld/route.ts`** — POST `{roomId, nodeId}`; auth; verify node exists in the current snapshot (cheap pre-check, friendlier 404 than task failure); rate cap (`taskKind: "lld"`) + per-project queue per 34 §5 rules 8–9 (chapters write `DesignSection` rows — serialize with other writers); trigger; `TaskRun`; 202 `{runId, publicToken}`.
4. **Staleness:** when a later snapshot's version of the node or its edges differs (compare node `data` + connected edge set hash stored in the chapter's `content._sourceHash` on each section), the UI (48) shows the stale chip. Compute the hash in the task; comparison is client/route-side.

## Error Handling

- Per-section failures don't abort the chapter (catch, note in completion text, keep prior version).
- Node deleted mid-run: remaining sections still persist against `targetNodeId` (soft ref); UI handles orphaned chapters (48).

## Scope Limits

- One node per run; no "detail everything" batch at launch.
- No child canvas pages, no `internal-module-graph` canvas (the class model's relationships table carries internal structure at launch).
- No manual LLD editing (regenerate-only, same as 44).
- No DSA section (`data-structures-algorithms`) at launch.

## Check When Done

- Detailing a service node with populated metadata yields a chapter whose planned sections match the deterministic rules; entities name storage engines; every endpoint has `errors[]`; state machine appears only for lifecycle entities.
- Reconciliation mismatches surface as open questions; rerun bumps versions.
- `npx tsc --noEmit` and `npm run build` pass.
