
**12:36 PM**

****

## Claude responded: Spec 06 — Spec Generation with Versioning

## Spec 06 — Spec Generation with Versioning

This is the sixth of nine specs. Everything before this — the onboarding interview, the templates with assumptions, the AI design generation, the durable conversation, the editable metadata — was preparation for the artifact this spec produces. The persona's success moment, named in the product overview and reaffirmed in every spec since, is leaving Arqitect with a Markdown spec a developer or coding agent can build from. This is the spec where that moment becomes real.

### Strategic Intent

Three product promises converge here:

The product overview's core promise was: *Describe the system. Design it with your team and AI. Leave with a canvas and a spec ready for engineers or coding agents.* The first two clauses are now implemented. This spec is the third.

The persona document was specific that the differentiation against Miro, Lucidchart, Eraser, and Whimsical is the *quality* of the spec output, not the existence of one. A generic Markdown summary of a canvas is not differentiation — any tool with an LLM can produce that. The differentiation is what the persona document called "implementation-ready sections": components and responsibilities, data flow, API and event contracts, runtime assumptions, security boundaries, failure modes, observability, implementation phases, open questions, risks and tradeoffs, and a coding-agent handoff brief. Each of those sections has to be backed by real input from the canvas, the metadata, the conversation, the assumptions, and the open questions — not by an LLM filling in plausible-sounding architectural prose.

The architecture context was equally specific about reproducibility. Specs are versioned. Every version is linked to the canvas snapshot, conversation cursor, and decision log state at the moment of generation. A user looking at version 3 from two weeks ago should see exactly what version 3 saw at generation time, even if the canvas has been edited heavily since.

These three intents — implementation-readiness, structural quality, reproducibility — drive the whole design.

There is also a fourth intent that emerges from how the prior specs accumulated: this spec is where the previously isolated work pays off in a single artifact. The metadata schema from spec 02 becomes the components section. The conversation cursor from spec 04 becomes the reasoning trail. The generation subgraph from spec 03 contributes to the implementation phases. The assumptions and open questions from spec 02 and 04 become their own dedicated sections. If any of these dependencies were thin, the spec would be thin. Because they were built carefully, the spec can be substantive.

### What This Spec Delivers

A versioned spec generation system where:

* Spec generation is a confirmed user action, gated by blocker review items and non-intentional open questions, that produces an immutable Markdown artifact in Blob and a versioned record in Postgres.
* Each generation freezes a context: canvas snapshot id, conversation cursor, and decision log state at generation start. The Trigger.dev task reads from this frozen context, not from the live canvas.
* The generated spec follows a canonical section structure tied directly to canvas metadata and project entities, not to LLM improvisation.
* Sections backed by sparse or low-confidence input are explicitly marked as such — the architecture context's "shallowness is visible, not hidden" principle applied to the spec output.
* Versions are listed, compared, downloaded, and viewed in the editor's spec panel.
* Regenerating after canvas edits is a normal one-click action, supporting outcome criterion 16 from the product spec.
* The spec generation surface in the editor frames the act of generation as part of the design workflow, not as a separate "export" feature.

What this spec does *not* deliver:

* The coding-agent handoff brief. Spec 09. The two are explicitly separate artifacts per the product spec, with different readers (humans for the spec, agents for the handoff brief). Conflating them was rejected during product spec evaluation.
* Decisions and risks as first-class entities. Spec 07. The spec generation will reference both, but the schema for them is created in 07. This spec uses a forward-compatible structure that 07 fills in.
* Spec generation gating on AI-surfaced risks beyond what spec 04 already produces. Spec 08 adds the unified review system and the blocker severity primitive that gates this spec; until then, the gating uses open questions and the manual review-item primitive that comes with spec 04 and is extended in 08.
* External delivery: GitHub PR creation, Linear issue spawning, email-with-spec. Those are explicitly out of scope per the architecture context.

### User Story

> As an engineering lead who has spent the last hour with my team designing a new event pipeline — drafted by AI, refined by us, with the open questions we want flagged and the decisions we want recorded — when I click "Generate spec," I want a Markdown document I could paste into a GitHub PR description, a Notion design doc, or a coding-agent prompt. It should reflect what we actually built, not a generic LLM gloss on top of it. And when I make changes next week, I want to regenerate without losing the version we used to brief our team this week.

### The Generation Context

The architecture context required spec versions to capture canvas snapshot id, conversation cursor, and decision log state. This is the contract that makes regeneration meaningful and lets a user point at version 3 and know exactly what produced it.

