# 34 — Full Development Plan: Idea → Requirements → HLD → LLD → Spec → Handoff

> Master plan for taking Arqitect from the current canvas + single-shot AI implementation to the full product: an AI-native workspace where founders and engineering teams collaborate with agents to turn product ideas into implementation-ready software specs. Specs `35`–`53` are the implementation units; this file is the system design, the dependency order, and the decisions that bind them together.
>
> Grounding sources (read before implementing any unit):
> - `context/project-overview.md` — product contract and canonical artifact sections
> - `context/architecture-context.md` — storage model, metadata contract, invariants
> - `context/design/phase-content-spec.md` — the phase/section content contract ("book model")
> - `context/design/research/01-requirements.md` … `04-spec-handoff.md` — per-phase agent knowledge briefs
> - `context/design/comp_analysis/sysdesai.md` — primary competitor teardown

---

## 1. Product goal restated

Users start with an idea. They work with specialized agents to:

1. **Define requirements** — functional / non-functional / extended, scope, constraints, scale inputs (Requirements Analyst).
2. **Create high-level architecture** — component graph with rich metadata, tech-stack decisions with rationale, deployment topology, capacity estimates with shown calculations (HLD Designer + Capacity Estimator).
3. **Break the system into low-level designs** — per-component chapters: data models, API contracts, sequence flows, state machines, class models (LLD agents).
4. **Generate implementation-ready artifacts** — versioned Markdown technical specs and coding-agent handoff briefs with a copyable agent prompt (Spec Compiler).

The builder stays in control: AI clarify and review modes never silently mutate the canvas; spec generation gates on unresolved blockers; every artifact links back to the exact canvas snapshot, conversation cursor, and decision-log state it was generated from.

### Competitive position (from `sysdesai.md`)

Borrow: phase pipeline, clarifying-questions-first, calculations shown on estimates, dependency-aware staleness, export-to-coding-agent as the payoff.
Beat: real-time collaborative editable canvas (we have it, they do not), LLD depth (they stop at HLD + sequence flows), project/workspace persistence with collaborators, and the reasoning layer (decisions, assumptions, risks, review items) as proprietary accumulated context.

---

## 2. Current state audit (2026-06)

| Subsystem | State |
|---|---|
| Auth, projects, collaborators, invitations | Done (Clerk, Prisma, invitation accept/deny) |
| Dashboard, landing, onboarding flow | Done (conversational kickoff agent, `PendingGeneration`) |
| Canvas | Done: shapes, edges, colors, labels, presence, undo/redo, templates (3), autosave to a single overwriting blob `canvas/{projectId}.json` |
| Node/edge metadata v1 | **Missing** — `CanvasNodeData` is `{label, color, shape}` only |
| Versioned snapshots | **Missing** — invariant 11 (append-only snapshots) not implemented |
| Conversation | Liveblocks feeds only (`ai-chat`, `ai-status-feed`) — **not durable in Postgres** (violates invariant 9) |
| Decisions / assumptions / risks / open questions | **Missing** |
| Review items | **Missing** |
| Requirements phase | Partial — onboarding agent produces a free-form brief, not a structured `RequirementsDocument` |
| HLD generation | Partial — `trigger/design-agent.ts` emits nodes/edges without metadata, no decisions, no tech-stack/deployment/capacity sections |
| AI clarify / review modes | **Missing** |
| LLD | **Missing** entirely |
| Spec generation | Partial — single-shot `generateText` from nodes+edges+chat; no frozen context, no canonical sections, no gating, no version links (`ProjectSpec` has only `filePath`) |
| Handoff brief | **Missing** |
| Views (engineering/executive/implementation) | **Missing** |
| Template bundles (seed assumptions/questions) | **Missing** — templates are canvas-only |

Existing patterns to reuse everywhere: `getCurrentProjectIdentity` + `getProjectWithAccess` for auth, `TaskRun` rows + scoped public tokens for Trigger.dev realtime, Requesty provider with env-resolved model ids, zod validation at every boundary, status updates via the `ai-status-feed` Liveblocks feed.

---

## 3. Target system design

### 3.1 The design ladder and the book model

The product is a four-phase ladder. Each phase produces typed, persisted content; the spec compiler assembles (never invents) from it.

| Phase | Produces | Storage surface |
|---|---|---|
| Requirements | `RequirementsDocument` (FR/NFR/extended/scope/constraints/scale inputs) + seeded assumptions and open questions | Postgres (JSONB document + first-class rows) |
| HLD | Canvas graph with v1 node/edge metadata + `DesignSection` rows (`tech-stack`, `deployment`, `capacity-estimation`, `scalability-resilience`, `api-surface`) + decisions | Liveblocks canvas (snapshotted to Blob) + Postgres |
| LLD | Per-component chapters: `DesignSection` rows (`data-model`, `api-contract`, `sequence-flow`, `state-machine`, `class-model`, `interfaces`, `error-handling`, `design-patterns`) keyed by `targetNodeId` | Postgres (JSONB content, typed renderers) |
| Spec / Handoff | Compiled Markdown spec versions + handoff briefs | Blob (immutable) + Postgres records |

