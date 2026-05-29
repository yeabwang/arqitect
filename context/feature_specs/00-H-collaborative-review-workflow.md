
## Spec 08 — Unified Review Workflow with AI and Human Items

This is the eighth of nine specs. The review item primitive has been quietly present since spec 04, where it was defined in the architecture context but not implemented as a full surface. Spec 06's spec generation gates partially on review items. Spec 07's risks share severity vocabulary with review items. The product spec called the unified review primitive — one shape for human comments and AI-surfaced findings, distinguishable only by source — one of Arqitect's structural differentiators. This spec makes that primitive real.

### Strategic Intent

The persona document was explicit about three things this spec must address simultaneously:

**AI as a co-architect, not a magic drawing button.** The persona doc was clear that the AI must "ask clarifying questions instead of only drawing boxes" and must "detect single points of failure, flag missing data stores, queues, auth boundaries, observability, and ownership." Spec 03 (design generation), spec 04 (clarify mode), and earlier work covered drafting and questioning. AI *review* — the systematic critique of an existing design — has not been built. This spec builds it.

**A single review primitive, not two parallel systems.** The product spec evaluation flagged this as a specific risk: if AI-surfaced risks and human comments are different primitives, the UI gets confused; if they share a primitive without the source field carrying meaningful weight, users cannot distinguish AI noise from team consensus. The unified review item solves this by sharing structure while preserving source.

**Spec generation gating that closes the loop.** Spec 06 gated on review items with `severity: blocker` and `status: open`, but the severity field on review items did not yet exist in full form. Spec 07 extended gating to blocker risks. This spec completes the gating system. After this spec, blocker review items (human-raised, AI-raised) and blocker risks and non-intentional open questions all gate spec generation through the same confirmation flow.

There is a fourth strategic intent that emerges from how this spec sits relative to the rest of the product. The competitive read from the persona document was that Miro, Lucidchart, Eraser, and others increasingly offer AI diagramming. Arqitect's defense is the depth of the architecture-to-implementation loop. AI review is a major component of that depth: a tool that critiques the design at the same level a senior architect would — surfacing observability gaps, ownership ambiguity, missing failure modes, undefined data flows — is the kind of work that distinguishes Arqitect from "an AI that draws boxes."

The AI review must be honest about its limitations. Shallow review ("you should add monitoring") is no better than no review. The persona document called this out as risk #2 ("AI output looks plausible but shallow"). The AI review must be specific, anchored to canvas elements, and ground itself in the v1 metadata that spec 05 made editable. A review finding that reads "Service X has `confidence: low` on `failureBehavior` for its connection to Y; consider verifying how failures cascade" is specific and actionable. "You should add error handling" is not.

### What This Spec Delivers

A complete review system where:

* The review item primitive has its full schema: source (human, ai), severity (info, suggestion, blocker), status (open, resolved, dismissed), target, resolver, resolution reason, and discussion via conversation threading.
* AI review mode is a discrete user-initiated Trigger.dev task that analyzes the current design and produces review items as findings — anchored to specific canvas elements, grounded in canvas metadata, with explicit reasoning per finding.
* Human review items can be raised on the canvas, on canvas elements, on decisions, on assumptions, on risks, on open questions, and on other review items (replies via discussion).
* A review surface in the editor lists all review items with filtering by source, severity, status, and target. The surface is distinct from the architecture entities panel (spec 07) because review items are about the design, not part of it.
* Review items can be promoted into other entity types (decisions, risks, open questions) when a finding becomes a captured outcome.
* Spec generation gating becomes complete: blocker review items, blocker risks, and non-intentional open questions all gate generation through a unified confirmation flow.
* The conversation surface displays review item creation, status changes, and resolutions as system events, weaving the review activity into the project's reasoning trail.

What this spec does *not* deliver:

* Auto-running AI review on canvas changes. Review is a deliberate user action.
* AI review with no scope — reviewing entire workspaces or many projects.
* Review SLAs, deadlines, or assignment workflows. Review items have an optional assignee but no time-bound enforcement.
* Cross-project review aggregation or organization-level review dashboards. Out of scope per the architecture context.
* Custom severity levels or custom review rules. The severity vocabulary is fixed at info/suggestion/blocker.
* AI-generated decisions or risks. AI surfaces findings only as review items; promotion to decision or risk is a human action. (Spec 07 reinforced this.)