typescript

```typescript
// lib/spec-generation/context.ts

exporttypeSpecGenerationContext={
  projectId:string;
  canvasSnapshotId:string;// The snapshot the spec is generated against
  conversationCursor:Date;// Messages with createdAt <= cursor are included
  decisionLogState:{
    assumptions:AssumptionSnapshot[];
    openQuestions:OpenQuestionSnapshot[];
// Spec 07 will add: decisions, risks
};
  reviewItemsState:ReviewItemSnapshot[];
  initiatedBy:string;// Clerk user ID
  initiatedAt:Date;
};

exporttypeAssumptionSnapshot={
  id:string;
  title:string;
  description:string;
  confidence:"high"|"medium"|"low";
  status:"active"|"validated"|"invalidated";
  source:"user"|"template"|"ai";
  linkedNodeIds:string[];
  linkedEdgeIds:string[];
};

exporttypeOpenQuestionSnapshot={
  id:string;
  title:string;
  description:string;
  status:"open"|"resolved"|"intentionally_open";
  source:"user"|"template"|"ai";
  linkedNodeIds:string[];
  linkedEdgeIds:string[];
  resolution?:string;
};

exporttypeReviewItemSnapshot={
  id:string;
  title:string;
  description:string;
  source:"human"|"ai";
  severity:"info"|"suggestion"|"blocker";
  status:"open"|"resolved"|"dismissed";
  targetType:string;
  targetId?:string;
};
```

The context is constructed by the API endpoint at the moment of generation confirmation, before the Trigger.dev task runs. It captures the world as the user sees it when they hit "Generate." Once captured, it is immutable — the task receives the context by reference, and any subsequent canvas or conversation edits do not affect this generation.

#### Why a frozen context

The simpler implementation would let the task read live data. That implementation is wrong here, for the same reason it was wrong for the design generation in spec 03: a multi-minute task reading live state produces non-reproducible output and creates race conditions between editing and generation. The frozen context is the architecture context's Invariant 12 made concrete.

A frozen context also makes the version diff feature (introduced later in this spec) possible. Comparing two versions requires comparing two stable inputs, not two snapshots of moving targets.

### The Spec Document Structure

The product spec specified the canonical sections. This spec maps each section to its input sources, making clear what is generated from real data and what relies on the LLM.

| Section                               | Primary input                                                                                                      | LLM role                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Overview                              | Project name, generation context summary, canvas node count, key components                                        | Synthesize one-paragraph overview                          |
| Goals and non-goals                   | `PendingGeneration.payload.systemGoal`(if present), recent user conversation messages tagged as goals            | Draft goals and infer non-goals from open questions        |
| User journeys and critical flows      | Interview's `criticalFlows`, conversation messages targeted at flows, edges in synchronous chains                | Describe each flow as a sequence                           |
| Architecture diagram summary          | Subgraph organization, component types, lifecycle status distribution                                              | Narrate the overall shape                                  |
| Components and responsibilities       | Every node, grouped by `componentType`, with `responsibility`,`owner`,`runtime`,`persistenceRole`        | Format and synthesize; no fabrication                      |
| Data flow                             | Every edge, grouped by source-destination pair, with `protocol`,`interactionMode`,`dataExchanged`            | Format and synthesize                                      |
| Data model and persistence            | Nodes with `componentType: datastore`and their `persistenceRole`, plus edges to them with `dataExchanged`    | Synthesize the data model from structured input            |
| API, event, and integration contracts | Edges with `protocol: http`,`protocol: grpc`,`protocol: message_bus`, with their metadata                    | Format contracts; LLM may suggest payload shapes           |
| Runtime and deployment assumptions    | Distinct `runtime`values across nodes,`externalDependency`flags                                                | Aggregate and explain                                      |
| Security and access boundaries        | Distinct `securityBoundary`values, edges with `securitySensitivity: regulated`or `sensitive`                 | Describe trust zones and sensitive flows                   |
| Failure modes and resilience          | Edges with `failureBehavior: retry`,`dead_letter`,`fail_open`,`fail_closed`, plus single-points-of-failure | Describe each failure mode and gap                         |
| Observability                         | (Sparse in v1; LLM acknowledges this and surfaces it as an open question if not addressed)                         | Explicit "not yet specified" framing where input is thin   |
| Implementation phases                 | Nodes grouped by `lifecycleStatus`— existing, new, planned — with dependencies                                 | Order the phases and call out blockers                     |
| Assumptions                           | All `Assumption`rows from the context, grouped by source, with confidence                                        | None — formatted as-is from data                          |
| Open questions                        | All `OpenQuestion`rows with status `open`or `intentionally_open`, grouped by source                          | None — formatted as-is                                    |
| Risks and tradeoffs                   | (Sparse in v1; spec 07 adds the risk entity)                                                                       | Synthesize from low-confidence metadata and open questions |
| Decisions and rationale               | (Empty in v1; spec 07 adds the decision entity)                                                                    | Placeholder section, populated in spec 07                  |

