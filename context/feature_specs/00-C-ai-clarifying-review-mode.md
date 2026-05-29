
## Spec 03 — AI Design Generation with Structured Input

This is the third of nine specs. Spec 01 captured structured interview input as `PendingGeneration` rows; spec 02 defined the canvas metadata schema as a code contract and shipped templates with seed assumptions and open questions. This spec turns the interview into an architecture — durably, with metadata populated, with unanswered fields materialized as open questions, and without silently overwriting the user's canvas.

### Strategic Intent

This is the spec where Arqitect either earns or loses the "AI co-architect, not a magic drawing button" claim from the persona document. Every previous Arqitect surface treats AI as a one-shot transformation: prompt in, diagram out. The persona document was explicit that this is the failure mode — shallow output that competitors already match. The product spec carried this forward by requiring (a) structured pre-generation input, (b) low-confidence flagging instead of fabrication, and (c) unanswered fields surfaced as open questions rather than hidden assumptions.

Three things make this generation different from "prompt → diagram":

1. **The input is structured.** The interview payload from spec 01 has named fields. The generator does not have to guess what the user meant by "build me an app" — it has system goal, users, flows, data stores, integrations, runtime, scale, and constraints, or it has the explicit absence of those fields, which is itself information.
2. **The output is structured.** Every node and edge written carries v1 metadata from the schema in spec 02. Fields the input does not support are marked `confidence: low`, not fabricated. The user can see exactly where the generator was guessing.
3. **The output captures uncertainty.** Unanswered interview fields, ambiguous prompts, and architectural choices that depend on missing context all become `OpenQuestion` rows on the project. The canvas is not the only artifact — the open questions are part of the output.

This is also the spec where the design generation task respects the canvas as a shared, possibly non-empty space. The user may have already imported a template (spec 02), may have added their own nodes, may have invited collaborators who are editing live. Generation cannot blindly overwrite. The task writes new nodes and edges as a clearly-labeled generation subgraph, respecting the same labeling pattern templates use.

### What This Spec Delivers

A durable AI generation task that:

* Reads `PendingGeneration` (interview payload or free-form prompt, with optional template hint).
* Produces a typed generation plan validated against the spec 02 metadata schema.
* Writes nodes and edges into the Liveblocks room as a labeled generation subgraph, with the canvas snapshot taken after generation completes.
* Materializes unanswered interview fields and generator-flagged uncertainties as `OpenQuestion` rows.
* Materializes generator-stated assumptions as `Assumption` rows with explicit confidence.
* Reports progress visibly through the AI sidebar from the moment the user confirms generation until completion or failure.
* Handles cancellation, retry, and partial failure without leaving the canvas in an inconsistent state.

What this spec does *not* deliver:

