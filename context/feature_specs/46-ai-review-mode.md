# 46 — AI Review Mode

> Phase C of `34-full-dev.md`. Depends on: 41. Product contract: review mode never mutates the canvas (invariant 7); AI findings land in the unified review primitive.

## Goal

Arqitect reviews the current design across a fixed domain checklist — missing components, unclear flows, security boundaries, resilience gaps, observability gaps, implementation blockers, metadata gaps — and materializes findings as `ProjectReviewItem` rows (`source: AI`) the team accepts, resolves, or dismisses in the same flow as human items.

## Current State

Review items + workflow exist (41). No AI producer.

## Implementation

1. **Task `trigger/ai-review.ts`** (`id: "ai-review"`, `maxDuration: 240`):
   - Input zod: `{projectId, roomId, focus?}` (optional domain focus).
   - Context: latest snapshot (nodes/edges/metadata), requirements document, HLD sections, decisions/assumptions, existing **open** review item titles (dedupe), open questions.
   - `generateObject` schema: `findings[]` `{title (≤120 chars), description (what + why it matters + suggested resolution), severity (info|suggestion|blocker), domain (missing_component|unclear_flow|security|resilience|observability|implementation_blocker|metadata_gap), targetKind, targetId?}` capped at 15 per run.
   - System prompt encodes the review checklist with per-domain heuristics from the research briefs: every edge without `failureBehavior` → resilience finding; nodes crossing security boundaries over `public`-sensitivity edges → security finding; no observability components when extended requirements ask for monitoring → observability finding; SPOF detection (single gateway/LB/datastore on hot paths) → resilience; `confidence: low` clusters → metadata_gap (severity info). **Blocker severity is reserved** for findings that would genuinely block implementation (undefined critical contract, missing system-of-record, unresolved auth model) — instruct conservatism, since blockers gate spec generation.
   - Output handling: skip findings whose title matches an existing open item (case-insensitive); create the rest via the review-item helper (`source: AI`, `authorId: "arqitect"`, `runId`); validate target ids against the snapshot, fall back to project scope.
   - Completion: AI conversation message ("Review complete: N findings — X blockers, Y suggestions…"); status feed `kind: "review"`.
   - Model: `REQUESTY_REVIEW_MODEL` fallback `REQUESTY_DESIGN_MODEL`.
2. **Route `app/api/ai/review/route.ts`** — POST `{roomId, focus?}`; auth; trigger; `TaskRun`; 202 `{runId, publicToken}`.
3. **UI:**
   - Arqitect tab `Find risks` mode action fires the route (composer text → `focus`).
   - Review tab: a `Run AI review` button in the review-items panel header; on completion (realtime run tracking), refetch the list — new items carry the Bot glyph and a subtle `accent-primary-dim` "new" highlight until first interaction.
   - Canvas badges (spec 41) update on refetch.
4. **Dismissal telemetry-light:** dismissing an AI item already requires a reason (41) — this satisfies outcome criterion 17 (accepted or explicitly dismissed with reason) without extra instrumentation.

## Error Handling

- Zero findings → completion message "No new issues found at this depth" (success, not error).
- Partial entity-write failure: items are created individually; failures logged and excluded from the completion count.

## Scope Limits

- No canvas mutation (no room-write imports — same enforcement as 45).
- No auto-fix / "apply suggestion" actions — suggested resolutions are prose inside the description; acting on them is the human's (or a future proposal system's) job.
- No scheduled reviews.

## Check When Done

- `Find risks` / `Run AI review` produces ≤15 deduped AI review items with sensible severities and targets; they resolve/dismiss through the unified flow with recorded reasons.
- Canvas unchanged by a run; blockers produced here gate spec generation once 49 lands.
- `npx tsc --noEmit` and `npm run build` pass.