A few choices in this structure deserve attention.

**LLM role is bounded per section.** The LLM does not invent components, data stores, or flows. Where the section says "Format and synthesize; no fabrication," the section is generated directly from the canvas metadata, with the LLM responsible only for assembling readable prose around the structured data. Where the LLM does have synthesis room (overview, goals, risks), the section's input includes all the constraining metadata so the LLM cannot drift too far. This is the answer to the "generated specs too generic" risk from the persona document: structure constrains LLM output to the actual design.

**Observability and risks are sparse.** They are sparse in v1 because the canvas metadata schema does not yet model observability requirements, and the risk entity does not exist until spec 07. Rather than have the LLM fabricate plausible content for these sections, the prompt instructs it to explicitly note the sparseness and surface the gap as an open question that should be addressed before implementation. This is the "shallowness is visible, not hidden" principle.

**Decisions section exists but is empty in v1.** Including the section header now means spec 07's addition will fit cleanly into existing generation logic without restructuring. Empty sections render as "No decisions recorded yet" rather than being omitted, so the user sees what is missing.

**Sparse sections are marked.** Every section ends with a small marker — visible in the rendered spec — when its input was sparse: `[Sparse input — consider addressing the open questions below before relying on this section.]` This is friction by design. The persona is technical enough to want the friction.

### The Generation Task

The Trigger.dev task lives in `trigger/generate-spec.ts` and follows the lifecycle pattern from spec 03 with adaptations for the spec output.

#### Input

typescript

```typescript
exporttypeGenerateSpecInput={
  projectId:string;
  contextSnapshotId:string;// Postgres id of the SpecGenerationContext record
  initiatedBy:string;
  idempotencyKey:string;
};
```

The context is stored in Postgres at confirmation time, not passed inline. The task loads it by ID, so the context is durable and inspectable in case of failure.

#### Lifecycle

1. **Create TaskRun.** Row with `type: "spec_generation"`, `status: "running"`.
2. **Load context.** Fetch `SpecGenerationContext` record by ID. Fail with `context_not_found` if missing.
3. **Load canvas snapshot.** Fetch the Blob at the captured `canvasSnapshotId`. Parse and validate against the canvas schema. Fail with `snapshot_invalid` on parse failure.
4. **Load conversation.** Fetch all `ConversationMessage` rows for the project with `createdAt <= conversationCursor`, `status = "active"`. Filter to messages whose target still exists or whose target is the project itself (per the soft-reference handling from spec 04).
5. **Update status.** Set `TaskRun.status = "drafting"`.
6. **Build section inputs.** For each section, assemble its primary input from the canvas snapshot, the conversation, and the decision log state. This is pure data transformation — no LLM yet.
7. **Generate each section.** For each section, call the model with a section-specific prompt template, the structured input, and a section-specific Zod schema. Sections are generated in sequence, not parallel, because some sections reference earlier ones (the architecture diagram summary references components; the implementation phases reference dependencies between components).
8. **Validate each section.** Each section output is validated against its Zod schema. Section validation failures retry once with a corrective prompt; second failure marks the section as `[Section generation failed — placeholder content used.]` and continues. A single bad section does not fail the whole spec.
9. **Assemble the document.** Concatenate sections into a single Markdown document with the canonical structure, header metadata (project name, version, generated date, generation context summary), and footer with link references to the canvas snapshot id and conversation cursor for reproducibility.
10. **Write the document.** Save the Markdown to Blob at `specs/{projectId}/{specVersionId}.md`. The version id is a fresh ulid.
11. **Create SpecVersion row.** Postgres record linking the spec to the project, with the file path, generation context id, version number (auto-incremented per project), and metadata about what produced it.
12. **Trigger snapshot.** Per the architecture context's cadence rule, a snapshot was already taken at confirmation time. The completion does not require another.
13. **Complete.** Set `TaskRun.status = "completed"`, set `completedAt`, store summary and the new `SpecVersion.id`.
14. **Notify.** Emit a Liveblocks event so the editor sidebar updates and write a `generation_status` conversation message via spec 04: "Arqitect generated spec version {n}."