### User Story

> As a staff engineer reviewing an architecture my team just drafted, when I ask Arqitect to review the design, I want it to call out specific gaps — the missing dead-letter behavior on this queue, the auth boundary that crosses three services without being marked, the data store with no clear owner — not generic "consider adding monitoring" advice. I want each finding linked to the element it concerns, with the AI's reasoning visible, and I want to resolve, dismiss, or promote each finding into a tracked outcome. And I want the blockers among these findings to actually stop me from generating a spec until they're handled, the same way they would in code review.

### The Review Item Schema

The review item has been growing across specs. Spec 04 introduced a basic shape in the conversation context. Spec 06 referenced severity for gating without the field being fully implemented. Spec 07 reused the severity vocabulary on risks. This spec defines the complete schema as the primitive's first full form.

prisma

```prisma
model ReviewItem {
  id                String    @id @default(cuid())
  projectId         String
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  title             String
  description       String

  source            String    // "human" | "ai"
  severity          String    // "info" | "suggestion" | "blocker"
  status            String    @default("open")  // "open" | "resolved" | "dismissed"

  // What this review item is about. Soft references where the target is a canvas element.
  targetType        String    // "project" | "node" | "edge" | "decision" | "assumption" | "risk" | "open_question"
  targetId          String?   // canvas node/edge id, or Postgres id of the target entity

  // For AI-generated items
  authorTaskRunId   String?   // TaskRun.id when source = "ai"; ties items back to the review run that produced them
  aiReasoning       String?   // Why the AI raised this finding; surfaced on the item

  // For human-generated items
  authorUserId      String?   // Clerk user ID when source = "human"

  // Resolution metadata
  resolvedBy        String?   // Clerk user ID
  resolvedAt        DateTime?
  resolutionReason  String?   // Required when transitioning to resolved or dismissed
  resolutionType    String?   // "addressed" | "wont_address" | "no_longer_relevant" | "false_positive"
  // Promotion tracking (when a review item becomes another entity)
  promotedToDecisionId    String?
  promotedToRiskId        String?
  promotedToOpenQuestionId String?

  // Optional assignment (no enforcement; informational)
  assigneeUserId    String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([projectId, status, severity])
  @@index([projectId, source])
  @@index([projectId, targetType, targetId])
}
```

A few field choices deserve specific justification.

**`source` is a fundamental field, not a tag.** Every code path that filters, displays, or aggregates review items branches on source somewhere. AI-source items show reasoning, route to retry actions on the AI task, and contribute to AI quality metrics. Human-source items show author and route to human resolution flows. Making source a first-class field rather than a tag means the type system catches branching omissions.

**`severity` is fixed at three values.** The architecture context committed to info, suggestion, blocker. This spec does not extend the vocabulary. The temptation to add "critical" above blocker or "minor" below info should be resisted — three levels are enough to drive product behavior (info = visible only, suggestion = visible and counted, blocker = visible, counted, and gates spec generation), and more levels create cognitive overhead without commensurate value.

**`resolutionType` is structured, separate from `resolutionReason`.** When a review item is resolved or dismissed, two things matter: what kind of resolution this was (`addressed` means the team did something about it; `wont_address` means a deliberate choice not to act; `no_longer_relevant` means the design changed and made the item moot; `false_positive` means the AI was wrong) and the free-text explanation. The structured field powers aggregate views ("how many AI findings have been marked false positive in this project?"), which becomes useful for understanding AI review quality. The free-text field preserves human reasoning.

**`promotedTo*` fields track conversion to other entities.** A common workflow: AI raises a finding about an undefined failure behavior. The team discusses it. They agree it's a real risk. The team promotes the review item into a risk entity (using spec 07's risk model). The review item is then marked resolved with `resolutionType: addressed`, and the `promotedToRiskId` records the resulting risk. The promotion is part of the review item's history; the risk is what gets tracked going forward.

**Discussion via conversation, not threaded review items.** Review items do not have their own reply threading. When a review item is discussed, the discussion happens in the conversation surface (spec 04), targeted at the review item. The conversation message's `targetType` is `review_item`. This avoids two parallel commenting systems and keeps all project discussion in one durable place.

### AI Review as a Discrete Action

The persona document was explicit that AI review must be invokable by the user, not run automatically. Three reasons drive this choice:

**Cost transparency.** AI review is non-trivial compute (a model call analyzing the entire design plus context). Auto-running on every canvas change would be expensive and produce noise; user-initiated review is intentional and meaningful.

**Action context.** A user invoking review is doing so at a specific point in their workflow — typically before a spec generation, after a major design change, or as part of a team review. The user choosing the moment is part of the workflow.

**Trust.** The persona document was clear that AI should not silently mutate the canvas, but AI auto-generating review items is similar: a sea of AI findings appearing without invocation feels invasive and reduces trust in the findings that do appear. User invocation makes each review run a deliberate moment.

#### The review task

`trigger/review-design.ts` follows the lifecycle pattern from spec 03's generation task and spec 04's clarify task, with adaptations for review-specific output.

typescript

```typescript
exporttypeReviewDesignInput={
  projectId:string;
  initiatedBy:string;
  idempotencyKey:string;
  scope?:ReviewScope;// Optional: review the whole design or a specific element
};

exporttypeReviewScope=
|{ type:"project"}// Default: review everything
|{ type:"node"; id:string}// Review one component and its connections
|{ type:"edge"; id:string}// Review one connection
|{ type:"subgraph"; subgraphId:string}// Review a generation subgraph or template subgraph
|{ type:"section"; section:"security"|"resilience"|"observability"|"data_flow"|"ownership"};
// Scoped review by architectural concern. Each maps to a different prompt template.
```

#### Lifecycle