* AI clarify or AI review modes. Those are separate AI surfaces and arrive in later specs (clarify is woven into spec 04's conversation system; review is spec 08).
* Iterative regeneration based on user feedback ("change this part"). The user can edit the canvas after generation; targeted regeneration is out of scope.
* Multi-turn refinement. Generation is a single durable task per confirmation.
* Conversation persistence. Spec 04. Generation-time messages use the spec 02 stopgap (project-level question list) until then.
* Canvas metadata editing UI. Spec 05.

### User Story

> As an engineering lead who just finished the pre-generation interview, when I confirm generation, I want to see Arqitect actually work — show me what it's drafting, populate the canvas with structured components and connections, mark what it's confident about and what it's guessing at, and turn the questions I didn't answer into things I can revisit later. I do not want a black box that produces a diagram I have to reverse-engineer.

### The Generation Plan

The generator does not write directly to Liveblocks. It produces an intermediate artifact — the *generation plan* — which is validated, materialized, and then applied. This split exists for three reasons: it makes the AI output testable in isolation, it allows validation failures to be caught before any canvas mutation, and it gives the user something to look at if generation succeeds but apply fails.

typescript

```typescript
// lib/ai/generation/plan-schema.ts

exportconstGenerationPlan= z.object({
  summary: z.string().max(1000),
// The generator's one-paragraph description of what it built and why.
// Surfaced in the AI sidebar after completion.

  nodes: z.array(z.object({
    planId: z.string(),// stable within the plan, remapped on apply
    label: z.string().max(80),
    position: z.object({ x: z.number(), y: z.number()}),
    metadata:NodeMetadataV1,// from spec 02
    sourceReasoning: z.string().max(300),
// Why this node exists. Surfaced on hover/inspection. Helps the user
// understand the generator's intent without re-reading the prompt.
})).max(40),
// Cap exists because canvases beyond ~40 nodes are unreadable and almost
// always indicate the generator is fabricating detail. If the system genuinely
// needs more components, the user can extend the design after generation.

  edges: z.array(z.object({
    planId: z.string(),
    sourcePlanId: z.string(),
    targetPlanId: z.string(),
    label: z.string().max(80).optional(),
    metadata:EdgeMetadataV1,// from spec 02
    sourceReasoning: z.string().max(300),
})).max(80),

  generatorAssumptions: z.array(z.object({
    title: z.string().max(120),
    description: z.string().max(500),
    confidence: z.enum(["high","medium","low"]),
    linkedPlanNodeIds: z.array(z.string()).optional(),
    linkedPlanEdgeIds: z.array(z.string()).optional(),
})).max(20),
// Things the generator decided in the absence of explicit input. The user
// sees these and can validate, change, or invalidate them.

  generatedOpenQuestions: z.array(z.object({
    title: z.string().max(120),
    description: z.string().max(500),
    linkedPlanNodeIds: z.array(z.string()).optional(),
    linkedPlanEdgeIds: z.array(z.string()).optional(),
})).max(30),
// Architectural choices the generator could not responsibly make. Includes
// the unanswered interview fields plus generator-detected ambiguities.
});
```

The plan is JSON. It is what the LLM produces. It is validated by Zod before any further step runs. A plan that fails validation is rejected outright — the user sees a generation failure, not a partially-applied broken canvas.

### The Trigger.dev Task

The task lives in `trigger/generate-design.ts` and conforms to the architecture context's invariant that AI work runs as durable background jobs, never in request handlers.

#### Inputs

typescript

```typescript
exporttypeGenerateDesignInput={
  projectId:string;
  pendingGenerationId:string;
  initiatedBy:string;// Clerk user ID
  idempotencyKey:string;// prevents double-execution on retry
};
```

The task does not receive the payload itself — it receives the ID and loads the payload inside the task. This means the payload can be updated by the user between confirmation and task start (rare, but possible during slow network) and ensures the task uses the canonical Postgres row, not a stale duplicate.

#### Lifecycle

1. **Acquire run.** Insert a `TaskRun` row in Postgres with status `running`, type `design_generation`, project ID, initiator, and started timestamp. This is the durable trace of the run, visible to the user in the sidebar and queryable for debugging.
2. **Load payload.** Fetch `PendingGeneration` by ID. If missing or expired, fail with `pending_generation_not_found`. If the project already has a generation in progress (another `TaskRun` of type `design_generation` with status `running` for the same project), fail with `generation_already_in_progress` — the API layer should have prevented this, but the task double-checks.
3. **Load context.** Fetch project, current canvas snapshot (if any), existing assumptions and open questions, and the optional template hint. The template hint is used as a soft prior, not a constraint — the generator can deviate from it if the prompt suggests a different pattern.
4. **Update status.** Set `TaskRun.status = "drafting"`. The sidebar reads this and shows the corresponding progress message.
5. **Call the model.** Construct the prompt (see "Prompting strategy" below), call the model with the `GenerationPlan` schema as the structured-output target. The model call has a hard timeout of 90 seconds. On timeout, retry once with the same payload. On second timeout, fail with `generation_timeout`.
6. **Validate plan.** Parse the model response against `GenerationPlan`. On parse failure, retry once with a corrective prompt that includes the validation errors. On second parse failure, fail with `generation_invalid_plan`.
7. **Update status.** Set `TaskRun.status = "applying"`. The sidebar shows the corresponding message.
8. **Materialize.** Apply the plan to the canvas and Postgres in a single materialization step (see "Materialization" below). This is the only place canvas mutation happens.
9. **Snapshot.** Trigger a canvas snapshot write per the architecture context's snapshot cadence rules. The `TaskRun` row records the resulting snapshot ID.
10. **Complete.** Set `TaskRun.status = "completed"`, set `completedAt`, store the plan summary on the row. Delete the `PendingGeneration` row.
11. **Notify.** Emit a Liveblocks event the sidebar listens for, so all collaborators see completion in real time.

#### Failure paths

Each named failure mode (`pending_generation_not_found`, `generation_already_in_progress`, `generation_timeout`, `generation_invalid_plan`, `materialization_failed`, `model_error`) updates `TaskRun.status = "failed"` with an error code and a human-readable failure summary. The user sees the failure summary in the sidebar with a "Retry generation" affordance. The `PendingGeneration` row is preserved on failure so retry is meaningful.

### Materialization

This is the consistency-critical step. The plan is in memory; Liveblocks and Postgres are about to be written. The architecture context already addressed two-store consistency for template import; the same pattern applies here, scaled up.

#### Order of operations

1. **Remap IDs.** Generate fresh canvas IDs for every node and edge in the plan. Build a remap table from `planId` to canvas ID. Apply the remap to edge source/target and to all linked-ID arrays in assumptions and open questions.
2. **Compute subgraph ID.** Each generation gets a `generationSubgraphId`. Every node and edge written by this generation carries a `generationOrigin: { generationSubgraphId, runId, generatedAt }` field, mirroring the `templateOrigin` pattern from spec 02.
3. **Compute layout.** The plan's positions are LLM-supplied and often clustered or overlapping. Run a layout pass (Dagre or Elk) over the new subgraph before writing. The layout respects existing canvas content: the generated subgraph is positioned in an empty region of the canvas, not overlapping user-created or template nodes.
4. **Write Postgres first.** Open a transaction. Insert all `Assumption` rows with `source: "ai"` and `taskRunId` set. Insert all `OpenQuestion` rows with `source: "ai"` and `taskRunId` set. Commit. If this transaction fails, the entire generation fails and no canvas writes occur.
5. **Write Liveblocks.** Apply node and edge inserts to the Liveblocks room via the server client, in a single batched mutation. The subgraph appears on all collaborators' canvases simultaneously.
6. **On Liveblocks failure after Postgres success.** Delete the just-inserted `Assumption` and `OpenQuestion` rows by `taskRunId`. Set `TaskRun.status = "failed"` with `materialization_failed`. The user sees a retry option. The canvas is unchanged.
7. **On Liveblocks success.** Trigger snapshot. Update `TaskRun` to completed.

Postgres-first ordering means the visible-to-user state (the canvas) is only mutated after the durable state is safe. The inverse order — canvas first, Postgres after — is rejected: a successful canvas write followed by a failed Postgres write would leave the user looking at generated content with no way to track its assumptions or open questions.

#### Idempotency

The Trigger.dev `idempotencyKey` is the `PendingGeneration` ID combined with a confirmation nonce generated by the API endpoint. Re-triggering the same key returns the same task run. This handles double-clicks, network retries, and accidental re-submissions without producing duplicate generations.

### API Surface

#### `POST /api/projects/{projectId}/generations`

Confirms generation and queues the task. Idempotent via `Idempotency-Key` header.

**Request:**

json

```json
{"pendingGenerationId":"pg_abc123"}
```

**Server logic:**

1. Validate project access (owner or collaborator).
2. Validate that `pendingGenerationId` belongs to this project and is not expired.
3. Check for in-flight generation. If one exists for this project, return `409 generation_already_in_progress` with the existing `runId`.
4. Generate a confirmation nonce. Combine with `pendingGenerationId` for the Trigger.dev `idempotencyKey`.
5. Trigger the task. Return `{ runId, status: "running" }`.

The endpoint does not run the model. It does not write to Liveblocks. It does the minimum necessary to durably queue work.

#### `GET /api/projects/{projectId}/generations/{runId}`

Returns the current `TaskRun` state. The sidebar polls this for progress, though Liveblocks events are the primary signal.

#### `POST /api/projects/{projectId}/generations/{runId}/cancel`

Cancels an in-flight generation. The Trigger.dev task respects cancellation between steps — it cannot interrupt an in-flight model call but will exit before applying the plan. Cancellation sets `TaskRun.status = "cancelled"` and does not delete `PendingGeneration` (the user may want to retry with the same payload).

### Schema Additions

prisma

```prisma
model TaskRun {
  id                  String    @id @default(cuid())
  projectId           String
  project             Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type                String    // "design_generation" | "spec_generation" | "handoff_generation" | future
  status              String    // "running" | "drafting" | "applying" | "completed" | "failed" | "cancelled"
  initiatedBy         String    // Clerk user ID
  startedAt           DateTime  @default(now())
  completedAt         DateTime?
  errorCode           String?
  errorMessage        String?
  summary             String?   // generator's plan summary on success
  resultSnapshotId    String?   // canvas snapshot id at completion
  generationSubgraph  String?   // for design_generation runs
  inputRef            String?   // PendingGeneration id for design_generation
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([projectId, type, status])
}
```

`TaskRun` is the generic durable-run model. This spec uses it for `design_generation`; specs 06 and 09 will use it for `spec_generation` and `handoff_generation`. Defining it now with the broader use in mind avoids a near-future migration.

The `Assumption` and `OpenQuestion` models from spec 02 need one additive field each:

prisma

```prisma
// Added to Assumption and OpenQuestion in spec 02:
taskRunId  String?  // set when source = "ai", references TaskRun.id
```

This allows rollback by `taskRunId` if materialization fails, and lets the UI group AI-generated entities by the run that produced them.

### Prompting Strategy

The model call is structured. The prompt is constructed from a system prompt and a user prompt, both deterministic given the inputs.

#### System prompt (excerpt)

The full system prompt lives in `lib/ai/generation/prompts.ts`. Its key directives:

* The output must be a valid `GenerationPlan` JSON object. Structured-output mode is used; the model cannot return prose.
* Every node and edge must include metadata. Fields the input does not support must be marked `confidence: "low"`, not omitted and not fabricated.
* Components and connections must serve the stated system goal. Components that are tangential to the goal must not be added.
* Every assumption the generator makes in the absence of explicit input must be listed in `generatorAssumptions`, with explicit confidence and linked components.
* Every architectural choice the generator could responsibly defer must be listed in `generatedOpenQuestions`, not silently decided.
* Total node count should reflect the stated scale. A prototype-scale system should not produce 40 nodes. A team-scale or product-scale system may.
* Templates referenced in the input are starting priors, not constraints. The generator may deviate if the prompt suggests a different pattern.

#### User prompt (constructed)

The user prompt is the interview payload, formatted as a structured document. Unanswered fields are explicitly marked unanswered, not omitted — this is what tells the model to produce open questions for them.

Example skeleton:

```
System goal: <text or "(not specified)">
Primary users: <text or "(not specified, treat as open question)">
Critical flows: <list or "(not specified, treat as open question)">
Expected data stores: <list or "(not specified, treat as open question)">
External integrations: <list or "(not specified, treat as open question)">
Runtime context: <text or "(not specified, treat as open question)">
Scale expectations: <text or "(not specified, treat as open question)">
Known constraints: <list or "(not specified, treat as open question)">
Most similar pattern (if any): <template id or none>

Existing canvas content (do not modify, position new components away from these):
<summary of existing nodes and edges, or "(empty canvas)">

Existing project open questions (do not duplicate):
<list of open question titles, or "(none)">
```

This makes the input legible to the model and makes the prompt-to-output mapping debuggable. Generation logs include the full user prompt and the resulting plan, retained per `TaskRun` for 30 days for debugging.

#### Why explicit-unanswered instead of omission

If we omit unanswered fields, the model has to choose between silently filling them in or noticing the omission. Production LLMs choose the former most of the time. Explicit `(not specified, treat as open question)` markers turn what would be a silent assumption into a generated open question. This is the cheapest mechanism for executing the "low-confidence is visible, not hidden" promise.

### Sidebar UI

The AI sidebar from spec 01 currently shows a static preview of the interview answers. This spec wires it through generation.

#### States

| `TaskRun.status` | Sidebar UI                                                                                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (no run)           | Interview preview with confirm button (from spec 01).                                                                                                                                                                                                                      |
| `running`        | "Reading your interview answers." Spinner. Cancel button.                                                                                                                                                                                                                  |
| `drafting`       | "Drafting the architecture." Spinner. Cancel button.                                                                                                                                                                                                                       |
| `applying`       | "Applying the design to your canvas." Spinner. No cancel (the apply step is short and the cancellation would not save work).                                                                                                                                               |
| `completed`      | Plan summary at top. Below it, three sections: "What was generated" (subgraph stats), "Generator assumptions" (list), "New open questions" (list). Each list item has a quick action to jump to the linked canvas element. A "Generation history" link reveals prior runs. |
| `failed`         | Failure summary with error code, a "Retry generation" button (re-uses the same `PendingGeneration`), and a "Edit answers and retry" button (reopens the interview form pre-filled).                                                                                      |
| `cancelled`      | Cancelled summary. "Retry generation" button.                                                                                                                                                                                                                              |

The sidebar listens for the Liveblocks event emitted on task completion. Polling `GET /api/.../generations/{runId}` is a fallback for clients that lose the realtime connection.

#### Multi-collaborator visibility

When a collaborator triggers generation, all other collaborators in the room see the sidebar enter the running state. A presence indicator shows which collaborator initiated. This is important: generation modifies the shared canvas, and other users need to know why their canvas is about to change.

### Existing Canvas Handling

Generation must respect non-empty canvases. Three scenarios:

1. **Empty canvas.** Generated subgraph is placed at the origin. Default case.
2. **Canvas with prior template import.** Generated subgraph is positioned to the right of or below the imported template. The subgraph is its own labeled group, distinct from the template subgraph. The generator is told about the template via the prompt and may produce connections from the generation subgraph to template nodes — these connections are recorded as cross-subgraph edges, owned by the generation run.
3. **Canvas with user-created content.** Generated subgraph is positioned in the largest empty region. The generator is given a summary of existing nodes and explicitly instructed not to duplicate them or modify them. Cross-subgraph edges from the generation to existing nodes are allowed; modifications to existing nodes are not.

Subgraph labeling follows the spec 02 pattern: an accent border around generated nodes, a non-interactive group label above the subgraph reading `AI-generated: {plan summary first line}`, and an overflow menu with `Remove subgraph`, `Detach from generation`, and `View generator's assumptions`.

This subgraph-based approach is the answer to "what if the user already imported a template and then asks the AI to generate?" The two co-exist as labeled groups. The user can keep both, remove one, or detach either into ungrouped canvas content they own.

### UI Language

* Sidebar progress messages are plain and technical, no enthusiasm copy. "Drafting the architecture." not "Crafting your masterpiece."
* Generated subgraph border uses the same accent token system as template subgraphs, with a different hue to distinguish AI generation from template import.
* Generator reasoning (`sourceReasoning` on nodes and edges) is surfaced on hover via the existing canvas inspector pattern, not in always-visible labels.
* Low-confidence metadata is visually marked on the canvas: a small `?` indicator on nodes with `confidence: "low"`, and dashed edges for edges with `confidence: "low"`. This makes shallowness visible at a glance, executing the product spec's commitment to make confidence visible rather than hidden.

### Copy

| Surface                                  | Copy                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Confirm generation button                | Generate the architecture                                                                                           |
| Confirm generation footnote              | Arqitect will draft components, connections, and open questions from your answers. You can edit anything afterward. |
| Status: running                          | Reading your interview answers.                                                                                     |
| Status: drafting                         | Drafting the architecture.                                                                                          |
| Status: applying                         | Applying the design to your canvas.                                                                                 |
| Status: completed header                 | Generation complete                                                                                                 |
| Completed: assumptions section header    | What Arqitect assumed                                                                                               |
| Completed: assumptions section subtitle  | These are decisions made in the absence of explicit input. Validate, adjust, or invalidate them.                    |
| Completed: open questions section header | New open questions                                                                                                  |
| Completed: open questions subtitle       | These are choices that should be made before implementation. Arqitect didn't decide them on your behalf.            |
| Status: failed header                    | Generation failed                                                                                                   |
| Status: failed retry button              | Retry with the same answers                                                                                         |
| Status: failed edit button               | Edit answers and retry                                                                                              |
| Status: cancelled                        | Generation cancelled. Your interview answers are preserved.                                                         |
| Subgraph group label                     | AI-generated: {plan summary first line}                                                                             |
| Subgraph overflow: remove                | Remove this generation's components from the canvas. Assumptions and open questions will be kept.                   |
| Subgraph overflow: detach                | Detach from the generation. The components stay; they become regular canvas elements you own.                       |
| Low-confidence node tooltip              | Low confidence: this component was inferred without explicit input.                                                 |
| Low-confidence edge tooltip              | Low confidence: this connection was inferred without explicit input.                                                |

The "What Arqitect assumed" framing is deliberate. It names the generator as the actor, not the user. The user did not assume these things — the AI did, and the AI is accountable for surfacing them.

### Error Handling

* `pending_generation_not_found`: sidebar shows "Your interview answers expired. Start a new generation from the prompt entry point." No retry — the input is gone.
* `generation_already_in_progress`: API returns 409 with the existing `runId`. Sidebar switches to monitoring the existing run.
* `generation_timeout`: failure summary with "The model didn't respond in time. This is rare and usually a transient issue." Retry available.
* `generation_invalid_plan`: failure summary with "Arqitect produced output that didn't match the required structure. This is usually a model issue, not your input." Retry available. The invalid plan is logged for debugging.
* `materialization_failed`: failure summary with "The design was drafted but couldn't be applied. Your canvas is unchanged." Retry available. The plan is stored for inspection.
* `model_error`: failure summary with the model's error class. Retry available.
* Liveblocks room unreachable during apply: same handling as `materialization_failed`. The task waits up to 10 seconds for the room to be reachable before failing.

All failures preserve `PendingGeneration` so the user can retry. Cancellation also preserves it. Only successful completion deletes it.

### Rate Limiting and Cost

A project can have at most one in-flight generation at a time, enforced at the API layer and double-checked in the task. A workspace (single user, since teams are out of scope per the architecture) can run at most three generations per hour. These limits are conservative defaults and live in configuration, not code.

Generation cost is visible per `TaskRun` (model tokens consumed, recorded on the row) but not shown to the user in v1. The data exists for future cost-aware features.

### Scope Limits

* No iterative generation. The user cannot say "regenerate this part." They can delete the generation subgraph and run a new generation, or edit manually.
* No streaming partial canvas updates. The plan is generated, then applied atomically. Streaming nodes one-by-one looks impressive but creates a partially-applied window where collaborators see incomplete canvases.
* No model selection UI. The model is configured server-side.
* No prompt-engineering exposure to the user. The user does not see the system prompt.
* No generation history beyond `TaskRun` records. No diff between generations.
* No AI clarify or AI review modes. Spec 04 (clarify, via conversation) and spec 08 (review).
* No fine-tuning on user data or workspace-specific generation behavior.

### Architecture Alignment Check

| Architecture invariant                                                                            | This spec                                                                                                              |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1. Request handlers do not run AI work                                                            | The API endpoint queues a Trigger.dev task; all model calls happen in the task.                                        |
| 2. Metadata and large artifacts in separate layers                                                | `TaskRun`,`Assumption`,`OpenQuestion`in Postgres; canvas changes via Liveblocks; snapshot to Blob on completion. |
| 3. Auth and ownership at every mutation boundary                                                  | API endpoint validates project access; task double-checks before any write.                                            |
| 5. Canvas schema and v1 metadata contract consistent across user, template, AI                    | Generation plan validated against the same `NodeMetadataV1`/`EdgeMetadataV1`schemas spec 02 introduced.            |
| 6. Canvas snapshot is source of truth for visual structure and metadata                           | Snapshot taken after generation completes per cadence rules;`TaskRun.resultSnapshotId`records the snapshot id.       |
| 7. AI clarify and review do not mutate the canvas; design generation is the only AI mutation mode | Honored explicitly: this spec is design generation, and it is the only AI surface allowed to write nodes and edges.    |
| 9. Decisions, assumptions, open questions, etc. are durable Postgres entities                     | Generator assumptions and generated open questions are written to Postgres before the canvas is mutated.               |
| 11. Canvas snapshots are append-only                                                              | Generation completion writes a new snapshot; prior snapshots are retained.                                             |
| 14. Soft references handled gracefully                                                            | Linked node/edge IDs on assumptions and open questions are string arrays; subgraph removal preserves the entities.     |

### Persona Alignment Check

| Persona need                                            | This spec                                                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Fast first draft from natural language                  | Single-task generation from structured interview input or free-form prompt.                         |
| AI as co-architect, not magic drawing button            | Plan validation, low-confidence flagging, generator-stated assumptions, generated open questions.   |
| Open questions and assumptions preserved as output      | Both are durable Postgres entities tied to the run, visible in the sidebar and on the canvas.       |
| The user should understand the generator's reasoning    | `sourceReasoning`on every node and edge; plan summary visible after completion.                   |
| Make AI as a reviewable assistant, not a silent mutator | Generation is explicitly confirmed by the user; the user sees a preview of interview answers first. |
| Reach the success moment quickly                        | Single confirmation, durable task, visible progress, completion message that primes the next step.  |

### Definition of Done

* `GenerationPlan` schema is defined and exported from `lib/ai/generation/plan-schema.ts`.
* The Trigger.dev task `trigger/generate-design.ts` is implemented and conforms to the lifecycle described above.
* `TaskRun` model is added to Prisma with the schema above; `Assumption` and `OpenQuestion` gain `taskRunId`.
* `POST /api/projects/{projectId}/generations` queues the task with idempotency.
* `GET /api/projects/{projectId}/generations/{runId}` returns task state.
* `POST /api/projects/{projectId}/generations/{runId}/cancel` cancels in-flight runs.
* The AI sidebar shows all six lifecycle states with the copy specified above, listening to Liveblocks events with polling fallback.
* Generated subgraphs are positioned via layout, labeled, and visually distinguished from template subgraphs and user-created content.
* Low-confidence nodes and edges are visually marked on the canvas.
* Materialization writes Postgres first, then Liveblocks, with rollback on Liveblocks failure.
* Cancellation works and preserves `PendingGeneration` for retry.
* Multi-collaborator visibility: all room participants see generation progress in real time.
* Generation logs (input prompt, output plan, errors) are retained per `TaskRun` for 30 days.
* TypeScript and build pass.
* No regression in project creation, template import, canvas editing, or Liveblocks auth.