#### Per-section prompting

Each section gets its own prompt template. The prompt has three parts: a section-specific instruction, the structured input for that section, and the validation constraints. An illustrative example for the Components and Responsibilities section:

```
You are generating the "Components and Responsibilities" section of a system design spec.

INPUT: A list of components with their metadata. For each component, you have:
- label
- componentType (one of: service, datastore, queue, cache, client, external, job, gateway, other)
- responsibility (the team's stated responsibility, possibly empty)
- owner (possibly empty)
- runtime (possibly empty)
- persistenceRole (possibly empty)
- lifecycleStatus (one of: existing, new, deprecated, planned)
- confidence (one of: high, medium, low)
- notes (possibly empty)

INSTRUCTIONS:
- Group components by componentType. Order types: gateway, service, datastore, queue, cache, job, client, external, other.
- For each component, produce 2-4 sentences describing its role.
- If responsibility is non-empty, use it as the basis. If empty, synthesize from componentType and connections.
- If owner is set, mention it. If not, do not invent one.
- Components with lifecycleStatus = "deprecated" should be noted as such.
- Components with confidence = "low" should be followed by: "(Low confidence — this component's responsibility should be verified before implementation.)"
- Do not invent metadata not present in the input.

OUTPUT: Markdown with subsections per componentType. Output as JSON matching the SectionOutput schema.
```

The section-specific prompts live in `lib/spec-generation/prompts/` and are versioned alongside the spec-generation task code. Prompt changes are deliberate, code-reviewed events, not configuration tweaks.

#### Why section-by-section instead of whole-document generation

Three reasons.

**Section-by-section keeps each prompt small enough to constrain.** A whole-document prompt has to describe every section's input format, every section's output expectations, every section's edge cases. Even with a large context window, model output quality degrades when the prompt becomes a structured document of its own. Section-by-section means each prompt is short, focused, and validates against a section-specific schema.

**Partial failure is tolerable.** If the failure-modes section fails to generate, the user can still get a useful spec with the components section intact. Whole-document generation makes the spec all-or-nothing.

**Section schemas are stricter than document schemas.** Validating "the Components section is a list of {componentType, components[]}" is precise. Validating "the document is a valid spec" is vague. Section-level Zod schemas give us a real verification path.

The cost is more model calls per spec generation — roughly 10-12 calls per spec versus one. The latency increase is acceptable because generation is already a background task with visible progress.

### Gating

The architecture context's Invariant 13 required spec generation to be gated on unresolved blocker review items and non-intentional open questions. This spec implements that gate.

#### What gates generation

Two conditions:

* Any `ReviewItem` with `severity: "blocker"` and `status: "open"`. (Spec 04 introduced review items at a basic level; spec 08 introduces severity. Until spec 08 ships, this gate is a no-op; the structure exists to be activated.)
* Any `OpenQuestion` with `status: "open"` (not `intentionally_open` or `resolved`).

#### How gating works

The user triggers spec generation via the editor's "Generate spec" action. The API endpoint:

1. Validates project access.
2. Constructs the candidate context (canvas snapshot, conversation cursor, decision log state).
3. Checks the gate: are there open blockers or non-intentional open questions?
4. If yes, returns a `409 generation_requires_confirmation` response with the list of gating items and their counts.
5. If no, or if the user has confirmed proceeding with gating items present, proceeds: stores the context as a `SpecGenerationContext` row, queues the Trigger.dev task, returns the task run id.

#### The confirmation dialog

When the API returns the 409 response, the editor shows a dialog listing the gating items in two columns:

* Open blockers: the title and source of each.
* Non-intentional open questions: the title and source of each.

Three actions:

* **Resolve before generating.** Closes the dialog. The user is expected to address the items first. Each item has a "Go to item" link that scrolls the relevant entity into view.
* **Mark as intentionally open.** Bulk-marks all open questions as `intentionally_open` in a confirmation step. The items will be included in the spec with explicit "intentionally open" framing. Blockers cannot be bulk-marked this way — they require individual resolution.
* **Proceed anyway.** Generates the spec with the items unresolved. They appear in the spec under their respective sections (Open Questions, Risks) with explicit flags: `[Unresolved at generation time]`. The user takes ownership of generating with known gaps.

The "Proceed anyway" path is honest. The persona document was clear that intentionally surfacing known gaps is better than hiding them. The dialog copy reinforces this: the user is not blocked, they are informed.

### Schema Additions

prisma

