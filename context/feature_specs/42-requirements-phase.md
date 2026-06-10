# 42 — Requirements Phase (Requirements Analyst)

> Phase C of `34-full-dev.md`. Depends on: 38, 39, 40. Blocks: 43, 44, 49. Knowledge source: `context/design/research/01-requirements.md` (authoritative for taxonomy, elicitation rules, output schema).

## Goal

Promote the onboarding agent into a Requirements Analyst that produces a structured, versioned `RequirementsDocument` — functional / non-functional / extended requirements, scope, constraints, stakeholders, scale-estimate inputs — with the three-state field model (answered / assumed / open) and the no-fabrication invariant, feeding HLD generation.

## Current State

- `lib/onboarding-agent.ts` + `app/api/ai/onboarding/route.ts`: conversational kickoff producing a free-form Markdown brief + open-questions list, stored as a `PendingGeneration` free-form prompt.
- `RequirementsDocument` model exists (spec 38), content opaque.

## Implementation

1. **Create `types/requirements.ts`** — zod schema for `RequirementsDocument.content` per research brief 01 §4 (trimmed to launch shape):
   - `goalStatement` string; `stakeholders[]` `{name, type}`; `functionalRequirements[]` `{id, title, description, actor?, priority (must|should|could|wont), acceptanceCriteria?, status (answered|assumed|open)}`; `nonFunctionalRequirements[]` `{id, category (performance|scalability|availability|reliability|security|usability|maintainability|portability|consistency), description, metric?, target?, status}`; `extendedRequirements[]` `{id, category (logging|monitoring_alerting|analytics|backup_dr|rate_limiting|feature_flags), description, inScope, status}`; `scope` `{inScope[], outOfScope[], mvpScope[]}`; `constraints[]` `{id, type (budget|timeline|technical|regulatory|team|existing_system|operational), description}`; `scaleEstimateInputs` `{dau?, qps?, readWriteRatio?, storagePerDay?, retention?, concurrencyPct?, peakFactor?, latencyBudget?, errorRateTarget?}` each `{value?, status}`.
   - Hard invariant encoded as a refinement helper `deriveRequirementGaps(content)`: every NFR with empty `target` and every `open`-status field yields a gap record `{title, category}` — callers create `ProjectOpenQuestion` rows from these. Analyst-proposed defaults become `ProjectAssumption` rows with `isDefault: true`.
2. **Extend `lib/onboarding-agent.ts` → analyst guidelines** (rename export surface, keep file): the coverage playbook gains the research-01 rules — FR/NFR/extended taxonomy as the probe checklist, "an NFR without a number is incomplete", MoSCoW priorities, tech-agnostic during requirements, one question at a time (already present), explicit out-of-scope elicitation, three-state discipline ("never collapse open into answered").
3. **Structuring step:** new `buildRequirementsStructuringPrompt()` + route mode `mode: "structure"` in `app/api/ai/onboarding/route.ts` (or a sibling `app/api/ai/requirements/route.ts` if the file grows — prefer sibling): takes the transcript (+ optional existing document for re-runs), `generateObject` against the spec-42 zod schema, model from `REQUESTY_ONBOARDING_MODEL`. Runs in the route (single object generation, same latency class as existing turns — no Trigger.dev task needed).
4. **Persistence routes `app/api/projects/[projectId]/requirements/route.ts`:**
   - `GET` — the document (or 404-shaped `{document: null}`).
   - `PUT` — full-document upsert (zod-validated), bumps `version`, then reconciles gap side-effects: create `ProjectOpenQuestion` rows for new gaps (source AI or HUMAN by caller), `ProjectAssumption` rows for new defaults; never duplicate by title within the project.
5. **Onboarding flow wiring:** the prompt path's "Approve & open canvas" now additionally runs the structuring step and PUTs the document, so AI-prompt projects arrive in the editor with a requirements doc; the `PendingGeneration` free-form path is unchanged as fallback when structuring fails.
6. **Requirements panel** (`components/editor/design/requirements-panel.tsx`, first section of the **Design** tab):
   - Empty state: "No requirements captured yet" + `Run requirements interview` (opens an in-editor conversational surface reusing the onboarding chat components against the same turn API, scoped to the project; on finish, structures + PUTs) and `Start from the canvas` hint.
   - Document view: grouped lists (FR with priority chips; NFR with metric/target — missing target rendered as a `state-warning` "needs a target" chip linking to its open question; extended; scope in/out; constraints; scale inputs grid). Status chips answered/assumed/open per the three-state model.
   - Inline editing per item (small editor dialogs) → PUT.
7. **Version display:** header shows `v{n}` + updated time; no diff UI at launch.

## Error Handling

- Structuring `generateObject` failure → keep transcript, surface retry; never write a partial document.
- PUT validation errors → 400 with paths; panel highlights offending item.

## Scope Limits

- No sign-off workflow (`status` stays DRAFT/VALIDATED via a simple toggle; SIGNED_OFF reserved).
- No per-requirement linking to HLD components (back-fill is post-launch).
- No capacity *calculation* — inputs only; the Capacity Estimator (spec 44) computes.
- Do not rebuild the onboarding UI; reuse its components.

## Check When Done

- Prompt-path onboarding produces a persisted structured document visible in the Design tab.
- In-editor interview produces/updates the document; NFRs without targets spawn linked open questions; analyst defaults appear as flagged assumptions.
- Manual edits round-trip with version bumps; `npx tsc --noEmit`, focused tests on `deriveRequirementGaps`, and `npm run build` pass.
