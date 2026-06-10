# 51 — Coding-Agent Handoff Brief

> Phase E of `34-full-dev.md`. Depends on: 49 (a spec version is the source), 50 (Artifacts tab placement). Knowledge source: research brief 04 §2 (authoritative section list and prompt requirements). This is a primary differentiator — specify deliberately, not as a thin spec wrapper.

## Goal

Generate a persisted, agent-readable handoff brief from a spec version: hard scope boundaries, concrete contracts, ordered work breakdown, acceptance checks, known traps, and a self-contained copyable prompt for Claude Code / Cursor / Copilot. Arqitect does not auto-run coding agents.

## Current State

`HandoffBrief` model exists (38). Nothing else.

## Implementation

1. **Task `trigger/generate-handoff.ts`** (`id: "generate-handoff"`, `maxDuration: 300`):
   - Input zod: `{projectId, specId}`. Loads the `ProjectSpec` row + its frozen context (same `canvasSnapshotId`/`conversationCursor` — the brief inherits the spec's moment, no new snapshot), the spec Markdown, all `DesignSection` rows, reasoning entities, and open blockers/questions.
   - **Section assembly** (`lib/handoff-compiler/` mirroring the 49 builder pattern — deterministic where the source is structured, one constrained LLM pass for the scope narrative and work-breakdown ordering):
     1. *Implementation scope* — in/out for this pass from `scope` + `lifecycleStatus ∈ {new, planned}` components.
     2. *Architecture summary* — compact component+flow recap from node/edge metadata (dense, no marketing prose).
     3. *Components to implement* — per in-scope component: responsibility, interfaces exposed (`interfaces`/`api-contract` sections), dependencies (edges), runtime.
     4. *Contracts & data shapes* — **the load-bearing section**: literal endpoint signatures, event payloads, entity schemas with storage engines, copied from `api-contract`/`data-model` content (verbatim restructuring, zero invention).
     5. *Suggested work breakdown* — ordered task list with explicit dependencies, topologically sane (datastores + contracts before handlers); LLM orders, builder validates every task names a real component/contract.
     6. *Risks & known unknowns the agent must NOT silently resolve* — open questions, unresolved blockers, low-confidence assumptions.
     7. *Acceptance checks* — FR acceptance criteria + NFR targets as a testable checklist.
     8. *Out-of-scope & known traps* — scope-out list + traps derived from `failureBehavior`/`securitySensitivity`/idempotency flags and review items.
     9. *Copyable agent prompt* — one fenced block embedding: role+objective, the architecture summary, the contracts, the scope fence ("do not implement out-of-scope items"), the ordered tasks, acceptance checks, the anti-hallucination clause ("If you hit any of these open questions, STOP and ask rather than assume: …"), agent-agnostic operating instructions (no vendor syntax — plain Markdown), and a provenance footer (`Generated from Arqitect spec v{n}, snapshot {id}`).
   - Persist: `HandoffBrief` row + immutable blob `handoffs/{projectId}/{handoffId}.md` (`allowOverwrite: false`); `ProjectActivity` `handoff_generated`; completion conversation message; status feed `kind: "handoff"` (extend `AI_STATUS_KINDS`).
   - Model: `REQUESTY_SPEC_MODEL`.
2. **Routes:**
   - `POST /api/ai/handoff` `{specId, roomId}` — auth (project resolved from roomId; verify the spec belongs to the project), rate cap (`taskKind: "handoff"`) + per-project queue per 34 §5 rules 8–9, trigger, `TaskRun`, 202 `{runId, publicToken}`. Gating: handoffs inherit the spec's carried blockers (already embedded in section 6) — no second gate.
   - `GET /api/projects/[projectId]/handoffs` (list: id, spec version, date, author) and `GET /api/projects/[projectId]/handoffs/[handoffId]/download` (private-blob stream, attachment, mirroring the spec download route).
3. **Artifacts tab — Handoff briefs section:** `Generate handoff brief` on each spec row (and section header for latest); list rows `Handoff · from spec v{n}`; actions `Preview` / `Download` / `Share` (reuse spec-50 `ShareLink` with `handoffId`).
   - **Preview dialog extra:** a pinned `Copy agent prompt` button that extracts and copies only the fenced prompt block (parse by the section-9 heading) — the single most-used affordance; show `Copied — paste into your coding agent` feedback.

## Error Handling

- Missing structured sources degrade like the spec compiler: section stubs name what's missing ("No API contracts generated — run LLD on gateway components for concrete contracts"); the copyable prompt always renders with whatever is available plus an explicit "context is incomplete in these areas" note.
- Spec blob unreadable → task error before any row writes.

## Scope Limits

- No per-agent prompt variants (post-launch); no auto-execution of agents; no GitHub/Linear issue creation.
- One implementation pass per brief — no multi-pass planning UI (the scope section defines the pass; regenerating after edits is the iteration path).

## Check When Done

- A brief generated from a full-ladder spec contains all nine sections with literal contracts and a self-contained prompt; the prompt pastes cleanly (plain Markdown, no app links required).
- Copy-prompt, download, and share work; brief links to its source spec version.
- Sparse projects produce honest, gap-flagged briefs; `npx tsc --noEmit` and `npm run build` pass.