```prisma
model SpecGenerationContext {
  id                String    @id @default(cuid())
  projectId         String
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  canvasSnapshotId  String
  conversationCursor DateTime
  decisionLogState  Json      // Snapshot of assumptions, open questions, etc.
  reviewItemsState  Json
  initiatedBy       String
  initiatedAt       DateTime  @default(now())
  // No updatedAt — contexts are immutable once created.
  consumedBy        String?   // SpecVersion.id once consumed; null if generation failed or was cancelled

  @@index([projectId, initiatedAt])
}

model SpecVersion {
  id                  String    @id @default(cuid())
  projectId           String
  project             Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versionNumber       Int       // Auto-incremented per project, starting at 1
  filePath            String    // Blob path: specs/{projectId}/{specVersionId}.md
  contextId           String    @unique  // Links back to SpecGenerationContext
  context             SpecGenerationContext @relation(fields: [contextId], references: [id])
  summary             String    // First section's content or LLM-generated summary
  status              String    @default("complete")  // "complete" | "partial" (some sections failed)
  partialSections     String[]  // Section names that failed during generation
  generatedAt         DateTime  @default(now())
  generatedBy         String    // Clerk user ID
  taskRunId           String    // TaskRun.id for the generation run

  @@unique([projectId, versionNumber])
  @@index([projectId, generatedAt])
}
```

`SpecVersion.versionNumber` is per-project starting at 1, not a ulid or global sequence. The persona refers to "version 3" of their spec, not "version ulid-xyz-123." User-facing numbering matters.

`SpecGenerationContext.consumedBy` makes the lifecycle traceable. A context that was created but never produced a spec (due to cancellation, failure, or the user closing the dialog) remains visible for debugging without being conflated with successful generations.

### API Surface

#### `POST /api/projects/{projectId}/spec-versions/check`

Pre-flight check before generation. Returns the gating items and proposed context summary. The editor calls this before showing the "Generate spec" confirmation, so the user sees what they are committing to before they commit.

Returns:

json

```json
{
"canProceed":false,
"gatingItems":{
"openBlockers":[...],
"openQuestions":[...]
},
"contextPreview":{
"componentCount":14,
"edgeCount":23,
"assumptionCount":6,
"openQuestionCount":8,
"conversationMessageCount":41
}
}
```

This endpoint does no writes. It is a read-only inspection of what generation would consume.

#### `POST /api/projects/{projectId}/spec-versions`

Triggers generation. Body: `{ proceedWithGaps: boolean, idempotencyKey: string }`. If `proceedWithGaps` is true and gating items exist, generation proceeds; if false and items exist, returns the 409 described above.

The handler:

1. Validates project access.
2. Constructs the context (canvas snapshot id, cursor, decision log state).
3. Checks gating; if gated and `proceedWithGaps` is false, returns 409.
4. Writes the `SpecGenerationContext` row.
5. Queues the Trigger.dev task with the context id.
6. Returns the task run id and the eventual spec version id (which is reserved at this point).

#### `GET /api/projects/{projectId}/spec-versions`

Lists spec versions for a project. Returns version number, summary, generated date, status, generated-by user id. Pagination by `versionNumber` descending. The editor's spec panel uses this.

#### `GET /api/projects/{projectId}/spec-versions/{versionId}`

Returns the full spec content and metadata. The Markdown is fetched from Blob and returned inline or via a redirect to a signed Blob URL. The endpoint also returns the version's context summary and a link to the underlying canvas snapshot.

#### `GET /api/projects/{projectId}/spec-versions/{versionId}/download`

Returns a signed Blob URL or streams the Markdown directly with `Content-Disposition: attachment; filename="{project-name}-spec-v{n}.md"`. This is what the user clicks to save the spec to disk.

#### `POST /api/projects/{projectId}/spec-versions/compare`

Compares two versions. Body: `{ leftVersionId, rightVersionId }`. Returns a structured diff: sections present in one but not the other, sections with different content, component counts, open question counts, conversation message counts. The diff is computed server-side because the Markdown can be large and diffing it client-side wastes bandwidth.

### The Editor Spec Panel

The spec panel is a new surface in the editor, opened from the toolbar via a "Spec" action. It is not a third sidebar — clicking the action transitions the right side of the editor from the inspector/conversation view to the spec panel. Clicking elsewhere on the canvas returns to inspector/conversation. The spec panel is destination, not background.

#### Layout

The panel has three regions stacked vertically:

**1. Header.** Project name, "Spec versions" label, and a primary `Generate new spec` button. The button shows the live state: when no generation is in progress, the standard label; when a generation is running, a progress indicator and "Generation in progress" label.

