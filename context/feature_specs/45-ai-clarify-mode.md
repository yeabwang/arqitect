# 45 — AI Clarify Mode

> Phase C of `34-full-dev.md`. Depends on: 39. Product contract: clarify mode never mutates the canvas (invariant 7).

## Goal

Let Arqitect ask sharp clarifying questions about the current design, posted as durable conversation messages threaded to the relevant nodes/edges — surfacing ambiguity instead of papering over it.

## Current State

Nothing. The only AI modes are design generation and spec generation.

## Implementation

1. **Task `trigger/ai-clarify.ts`** (`id: "ai-clarify"`, `maxDuration: 180`):
   - Input zod: `{projectId, roomId, instruction?}` (optional user steer, e.g. "focus on the payment flow").
   - Context: latest canvas snapshot content (read via `lib/canvas-snapshots.ts`; if no snapshot exists, read the working copy through the canvas GET path), node/edge metadata, requirements document summary, last 50 conversation messages, open question titles (avoid re-asking).
   - `generateObject` schema: `questions[]` `{question (one sharp question, ≤280 chars), rationale?, targetKind ("project"|"node"|"edge"), targetId?}` capped at 7. System prompt: senior-architect clarification rules — highest-leverage unknowns first; prioritize elements with missing/low-confidence metadata; one concern per question; never propose canvas changes; never repeat an existing open question.
   - Output: for each question, `createConversationMessage` (`authorType: AI`, `messageType: AI_CLARIFY`, target refs validated against the snapshot — unknown ids fall back to project scope).
   - Status feed `kind: "clarify"` (extend `AI_STATUS_KINDS` and the zod payload in `types/tasks.ts`), phases `starting → thinking → complete|error`.
   - Model: `REQUESTY_REVIEW_MODEL` fallback `REQUESTY_DESIGN_MODEL`.
2. **Route `app/api/ai/clarify/route.ts`** — POST `{roomId, instruction?}`; auth; trigger; `TaskRun` row; 202 `{runId, publicToken}`.
3. **UI (Arqitect tab):**
   - Mode actions row above the composer: `Draft architecture` (existing send), `Ask clarifying questions`, `Find risks` (46) — compact bordered buttons per `ui-context.md` AI-action labels. Clarify fires the route with the composer text as `instruction` when present; disabled while any run is active.
   - `AI_CLARIFY` messages render distinctly: sparkle glyph, `CLARIFYING QUESTION` mono eyebrow, the question, target chip (spec 39 navigation). A `Convert to open question` inline action creates a `ProjectOpenQuestion` (source AI, linked) so unanswered clarifications persist in the reasoning layer; answering happens naturally by replying in-thread (target the message).

## Error Handling

- Zero-question output → completion message "No high-leverage clarifications found" (not an error).
- Invalid target ids degrade to project scope; never dropped silently (logged in task).

## Scope Limits

- **No canvas mutation of any kind** — enforce by construction: the task imports no `mutateFlow`/room-write APIs.
- No automatic conversion of questions to open questions (user-triggered only).
- No scheduled/auto-clarify; user-triggered runs only.

## Check When Done

- `Ask clarifying questions` produces ≤7 threaded AI_CLARIFY messages, durable across reload, navigable to their elements.
- Canvas state (nodes/edges/metadata) is byte-identical before/after a run.
- Convert-to-open-question creates the linked entity; status strip shows clarify phases.
- `npx tsc --noEmit` and `npm run build` pass.