**Launch decision — LLD chapters are structured documents, not child canvases.** The book model's "child canvas pages" become Postgres `DesignSection` rows with typed JSONB content rendered by dedicated components (tables, custom SVG sequence/state renderers). Multi-page Liveblocks rooms are deferred post-launch. This keeps one collaborative room per project, avoids multi-room token/snapshot complexity, and still delivers the LLD depth the competitor lacks.

### 3.2 New relational model (one migration unit, spec 38)

```
ConversationMessage   — durable chat: author, type (user|ai_clarify|ai_review|system), content, soft target ref
ProjectDecision       — title, context, options, decision, rationale, alternatives rejected, status, source
ProjectAssumption     — title, description, confidence, status, isDefault, source
ProjectRisk           — title, description, severity, likelihood, status, source
ProjectOpenQuestion   — title, description, status (open|resolved|intentionally_open), proposedDefault, source
ProjectReviewItem     — unified human+AI review primitive: severity, status, target, resolver, reason
RequirementsDocument  — one per project, versioned JSONB content (schema from research brief 01 §4)
DesignSection         — typed book section: phase, sectionType, targetNodeId?, JSONB content, confidence, staleAt
CanvasSnapshot        — append-only snapshot pointer rows; Project gains currentSnapshotId
HandoffBrief          — artifact record linked to the ProjectSpec version it came from
ProjectActivity       — access/audit events (collaborator changes, generation events)
ProjectSpec (extend)  — + version, canvasSnapshotId, conversationCursor, generationContext JSONB
```

Soft references: reasoning entities and messages reference canvas elements by `targetKind` + `targetId` (string node/edge ids inside the snapshot). Targets can be deleted; render "target deleted" gracefully and exclude from generation context (invariant 14). Cross-entity links are a `links` JSONB array of `{kind, id}` at launch — promote to a join table only when a feature needs reverse queries.

### 3.3 Storage allocation (extends existing rules)

- Postgres: everything in 3.2 plus existing models. JSONB for document-shaped content (`RequirementsDocument.content`, `DesignSection.content`) because sections are read/written whole and rendered client-side; relational rows for anything that gates, filters, or aggregates (review items, open questions, decisions).
- Vercel Blob (immutable, never overwritten): `canvas/{projectId}/{snapshotId}.json`, `specs/{projectId}/{specId}.md`, `handoffs/{projectId}/{handoffId}.md`.
- The existing mutable `canvas/{projectId}.json` working copy stays for fast autosave/restore; immutable snapshots are written on a defined cadence (spec 37). This honors invariant 11 without writing a blob every 1.5 s.

### 3.4 AI crew (all durable Trigger.dev tasks, triggered by thin authenticated routes)

| Task | Mutates canvas? | Writes |
|---|---|---|
| `requirements-analyst` (route-based turns + structuring task) | No | `RequirementsDocument`, seeded `ProjectOpenQuestion`/`ProjectAssumption` rows |
| `design-agent` v2 (HLD Designer) | **Yes — the only one** | Nodes/edges **with v1 metadata**, decisions/assumptions/open questions (source: ai), completion snapshot |
| `generate-hld-sections` (incl. Capacity Estimator) | No | `DesignSection` rows: tech-stack, deployment, capacity-estimation, scalability-resilience, api-surface |
| `ai-clarify` | No | `ConversationMessage` rows (type `ai_clarify`) threaded to nodes/edges/project |
| `ai-review` | No | `ProjectReviewItem` rows (source: ai) |
| `lld-chapter` | No | `DesignSection` rows (phase: lld) for one component |
| `generate-spec` v2 (Spec Compiler) | No | Immutable spec blob + `ProjectSpec` version row with frozen-context links |
| `generate-handoff` | No | Immutable handoff blob + `HandoffBrief` row |

Model resolution: every task resolves its model id from env (`REQUESTY_DESIGN_MODEL`, `REQUESTY_SPEC_MODEL`, `REQUESTY_REVIEW_MODEL`, `REQUESTY_LLD_MODEL`, `REQUESTY_ONBOARDING_MODEL`) with documented fallbacks — no hardcoded model ids, matching the onboarding-agent pattern.

**Frozen generation context** (spec 49): at spec/handoff generation start the route writes a snapshot, records the latest `ConversationMessage` id as the cursor, and the task reads entities once. The artifact row stores `canvasSnapshotId` + `conversationCursor` + a `generationContext` JSONB summary (entity counts, blockers carried, confidence summary) so every version is reproducible (invariants 10, 12).