**2. Version list.** Versions listed newest-first. Each version is a card showing version number, generated date, summary first line, generation status (complete or partial), and a row of actions: View, Download, Compare. The current version (most recent complete) is visually highlighted.

**3. Active version preview.** When a version is selected, the rendered Markdown appears below the list with a scrollable view. The user can switch between rendered and raw Markdown via a toggle. A "Copy to clipboard" action copies the raw Markdown.

#### Generation flow from the panel

1. User clicks "Generate new spec."
2. The panel calls the check endpoint and shows the context preview ("This will generate from 14 components, 23 connections, 6 assumptions, 8 open questions, 41 conversation messages.") in a confirmation dialog.
3. If gating items exist, the dialog shows them and the three options (resolve, mark intentionally open, proceed anyway).
4. On confirm, generation queues. The panel transitions to the in-progress state.
5. The spec sidebar shows a section-by-section progress indicator (each section transitions from queued to running to complete) — the user sees that the generation is multi-step and structured, not a black box.
6. On completion, the new version appears at the top of the list and is auto-selected for preview.
7. On failure, the failure message appears in place of the new version, with a retry affordance and a link to inspect the partial result if any sections completed.

#### Spec comparison

Selecting two versions and clicking "Compare" opens a side-by-side view. The left and right panes show each version's rendered Markdown. Sections that differ are highlighted with a left-edge accent. A summary bar at the top shows what changed: "Components: 14 → 17 (+3), Open questions: 8 → 5 (−3), Conversation messages: 41 → 67 (+26)." Section-level diffs use a standard Markdown diff representation.

The comparison view is informational, not interactive. The user cannot edit either spec from this view, and they cannot merge them. v1 is read-only comparison.

### Connections to Earlier Specs

This spec relies heavily on the structure built earlier. Calling out the dependencies explicitly:

**From spec 01.** The `PendingGeneration.payload`, if it still exists, contributes to the Goals and Critical Flows sections. After spec 01's `PendingGeneration` is consumed by spec 03's design generation, the system goal field is preserved on the project for use here.

**From spec 02.** The canvas metadata schema is the structural backbone of every section. Templates' shipped assumptions and open questions become inputs to those sections. Subgraph labeling lets the implementation phases section identify which components came from a template versus user-created.

**From spec 03.** The generation subgraph from design generation is identifiable in the canvas. Components flagged with low confidence by spec 03 are flagged in the spec output. The TaskRun history shows that design generation occurred, contributing to the conversation history that spec generation reads.

**From spec 04.** The conversation cursor is the mechanism that bounds which messages contribute to the spec. The promoted assumptions and open questions (the conversation → entity flow) contribute to their dedicated sections. The generation summary messages tell the spec generation what AI tasks produced the current canvas.

**From spec 05.** The metadata edits the user made — verifying confidence, setting owners, adding notes — are what makes the spec output substantive rather than reflective of only the AI's original output. The view modes are not directly used by spec generation, but they share the same metadata layer.

If any of these dependencies were thin, spec 06's output would be correspondingly thin. The depth of the spec is the visible payoff of the prior work.

### Visual Language

* The spec panel uses the same dark theme tokens as the rest of the editor.
* Section headers in the rendered Markdown use the standard h2/h3 hierarchy. The renderer is a Markdown component already in the codebase; no custom rendering is built for this spec.
* Sparse-input markers are rendered as a small muted-foreground line at the end of the section, prefixed with an info icon.
* The version list uses card primitives with subtle borders. The currently-selected version has an accent left edge.
* The "Generate new spec" button uses the primary accent fill — it is the most important action in the panel.
* Section progress during generation uses a vertical list with status indicators (queued, running, complete, failed) per section. Failed sections are not red — they are muted with a small warning marker. This is review work, not a system failure.
* The comparison view uses two equal panes. The diff indicators are at the section level, not line-by-line — the user is comparing architectural decisions, not text edits.

### Copy