1. **Create TaskRun.** Row with `type: "design_review"`, `status: "running"`. The pattern from spec 03.
2. **Validate scope.** Resolve canvas element references; fail if the target is missing.
3. **Load context.** Canvas snapshot, metadata, conversation messages (cursor-bounded), existing review items (so the AI doesn't duplicate findings), existing assumptions, open questions, decisions, risks.
4. **Update status.** `TaskRun.status = "drafting"`.
5. **Call the model.** The prompt is review-specific (see "Review prompts and quality constraints" below). Structured output: a list of review findings, each with severity, target, title, description, reasoning, and an optional `relatedExistingItemId` if the finding extends an existing item rather than creating a new one.
6. **Validate findings.** Each finding is validated against a Zod schema. Findings targeting nonexistent elements are dropped. Findings duplicating existing open review items (by content similarity) are merged into the existing item's discussion as a new conversation message instead of being created as new items.
7. **Apply findings.** For each surviving finding, write a `ReviewItem` row with `source: "ai"`, `authorTaskRunId` set, and `aiReasoning` populated. Write a corresponding conversation message of type `ai_finding` (the message type spec 04 reserved for this purpose), targeting the review item itself, so the review action appears in the project's reasoning trail.
8. **Snapshot.** Per architecture cadence rules, a snapshot is taken at the start of review (so the review's input is reproducible).
9. **Complete.** `TaskRun.status = "completed"`. Summary string includes the number of findings by severity ("Found 3 blockers, 7 suggestions, 2 info notes"). The Liveblocks event notifies all collaborators.

#### Failure paths

The same patterns as spec 03 and spec 04: `model_error`, `review_timeout`, `invalid_findings`, `materialization_failed`. Each posts a system message to the conversation. A failed review task does not produce review items.

#### Multi-collaborator visibility

When a collaborator triggers review, the editor's review surface shows the review is running. The presence indicator (from spec 04) shows who initiated. As findings are written, they appear in the review surface in real time via Liveblocks events.

### Review Prompts and Quality Constraints

This is the most important part of the spec for AI quality. The review must be specific, anchored, and grounded. The prompts enforce this.

#### The system prompt principles

The review system prompt (in `lib/ai/review/prompts.ts`) carries these directives:

* Every finding must target a specific node, edge, decision, or risk. Findings without a target are rejected.
* Every finding must reference the metadata that produced the concern. "This node has `failureBehavior: undefined` on its outgoing edges" is acceptable; "this looks fragile" is not.
* Use the existing severity vocabulary. Blocker is reserved for findings the team genuinely should not proceed past without addressing — single points of failure on critical paths, undefined behaviors on regulated data flows, missing ownership on production services. Suggestion is for improvements that would strengthen the design but are not blockers. Info is for observations the team should be aware of without action required.
* Do not duplicate findings from prior review runs in the same project. The existing review items are provided as context; refer to them or extend their discussion via the `relatedExistingItemId` field rather than creating new ones.
* Do not invent metadata. If a node's `runtime` is unset, the finding is "Runtime is unset on this node; without it, deployment assumptions cannot be reasoned about," not "This service likely runs on Node.js and Fargate."
* Do not soften findings to be agreeable. A blocker finding should read as a blocker. The persona document called out that shallow AI output is risk #2; review output that hedges every finding fails this risk.
* Cap total findings at 25 per run. Beyond that, the AI is fabricating detail or repeating itself.

#### Section-scoped prompts

When the review scope is `section`, a specialized prompt focuses on that concern. The five concern-specific prompts (`security`, `resilience`, `observability`, `data_flow`, `ownership`) each have tailored input formatting and instruction.

**Security review.** Inputs: nodes with `securityBoundary` values, edges with `securitySensitivity`, external dependency markers. The prompt asks the model to identify trust zone boundaries, sensitive data flows that cross boundaries, edges with `securitySensitivity: regulated` that lack clear failure behavior, services exposed to external clients without auth boundary marking.

**Resilience review.** Inputs: edges with `failureBehavior` set or unset, nodes marked as system of record, single-points-of-failure analysis (nodes that, if removed, disconnect the canvas). The prompt asks for findings on undefined failure behavior on critical edges, missing dead-letter handling on async edges, fail-open behaviors that could mask outages.

**Observability review.** Inputs: the canvas. The prompt is explicit that observability metadata is sparse in v1 (no observability field on nodes), so this review focuses on identifying flows that *should* have observability and flagging the absence as a gap to be addressed. This is one of the few cases where the review is supposed to be "uniformly missing"; the finding is the structural one ("this critical flow has no observability tracking and the design doesn't yet model it").

**Data flow review.** Inputs: every edge with its `protocol`, `interactionMode`, `dataExchanged`. The prompt asks for findings on undefined data exchanged, sync edges that should likely be async, async edges that should likely be sync, batch flows without idempotency considerations.

**Ownership review.** Inputs: every node with its `owner` value, plus the structure of subgraphs. The prompt asks for findings on missing owners, services with multiple owners (a sign of unclear responsibility), critical services owned by a team that doesn't own related services.

#### The output schema

typescript

```typescript
// lib/ai/review/finding-schema.ts

exportconstReviewFinding= z.object({
  title: z.string().max(120),
  description: z.string().max(1000),
  severity: z.enum(["info","suggestion","blocker"]),
  targetType: z.enum(["node","edge","decision","assumption","risk","open_question","project"]),
  targetId: z.string().optional(),// required for all except project
  reasoning: z.string().max(500),
  relatedExistingItemId: z.string().optional(),// if this extends an existing review item
});

exportconstReviewPlan= z.object({
  summary: z.string().max(500),
  findings: z.array(ReviewFinding).max(25),
});
```

#### Quality measurement

This spec introduces a small but important quality feedback loop. When a user resolves an AI-source review item, they pick a `resolutionType` (addressed, wont_address, no_longer_relevant, false_positive). The `false_positive` choice is the quality signal: it means the AI raised a finding that wasn't actually a problem. Aggregating false-positive rates per project and across projects gives the team a data-driven sense of review quality. The aggregate is not surfaced to users in v1, but the data is collected per `TaskRun`.

### The Review Surface

A new section in the editor's left navigation, sibling to the canvas, the conversation, the spec panel (from spec 06), and the architecture entities panel (from spec 07).

#### Layout

Three regions, similar in structure to the entities panel but with review-specific affordances:

**1. Header and filters.** Header with project name. Below it: filters by source (Human, AI), severity (Info, Suggestion, Blocker), status (Open, Resolved, Dismissed), target type, and an "Open blockers" quick filter that surfaces the most actionable items first. A prominent "Ask Arqitect to review" button is also in the header, with a scope dropdown (`Whole design`, `Selected element`, `Security review`, `Resilience review`, `Observability review`, `Data flow review`, `Ownership review`).

**2. Review item list.** Items ordered by severity descending, then `updatedAt` descending. Each item is a card showing severity badge, source badge (Human/AI), status badge, title, target chip (e.g., "[Service: PaymentProcessor]"), and a snippet of the description. AI items show a small "View reasoning" expander.

**3. Item detail.** The selected review item is shown in full. Detail includes the full description, the AI reasoning (if applicable), the target with a jump-to-element link, the discussion thread (rendered from the conversation surface, filtered to messages targeting this review item), action buttons (Resolve, Dismiss, Promote, Assign), and the resolution metadata (resolver, resolution reason, resolution type) if the item is resolved or dismissed.

#### Action flows

**Resolve.** Opens a dialog asking for `resolutionType` (the four-value enum) and `resolutionReason` text. The resolver and timestamp are recorded. A system message is posted to the conversation: "{resolver} resolved review item: {title}."

**Dismiss.** Functionally similar to resolve but used for items the team is consciously choosing not to act on. The same dialog asks for a `resolutionType` (typically `wont_address` or `false_positive`) and reason. The status becomes `dismissed`. A system message posts.

**Promote.** Opens a sub-menu: Promote to decision, Promote to risk, Promote to open question. Each promotion uses the spec 07 promotion flow, with the review item's content pre-filling the new entity's fields. After promotion, the review item is automatically marked resolved with `resolutionType: addressed` and the `promotedTo*` field set. The conversation gets a system message: "Review item promoted to {entity type}: {entity title}."

**Assign.** Opens a typeahead of project collaborators. Setting an assignee posts a system message: "{assigner} assigned this review item to {assignee}." Assignment is informational only — no enforcement, no notifications in v1.

**Discuss.** Opens the conversation surface targeted at this review item. The composer is pre-targeted; the user adds their message and it appears in the item's discussion thread.

#### Surfacing on the canvas

A canvas indicator approach analogous to spec 07's reasoning badges: nodes and edges with open review items show a small indicator in the upper-right (a number badge if multiple items target the element). The indicator's color reflects the highest severity among open items targeting the element — a small accent dot for info, a slightly more prominent badge for suggestion, an emphasized badge for blocker (still subtle, not alarming).

Hovering the badge shows a tooltip with the count by severity. Clicking opens the review surface filtered to that element.

The indicators respect spec 05's view modes: visible in engineering and implementation views, suppressed in executive view (where surface-level review noise is unwanted).

### Connection to Prior Specs

This spec reaches into several prior specs to complete their commitments.

**Spec 04 conversation.** The `ai_finding` message type that spec 04 reserved for review findings becomes live. Each AI review item creates a conversation message of type `ai_finding`, targeting the review item, so the review activity is part of the project's conversation history. Resolution events also post conversation messages.

**Spec 05 canvas metadata.** AI review's quality depends entirely on the metadata being populated. The review prompts read metadata exhaustively. The "verify confidence" action from spec 05 (which marks a low-confidence metadata field as user-verified) is a direct partner to AI review: AI flags low-confidence fields, the user verifies or corrects them, the next review run produces stronger findings.

**Spec 06 spec generation gating.** The gating system that spec 06 partially implemented becomes complete. The `/spec-versions/check` endpoint now returns:

typescript

```typescript
{
  canProceed:boolean,
  gatingItems:{
    openBlockerReviewItems:ReviewItemSummary[],// new in this spec, full implementation
    openBlockerRisks:RiskSummary[],// from spec 07
    nonIntentionalOpenQuestions:OpenQuestionSummary[]// from spec 04
},
  contextPreview:{...}
}
```

The confirmation dialog from spec 06 gains a section for "Open blocker review items." The three resolution options (resolve before generating, mark intentionally open, proceed anyway) apply consistently. For review items, "mark intentionally open" is not appropriate — the user resolves with `resolutionType: wont_address` or `no_longer_relevant`. The dialog adapts the available actions to the entity type.

**Spec 07 promotion flow.** The spec 07 promotion endpoint (extended to support decisions and risks) is reused by the review item promote action. Review items become a fourth source of promotion, alongside user-initiated creation, template-supplied entities, and AI generation outputs.

### API Surface

#### `POST /api/projects/{projectId}/review`

Queues an AI review task. Body: `{ scope: ReviewScope }`. Returns the `TaskRun` id. Same patterns as spec 03 and spec 04 task triggers: ownership check, idempotency, one-in-flight-review-per-project limit.

#### `GET /api/projects/{projectId}/review-items`

Lists review items. Query parameters for filtering: `source`, `severity`, `status`, `targetType`, `targetId`. Pagination by `updatedAt` cursor.

#### `POST /api/projects/{projectId}/review-items`

Creates a human review item. Body: `{ title, description, severity, targetType, targetId, assigneeUserId? }`. The handler validates project access and target validity (soft-reference handling: a `targetType: node` with a deleted `targetId` is rejected at creation, but an already-existing item whose target gets deleted survives).

#### `PATCH /api/projects/{projectId}/review-items/{itemId}`

Edits a review item. Human-source items can be edited by their author. AI-source items can have their `severity` changed by any collaborator (the AI might have over- or under-rated a finding) but not their `title`, `description`, or `aiReasoning` — those are preserved as the AI's original assessment. Editing an AI item's severity posts a system message: "{user} changed review item severity from {old} to {new}."

#### `POST /api/projects/{projectId}/review-items/{itemId}/resolve`

Resolves a review item. Body: `{ resolutionType, resolutionReason }`. Validates that `resolutionType` is one of the four values. Updates `status`, `resolvedAt`, `resolvedBy`, `resolutionReason`, `resolutionType`. Posts a system message to the conversation.

#### `POST /api/projects/{projectId}/review-items/{itemId}/dismiss`

Dismisses a review item. Functionally similar to resolve but produces `status: dismissed`. Same body shape.

#### `POST /api/projects/{projectId}/review-items/{itemId}/promote`

Promotes a review item to a decision, risk, or open question. Body: `{ entityType: "decision" | "risk" | "open_question", entityFields: { ... } }`. The handler creates the new entity (using the existing entity creation logic from spec 07), marks the review item resolved with `resolutionType: addressed` and `promotedTo*` set, and posts the appropriate system message.

#### `POST /api/projects/{projectId}/review-items/{itemId}/assign`

Assigns an item to a collaborator. Body: `{ assigneeUserId }`. Posts a system message.

### UI Language

* Severity badges use a consistent color system: info uses a muted accent, suggestion uses a slightly more visible accent, blocker uses an emphasized accent (warm-toned but not alarming red). Color comes from existing tokens; nothing new in `globals.css`.
* Source badges are simple labels: "AI" with a sparkle icon, "Human" with a user icon.
* Status badges: open is outlined; resolved is filled with a check; dismissed is filled with an x.
* The review surface uses the same dark theme tokens as the rest of the editor.
* Lucide icons: `ShieldAlert` for blockers (in headers and lists, not on the badges themselves), `Lightbulb` for suggestions, `Info` for info items, `CheckCheck` for resolved, `XCircle` for dismissed.
* The "Ask Arqitect to review" button uses the primary accent fill — it's the most important action in the panel.
* Scope dropdown items show a small icon per scope: `Globe` for whole design, `Box` for selected element, `Shield` for security, `Activity` for resilience, `Eye` for observability, `GitBranch` for data flow, `Users` for ownership.
* Review item cards use a left-edge color stripe matching severity. Cards are visually denser than entity cards (from spec 07) because review items tend to be more numerous and shorter-lived.
* Canvas review badges use a subtle, slightly transparent accent. The number badge format is small enough to not obscure the node label.
* The promote sub-menu uses a clean dropdown, not a separate dialog — the user picks the destination entity type, then the entity creation form (from spec 07) opens with pre-filled fields.

### Copy

| Surface                                        | Copy                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Review surface header                          | Review                                                                                                                                     |
| Review surface empty state                     | No review items yet. Ask Arqitect to review the design, or raise a review item on any element.                                             |
| Ask Arqitect to review button                  | Ask Arqitect to review                                                                                                                     |
| Scope dropdown: whole design                   | Whole design                                                                                                                               |
| Scope dropdown: selected element               | Selected element                                                                                                                           |
| Scope dropdown: security                       | Security review                                                                                                                            |
| Scope dropdown: resilience                     | Resilience review                                                                                                                          |
| Scope dropdown: observability                  | Observability review                                                                                                                       |
| Scope dropdown: data flow                      | Data flow review                                                                                                                           |
| Scope dropdown: ownership                      | Ownership review                                                                                                                           |
| Review in progress                             | Arqitect is reviewing the design.                                                                                                          |
| Review completed system event                  | Arqitect found {n} blocker, {n} suggestion, {n} info — {scope label}.                                                                     |
| Review found no issues                         | Arqitect found nothing to flag at this scope. The design's metadata may be too sparse for review — consider populating more fields first. |
| Review failed system event                     | Arqitect couldn't complete the review. You can retry from the review surface.                                                              |
| Raise review item button                       | Raise review item                                                                                                                          |
| Raise review item dialog title                 | New review item                                                                                                                            |
| Raise review item severity helper              | Blocker flags an issue that should be addressed before generating a spec.                                                                  |
| AI reasoning expander                          | View Arqitect's reasoning                                                                                                                  |
| Resolve action                                 | Resolve                                                                                                                                    |
| Dismiss action                                 | Dismiss                                                                                                                                    |
| Promote action                                 | Promote to…                                                                                                                               |
| Promote: decision                              | Decision                                                                                                                                   |
| Promote: risk                                  | Risk                                                                                                                                       |
| Promote: open question                         | Open question                                                                                                                              |
| Assign action                                  | Assign                                                                                                                                     |
| Discuss action                                 | Discuss                                                                                                                                    |
| Resolve dialog title                           | Resolve review item                                                                                                                        |
| Resolve dialog: resolution type label          | How is this resolved?                                                                                                                      |
| Resolution type: addressed                     | Addressed — the team acted on the finding                                                                                                 |
| Resolution type: wont_address                  | Won't address — the team chose not to act                                                                                                 |
| Resolution type: no_longer_relevant            | No longer relevant — the design changed and made it moot                                                                                  |
| Resolution type: false_positive                | False positive — the finding wasn't actually a problem                                                                                    |
| Resolve dialog: reason label                   | Resolution notes                                                                                                                           |
| Resolve dialog: reason helper                  | Brief context for future readers. Required.                                                                                                |
| Severity changed system event                  | {user} changed review item severity from {old} to {new}.                                                                                   |
| Promotion success toast                        | Review item resolved and captured as a {entity type}.                                                                                      |
| Assigned system event                          | {assigner} assigned this review item to {assignee}.                                                                                        |
| Spec generation gating: review items section   | Open blocker review items: {count}                                                                                                         |
| Confirmation dialog: open blocker review items | Open blocker review items                                                                                                                  |
| Confirmation dialog: resolve before generating | Resolve before generating                                                                                                                  |
| Confirmation dialog: proceed anyway            | Generate with unresolved review items                                                                                                      |
| Canvas review badge tooltip (single open)      | {severity} review item open on this {component / connection}.                                                                              |
| Canvas review badge tooltip (multiple)         | {n} review items open: {b} blocker, {s} suggestion, {i} info.                                                                              |

The "Arqitect found nothing to flag at this scope" copy is deliberate. It's honest about the relationship between metadata completeness and review quality. If the canvas has no metadata populated, AI review can't say much — and saying "nothing's wrong" would be misleading. The copy turns this into a prompt for the user to fill in metadata first.

The resolution-type copy is also deliberate. Each option has a one-line explanation, not just a label. Resolution metadata is more useful when the team understands what each value means and picks the right one consistently. The persona is technical enough to appreciate the clarity.

### Error Handling

* Review task failure: same patterns as spec 03 and 04. The conversation gets a failure system message; the user can retry.
* Review with no findings: the task completes successfully with `findings: []`. The summary message reflects this honestly ("Arqitect found nothing to flag at this scope").
* Review item targeting a node that gets deleted: the review item survives, with the target chip rendering "Target removed."
* Two review items raising the same concern (one AI, one human): the AI's prompt is constructed to avoid duplicates, but when one slips through, the user can dismiss one and reference the other in resolution notes. There is no automatic deduplication beyond what the AI does during its own review.
* Resolution without `resolutionType` or `resolutionReason`: form validation prevents submission.
* Promotion of a review item whose target is deleted: the promotion succeeds (the new entity is created), but with `targetType: project` instead of inheriting the deleted target. A note appears: "The original target was deleted; this entity is recorded at the project level."
* Multiple users acting on the same review item simultaneously: last-write-wins for status changes. The system message log shows both attempts; the final status is whichever finished last. Concurrent resolution of the same item by two users is rare enough that this is acceptable.
* AI review task hitting its 25-finding cap: the summary message notes "Review may have found additional findings beyond the cap. Consider running a scoped review for {scope suggestions} to see more."

### Scope Limits

* No automatic re-review on canvas changes. User-initiated only.
* No AI review of conversation messages (judging which discussion threads are productive, etc.). Review is for the design and its entities, not the discussion about them.
* No AI review of decisions for soundness ("you should have considered another option"). AI review is structural and metadata-driven; decision quality review is a different problem.
* No cross-project review (e.g., "your auth model is inconsistent with other projects in this workspace"). The architecture context kept workspace-level features out of scope.
* No review item templates or saved review configurations.
* No review item export. They appear in the generated spec under appropriate sections.
* No reviewer roles or approval workflow ("this review item must be resolved by an architect"). The persona is small teams in v1; reviewer enforcement is not yet needed.
* No notification system for review items (email, push, etc.). The conversation system messages and the canvas badges are the only notification surfaces.

### Architecture Alignment Check

| Architecture invariant                                                | This spec                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1. Request handlers do not run AI work                                | AI review runs as a Trigger.dev task; API endpoints handle queueing only.                              |
| 3. Auth and ownership at every mutation boundary                      | All review item endpoints validate project access.                                                     |
| 7. AI clarify and review do not mutate the canvas                     | The review task writes only to `ReviewItem`and `ConversationMessage`. No canvas-write path exists. |
| 9. Decisions, risks, conversation, etc. are durable Postgres entities | Review items are durable Postgres entities. They reference canvas elements via soft references.        |
| 10. Spec records reference review items state                         | `SpecGenerationContext.reviewItemsState`(introduced in spec 06's schema) is now fully populated.     |
| 13. Spec generation gated on blocker review items                     | Implemented completely: the `/check`endpoint surfaces open blocker review items; the dialog gates.   |
| 14. Soft references handled gracefully                                | Review items targeting deleted canvas elements survive; the UI renders "Target removed."               |

### Persona Alignment Check

| Persona need                                               | This spec                                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| AI critique and clarifying questions                       | AI review is the systematic critique surface; spec 04's clarify handled question-asking. Both are now real.          |
| AI as co-architect, not magic drawing button               | AI review is bounded, anchored to canvas elements, grounded in metadata. Quality constraints prevent shallow output. |
| Detect single points of failure, missing data stores, etc. | The scope-specific review prompts cover security, resilience, observability, data flow, ownership.                   |
| Reviewable suggestions over silent changes                 | All review items are reviewable; the user resolves, dismisses, or promotes — never auto-applied.                    |
| Unified review primitive for human and AI items            | One `ReviewItem`model with `source`distinguishing; same UI affordances for both.                                 |
| Spec generation gating on blockers                         | Complete in this spec: blocker review items, blocker risks, non-intentional open questions.                          |
| AI shallowness made visible                                | Quality feedback loop via `resolutionType: false_positive`; honest copy when review finds nothing.                 |
| Resolution and dismissal preserved with reasoning          | `resolutionReason`and `resolutionType`capture the full resolution context.                                       |

### Definition of Done

* `ReviewItem` Prisma model exists with the full schema, migrated, and indexed.
* The `trigger/review-design.ts` Trigger.dev task is implemented and follows the full lifecycle.
* Six review prompt templates exist: whole-design, selected-element, and the five concern-scoped reviews.
* Each prompt produces output validated against the `ReviewPlan` Zod schema.
* The review surface renders in the editor's left navigation with header, filters, list, and detail regions.
* The "Ask Arqitect to review" button with scope dropdown queues the appropriate task.
* All five review actions (resolve, dismiss, promote, assign, discuss) work as specified.
* Resolution requires `resolutionType` and `resolutionReason`; the form validates this.
* Promotion to decision, risk, or open question uses the spec 07 promotion flow and marks the review item resolved.
* Discussion of review items happens in the conversation surface (spec 04) via targeted messages.
* The `ai_finding` conversation message type is wired up — each AI-generated review item produces a corresponding `ai_finding` message in the conversation.
* Canvas review indicators render on nodes and edges with open review items, with severity-based visual treatment.
* The review badges respect spec 05's view modes (visible in engineering and implementation; suppressed in executive).
* Spec 06's `/spec-versions/check` endpoint returns open blocker review items in `gatingItems`.
* The spec generation confirmation dialog shows blocker review items alongside blocker risks and non-intentional open questions.
* The quality feedback loop (false-positive tracking) is implemented per `TaskRun` even though not yet surfaced to users.
* Editing AI item severity posts a system message; AI item title/description/reasoning remains immutable.
* Concurrent edits resolve last-write-wins, consistent with prior specs.
* TypeScript and build pass.
* No regression in any prior spec.