**Gating** (specs 41 + 49): open blocker-severity review items and `open` (not `intentionally_open`) questions return a confirmation requirement from `POST /api/ai/spec`; the user resolves, marks intentionally open, or explicitly proceeds (invariant 13).

### 3.5 Workspace information architecture

The right sidebar (`components/editor/ai-sidebar.tsx`) is restructured once and each unit slots into it — no per-spec layout invention:

| Tab | Contents | Filled by spec |
|---|---|---|
| **Arqitect** | Chat thread (durable conversation) + mode actions: `Draft architecture`, `Ask clarifying questions`, `Find risks` + status strip | 39, 43, 45, 46 |
| **Design** | Requirements panel → HLD sections → Components list → per-component LLD chapters | 42, 44, 47, 48 |
| **Review** | Review items (unified) + Decisions / Assumptions / Risks / Open questions panels | 40, 41 |
| **Artifacts** | Spec versions (history, preview, compare, download, share) + handoff briefs + generate actions | 49, 50, 51 |

The current `Chat` and `Specs` tabs fold into Arqitect and Artifacts respectively. Canvas chrome additions: metadata inspector (36), view switcher (52), per-element review badges (41).

### 3.6 Canvas metadata contract amendments

Spec 35 implements the v1 contract from `architecture-context.md` with two research-driven amendments (update `architecture-context.md` when implemented):

- Edge `protocol` enum gains `websocket` and `sse` (research brief 02 §2.11 — real-time protocol choice is a first-class HLD decision).
- Node metadata gains optional `storageEngine` (string) for datastore nodes — bridges HLD to the LLD data-model's engine-per-entity convention.
- `scalingConcern`/`consistencyModel` and other v2 fields stay post-launch as documented.

---

## 4. Implementation phases and spec index

Each spec is one verifiable unit per `context/ai-workflow-rules.md`. Order within a phase is the dependency order.

### Phase A — Foundation (semantics + durability)

| Spec | Unit | Depends on |
|---|---|---|
| `35-canvas-metadata-contract.md` | Metadata v1 types, zod schemas, canvas data extension, completeness helpers | — |
| `36-metadata-inspector.md` | Inspector panel UI to edit node/edge metadata; completeness + low-confidence indicators | 35 |
| `37-canvas-snapshot-versioning.md` | `CanvasSnapshot` model, append-only blob writes, pointer, cadence, APIs | — |
| `38-design-data-foundation.md` | One Prisma migration: all models in §3.2 + delegate guard | — |
| `39-project-conversation.md` | Durable conversation: lib helper, routes, Liveblocks live wiring, threading | 38 |

### Phase B — Reasoning layer + review

| Spec | Unit | Depends on |
|---|---|---|
| `40-decision-log.md` | Decisions/assumptions/risks/open-questions CRUD APIs + Review-tab panels | 38 |
| `41-review-workflow.md` | Review items CRUD, resolve/dismiss flow, gating helper, canvas badges | 38, 40 |

### Phase C — AI co-architect crew

| Spec | Unit | Depends on |
|---|---|---|
| `42-requirements-phase.md` | Requirements Analyst: structured `RequirementsDocument`, three-state fields, requirements panel | 38, 39, 40 |
| `43-hld-designer-v2.md` | Design agent v2: metadata-populating generation, emitted decisions, guardrails | 35, 37, 38, 42 |
| `44-hld-sections-and-capacity.md` | HLD sections task incl. Capacity Estimator (calculations shown); section renderers | 38, 42, 43 |
| `45-ai-clarify-mode.md` | Clarify task → threaded conversation messages; mode action UI | 39 |
| `46-ai-review-mode.md` | Review task → AI review items across domain checklist; mode action UI | 41 |

### Phase D — LLD (the depth moat)

| Spec | Unit | Depends on |
|---|---|---|
| `47-lld-chapter-generation.md` | LLD section content schemas + `lld-chapter` task + route | 35, 38, 43 |
| `48-lld-chapter-ui.md` | Components list, chapter view, typed section renderers (tables, sequence/state SVG) | 47 |

### Phase E — Artifacts (the payoff)

| Spec | Unit | Depends on |
|---|---|---|
| `49-spec-compiler-v2.md` | Frozen context, gating confirmation, canonical-section compilation, versioned spec records | 37, 38, 41, 42–47 (degrades gracefully when phases are sparse) |
| `50-spec-history-and-sharing.md` | Artifacts tab: version history, staleness, compare, download, share links | 49 |
| `51-handoff-brief.md` | Handoff task + sections + copyable agent prompt + UI | 49 |

### Phase F — Differentiation polish