| Surface                                 | Copy                                                                                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec panel header                       | Spec versions                                                                                                                                                                                 |
| Generate new spec button                | Generate new spec                                                                                                                                                                             |
| Empty version list                      | No spec versions yet. Generate one when the design is ready for handoff.                                                                                                                      |
| Confirmation dialog title (no gating)   | Generate spec                                                                                                                                                                                 |
| Confirmation dialog body (no gating)    | This will generate from {n} components, {n} connections, {n} assumptions, {n} open questions, {n} conversation messages. The current canvas and conversation will be frozen for this version. |
| Confirmation dialog title (with gating) | Some items are still unresolved                                                                                                                                                               |
| Confirmation dialog body (with gating)  | The following items are open. You can resolve them, mark them as intentionally open, or generate the spec with them flagged as unresolved.                                                    |
| Resolve action                          | Resolve before generating                                                                                                                                                                     |
| Mark intentionally open action          | Mark all as intentionally open                                                                                                                                                                |
| Proceed action                          | Generate with open items                                                                                                                                                                      |
| Generation in progress                  | Generating spec version {n}                                                                                                                                                                   |
| Section progress: queued                | Queued                                                                                                                                                                                        |
| Section progress: running               | Generating                                                                                                                                                                                    |
| Section progress: complete              | Complete                                                                                                                                                                                      |
| Section progress: failed                | Skipped — used placeholder                                                                                                                                                                   |
| Generation complete                     | Spec version {n} ready                                                                                                                                                                        |
| Generation failed                       | Generation didn't complete. The partial output is available below.                                                                                                                            |
| Sparse section marker                   | Sparse input — consider addressing the open questions below before relying on this section.                                                                                                  |
| Partial generation marker (top of spec) | Some sections didn't generate cleanly: {section names}. The rest of the spec is usable.                                                                                                       |
| Section: Components header              | Components and responsibilities                                                                                                                                                               |
| Section: Data flow header               | Data flow                                                                                                                                                                                     |
| Section: Open questions empty state     | No open questions at the time of generation.                                                                                                                                                  |
| Section: Decisions empty state (v1)     | Decisions and rationale will be added when the decision tracking feature ships.                                                                                                               |
| Version card: complete badge            | Complete                                                                                                                                                                                      |
| Version card: partial badge             | Partial                                                                                                                                                                                       |
| Download spec action                    | Download                                                                                                                                                                                      |
| Copy to clipboard action                | Copy as Markdown                                                                                                                                                                              |
| Compare action                          | Compare with…                                                                                                                                                                                |
| Compare summary format                  | Components: {n} → {n}, Connections: {n} → {n}, Open questions: {n} → {n}, Messages: {n} → {n}                                                                                             |
| Compare empty diff                      | These versions are structurally identical.                                                                                                                                                    |
| Conversation message on completion      | Spec version {n} generated.                                                                                                                                                                   |

The "Mark all as intentionally open" copy is deliberate. It does not soften the action. The persona document was specific that intentional gaps are acceptable; the copy reflects this without apologizing for it.

The "Decisions and rationale will be added when the decision tracking feature ships" copy is an explicit forward reference to spec 07. The product owner will appreciate the transparency; the user knows what is coming and why this section is empty.

### Error Handling

* `context_not_found`: the generation was queued but the context disappeared (extremely rare; would indicate a database integrity issue). The user sees a generic generation failure with a request to retry.
* `snapshot_invalid`: the canvas snapshot at the captured ID could not be parsed. The version is marked failed; the user retries, which captures a fresh snapshot.
* Section validation failures: as described, single-section failures are tolerated. The version is marked `status: "partial"`; the user sees the partial badge and can choose to use the spec as-is or regenerate.
* All-sections failure: the version is marked failed and the partial output (if any) is preserved. The user gets a retry affordance.
* Generation timeout: 5 minutes per spec generation. Beyond that, the task fails and is retryable.
* Concurrent generation requests for the same project: the second request returns 409 with the existing task run id, same pattern as spec 03.
* Project access lost mid-generation (collaborator removed): the task completes and the spec is generated, but the user without access cannot view it. The persisted version is associated with the project, not the user.
* Spec version row created but Blob write fails: the row is marked failed. The Blob path is reserved but unused. The user retries, which creates a new version row with a new path.
* Blob fetch failure during view: the panel shows a "Spec content unavailable" message with a retry. The Postgres row remains valid; only the rendered view is affected.

### Scope Limits

* No spec editing. The Markdown is generated; the user can copy it elsewhere to edit. Editing within Arqitect would create drift between the canvas and the spec, which the persona document explicitly identifies as the workflow problem the product is supposed to fix.
* No spec deletion. Versions accumulate. v2 may add archival.
* No automatic regeneration on canvas changes. The user explicitly triggers generation. Automatic regeneration would either be too noisy or out-of-date; manual is honest.
* No spec template selection. The canonical section structure is fixed in v1. Different project types (event-driven backend vs. data pipeline) may benefit from different structures; v2 can explore that.
* No multi-language spec generation. Markdown in English.
* No external delivery surfaces (GitHub, Linear, email). Out of scope per architecture context.
* No spec-level commenting or review. The spec is an artifact, not a collaborative surface; commenting belongs in the canvas via conversation (spec 04).
* No spec signing, approval workflow, or change requests. Out of scope per architecture context.
* No spec analytics (which sections users read most, etc.). Out of scope until the product has scale.

### Architecture Alignment Check

| Architecture invariant                                                                  | This spec                                                                                             |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. Request handlers do not run AI work                                                  | Generation runs as a Trigger.dev task; API endpoints handle context capture and queueing only.        |
| 2. Metadata and large artifacts in separate layers                                      | `SpecVersion`and `SpecGenerationContext`in Postgres; Markdown content in Blob.                    |
| 3. Auth and ownership at every mutation boundary                                        | All endpoints validate project access before any read or write.                                       |
| 6. Canvas snapshot is source of truth for visual structure and metadata                 | Generation reads from the captured snapshot, not from live Liveblocks state.                          |
| 8. Generated Markdown artifacts are immutable once written                              | Specs are written once and never overwritten. Regeneration creates a new version.                     |
| 9. Conversation, decisions, etc. are durable Postgres entities                          | Conversation cursor and decision log state are captured from Postgres at generation start.            |
| 10. Spec records reference canvas snapshot, decision log state, conversation cursor     | `SpecGenerationContext`is the explicit implementation of this requirement.                          |
| 11. Canvas snapshots are append-only                                                    | Snapshots taken at generation are append-only; historical snapshots remain reproducible.              |
| 12. Spec generation reads from captured snapshot, not live room                         | The Trigger.dev task loads the Blob at the captured `canvasSnapshotId`.                             |
| 13. Spec generation is gated on blocker review items and non-intentional open questions | The check endpoint and confirmation dialog implement the gate; the architecture invariant is honored. |

### Persona Alignment Check

| Persona need                                                   | This spec                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Handoff-ready Markdown spec                                    | The artifact is Markdown, downloadable, with implementation-ready sections.                             |
| Spec generation from the actual canvas and conversation        | Both are inputs to the generation, with the cursor mechanism ensuring conversation is included.         |
| Implementation-ready sections                                  | The canonical section structure maps directly to persona-named needs.                                   |
| Open questions and assumptions preserved as first-class output | Dedicated sections, populated from Postgres entities, not LLM invention.                                |
| Decisions preserved                                            | Section reserved; spec 07 populates it.                                                                 |
| Versioned spec history                                         | `SpecVersion`records, version comparison, no deletion.                                                |
| User regenerates after canvas edits                            | One-click regeneration; the workflow is normal, not exceptional.                                        |
| Specs are stronger than generic summaries                      | Section-by-section generation, structured input per section, explicit sparseness markers.               |
| Make AI shallowness visible                                    | Sparse section markers, partial generation badges, low-confidence flags inherited from canvas metadata. |

### Definition of Done

* `SpecGenerationContext` and `SpecVersion` Prisma models exist, are migrated, and indexed.
* The pre-flight check endpoint returns gating items and context preview.
* The generation endpoint creates a context, queues the Trigger.dev task, and returns the run and version IDs.
* The `generate-spec` Trigger.dev task implements the full lifecycle: load context, load snapshot, build section inputs, generate sections one by one with validation, assemble the document, write to Blob, create the SpecVersion row, emit Liveblocks events, post a conversation message.
* Each of the 16 sections has a section-specific prompt and Zod schema.
* Partial generation handling: single-section failures produce a `status: "partial"` version with the failed sections listed.
* The gating confirmation dialog implements the three options: resolve, mark intentionally open, proceed anyway.
* The "Mark all as intentionally open" action bulk-updates open questions.
* The spec panel renders in the editor, with version list, active preview, and rendered Markdown.
* The view-Markdown toggle and copy-to-clipboard actions work.
* The download endpoint streams Markdown with the correct filename.
* The comparison endpoint computes diffs and the side-by-side comparison view renders them.
* Section progress during generation is visible in the spec panel.
* Liveblocks events update the spec panel across all collaborators when a generation completes.
* Conversation messages are posted on generation completion via spec 04.
* Sparse section markers are present in generated output where applicable.
* The "Decisions and rationale" section renders the v1 placeholder copy.
* Generation cost per `TaskRun` (token usage) is recorded for future analytics.
* TypeScript and build pass.
* No regression in any prior spec's functionality.