| Spec | Unit | Depends on |
|---|---|---|
| `52-canvas-views.md` | Engineering / executive / implementation derived views | 35 |
| `53-template-library-v2.md` | Template bundles: pre-populated metadata + seed assumptions/questions/clarifying questions | 35, 38, 39, 40 |

Sequencing rule: Phase A and B land before any Phase C task ships, because every AI task reads/writes those tables. Phase E spec 49 must degrade gracefully — a project with no requirements doc or LLD chapters still compiles a spec with those sections explicitly marked `_Not yet specified._` (compilation rule, research brief 04 §4.1).

---

## 5. Cross-cutting rules (bind every spec below)

1. **Invariants 1–14 in `architecture-context.md` hold.** Notably: clarify/review never mutate the canvas; artifacts are immutable; generation reads captured snapshots, not the live room; auth + ownership at every mutation boundary.
2. **No fabrication.** Unanswered required inputs become `ProjectOpenQuestion` rows, never invented values. NFRs without a target spawn a linked open question (research brief 01 §4.3 invariant). Unsupported metadata is `confidence: low`, not guessed.
3. **Compilation, not generation.** Every spec section has a named book source; empty source → visible stub, never plausible prose. Estimates always ship value + shown calculation + assumptions.
4. **Routes stay thin.** Validate (zod) → auth (`getCurrentProjectIdentity` + `getProjectWithAccess`) → persist/trigger → respond. Long work lives in `trigger/`.
5. **Status + realtime.** Every task publishes to the `ai-status-feed` with its `kind` (extend `AI_STATUS_KINDS` as kinds are added) and is tracked via `TaskRun` + scoped public tokens, matching the design-agent pattern.
6. **Design system discipline.** New UI uses tokens from `globals.css`, the product language from `ui-context.md`, kebab-case responsibility-named files, and the documented radius scale. No raw hex, no `zinc-*`.
7. **Docs in sync.** Each implemented unit updates `progress-tracker.md`; contract changes (metadata enum additions, storage rules) update `architecture-context.md` before continuing.
8. **One generation at a time per project.** Every AI task that mutates the canvas or compiles artifacts (`design-agent`, `generate-hld-sections`, `lld-chapter`, `generate-spec`, `generate-handoff`) is triggered with a per-project Trigger.dev queue: `queue: { name: "project-{projectId}", concurrencyLimit: 1 }`. Two collaborators triggering simultaneously serialize instead of interleaving canvas mutations or racing version numbers. Read-only tasks (`ai-clarify`, `ai-review`) skip the queue.
9. **Rate caps on AI routes.** Every `/api/ai/*` route calls a shared `lib/ai-rate-limit.ts` helper before triggering: count `TaskRun` rows for the project + task kind in the last hour (store the task id on `TaskRun` — add a `taskKind` column in spec 38); over the cap (default 10/hour per kind, env-tunable `AI_RUNS_PER_HOUR`) → 429 with a retry-after message. No new infrastructure — `TaskRun` is the ledger. Billing stays out of scope; abuse control does not.
10. **AI-generated sections are editable, not regenerate-only.** Structured `DesignSection` content supports field-level manual editing through a zod-validated PATCH (version bump, `source` flips to `HUMAN`). The builder fixes the 10% the agent got wrong instead of re-rolling the section — "builder in control" applies to the content layer that feeds the compiler, not just the canvas.
11. **Proposed decisions are surfaced, not buried.** AI-emitted decisions land as `PROPOSED` and the generation completion flow prompts review (accept / edit / supersede via spec-40 machinery). The spec compiler labels unaccepted decisions `Proposed — not yet confirmed` so an unreviewed decision never reads as a settled one.

## 6. Deliberately deferred (post-launch, do not build now)

Multi-page child canvases for LLD; class-diagram canvas rendering (table renderer at launch); per-agent handoff prompt variants; v2 metadata fields; ADR export as a separate artifact; C4 auto-generation; automatic dependency-aware regeneration (launch ships staleness *indicators*, regeneration stays user-triggered); spec version semantic diffing (launch ships side-by-side compare); public template gallery; billing.

## 7. Success mapping

Capability criteria 1–13 in `project-overview.md` map: 7→35/36, 8→40, 9→41/46, 10→49, 11→49/50, 12→51, 13→37/38. Outcome criteria 16–19 (iterative regeneration, accepted AI review items, downloaded artifacts, specs generated against projects with decisions/assumptions/resolved review items) become measurable only after Phases B–E land — instrument counts via existing dashboard queries once shipped.

**End-to-end verification gate (after Phase E):** one Playwright journey test covering the full ladder — create project via AI prompt → requirements doc exists → draft architecture (metadata present) → run AI review → resolve a blocker → generate spec (gate fires, then passes) → generate handoff → copy agent prompt. Per-unit checks verify pieces; this verifies the product promise.
