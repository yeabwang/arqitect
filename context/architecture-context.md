# Architecture Context

### Stack

| Layer            | Technology              | Role                                                                                                                                                                                                      |
| ---------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                                                                                                                                                              |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                                                                                                                                                                         |
| Auth             | Clerk                   | User identity and route protection                                                                                                                                                                        |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, conversation, decisions, assumptions, risks, open questions, review items, spec versions, handoff briefs, canvas snapshot pointers, task runs, activity log |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, cursors, and live conversation feed                                                                                                                             |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                                                                                                                                                           |
| Artifact storage | Vercel Blob             | Versioned canvas snapshots, generated Markdown specs, and handoff briefs                                                                                                                                  |

### System Boundaries

* `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
* `trigger` — Long-running background jobs: AI design generation, AI review, AI clarify, spec generation, and handoff generation.
* `lib` — Shared infrastructure: Prisma client, Liveblocks server client, access control helpers, snapshot helpers, and utilities.
* `components` — UI composition: canvas surfaces, sidebars, conversation panel, dialogs, and interactive elements.
* `prisma` — Database schema and generated client output.

### Storage Model

#### Postgres (relational metadata, durable state, queryable history)

* Projects, collaborators, invitations, and activity log.
* Conversation messages, threaded to project, node, edge, or decision.
* Decisions, assumptions, risks, and open questions — modeled as distinct entity types (see Decisions and Review Model below).
* Review items, including source (human or AI), severity, status, resolver, and resolution reason.
* Spec versions and handoff brief records, each referencing the canvas snapshot, decision log state, and conversation cursor at the moment of generation.
* Canvas snapshot pointers — each snapshot is a row in Postgres referencing a versioned blob path, with the latest pointer tracked per project.
* Task run records for all Trigger.dev jobs.
* Pending generation rows — a scoped, per-project row (`PendingGeneration`, unique on `projectId`) holding the guided pre-generation interview payload (or a skipped free-form prompt) between the start-design dialog and the editor. It is durable relational metadata, not a Liveblocks transient; it is replaced if re-entered, deleted once the user confirms generation in the editor, and expires 24h after creation.

#### Vercel Blob (immutable generated artifacts)

* Canvas snapshots at `canvas/{projectId}/{snapshotId}.json`. Snapshots are append-only and never overwritten. The current snapshot pointer is maintained in Postgres.
* Generated specs at `specs/{projectId}/{specVersionId}.md`.
* Generated handoff briefs at `handoffs/{projectId}/{handoffId}.md`.
* All generated artifacts are immutable once written. Regeneration produces a new artifact, never an overwrite.

#### Storage allocation rules

* Postgres holds relational metadata, ownership, history, and references to artifacts.
* Vercel Blob holds canvas snapshot content and Markdown output.
* Blob URLs and snapshot IDs are stored in Postgres as references (`canvasSnapshotPath`, `specFilePath`, `handoffFilePath`).
* Canvas node and edge metadata lives inside the canvas snapshot, not as separate relational rows, until a feature explicitly requires queryable architecture elements.

### Auth and Collaboration Model

* Every project has a single owner (Clerk user ID).
* Projects can include additional collaborators.
* Project sharing starts as a pending invitation by email.
* Pending invitations do not grant project access.
* Only the invited user's matching primary email can accept or deny an invitation.
* Accepting an invitation creates the collaborator relationship that grants access.
* Denied invitations remain visible to the inviter as denied state and are hidden from the invitee's Shared tab.
* Only authenticated users can access protected routes.
* Only the owner or a collaborator can mutate project resources.
* Liveblocks room tokens are issued only after verifying project membership. Tokens are scoped per session and re-verified on reconnect. Removing a collaborator invalidates their next token request.
* Access changes (collaborator added, removed, invitation accepted, denied) are recorded in the project activity log in Postgres.

### Starter System Designs

* Prebuilt templates are static canvas snapshots stored in the codebase.
* Each template ships as a structured bundle: canvas (nodes and edges with pre-populated metadata), a seed set of assumptions, a seed set of open questions specific to the pattern, and a set of suggested clarifying questions Arqitect posts immediately after import.
* Templates are loaded into the active Liveblocks room when a user imports one, and the seed assumptions, open questions, and clarifying questions are written into Postgres as project entities at import time.
* Import can occur on canvas creation or from within the editor at any time. Imported templates merge with the existing canvas as a clearly labeled subgraph.
* Template data follows the same node/edge schema and metadata contract as user-created canvas content.
* Template catalog metadata (category, best-fit persona, description) lives in code; templates do not require a separate database table and are resolved by template ID at import time.

### Canvas Metadata Contract

The metadata schema is a product contract, not a free-text annotation layer. It is the foundation that makes AI reasoning non-shallow and specs non-generic. The schema is phased: v1 fields are required to be available at launch; v2 fields are post-launch.

#### Node metadata, v1

| Field                  | Type    | Values                                                                                              |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `componentType`      | enum    | `service`,`datastore`,`queue`,`cache`,`client`,`external`,`job`,`gateway`,`other` |
| `responsibility`     | string  | Free text                                                                                           |
| `owner`              | string  | Team or individual                                                                                  |
| `runtime`            | string  | Deployment target or runtime                                                                        |
| `persistenceRole`    | enum    | `system_of_record`,`cache`,`derived`,`ephemeral`,`none`                                   |
| `securityBoundary`   | string  | Trust boundary identifier                                                                           |
| `externalDependency` | boolean |                                                                                                     |
| `lifecycleStatus`    | enum    | `existing`,`new`,`deprecated`,`planned`                                                     |
| `confidence`         | enum    | `high`,`medium`,`low`                                                                         |
| `notes`              | string  | Free text                                                                                           |

#### Edge metadata, v1

| Field                   | Type   | Values                                                                |
| ----------------------- | ------ | --------------------------------------------------------------------- |
| `protocol`            | enum   | `http`,`grpc`,`message_bus`,`database`,`file`,`other`     |
| `interactionMode`     | enum   | `sync`,`async`,`batch`,`streaming`                            |
| `dataExchanged`       | string | Free text or structured payload description                           |
| `producerRole`        | string | Producer identifier                                                   |
| `consumerRole`        | string | Consumer identifier                                                   |
| `failureBehavior`     | enum   | `retry`,`dead_letter`,`fail_open`,`fail_closed`,`undefined` |
| `securitySensitivity` | enum   | `public`,`internal`,`sensitive`,`regulated`                   |
| `confidence`          | enum   | `high`,`medium`,`low`                                           |
| `notes`               | string | Free text                                                             |

#### v2 fields (post-launch)

* Node: `scalingConcern`, `costSensitivity`, `complianceTags`
* Edge: `latencySensitivity`, `throughputExpectations`, `idempotencyGuarantees`

#### Schema rules

* All v1 fields are optional on individual nodes and edges to keep editing fluid, but the schema itself is fixed and validated.
* Missing or low-confidence values are visible in the UI and called out by AI review and spec generation rather than hidden.
* Metadata updates flow through React Flow and Liveblocks like other canvas changes.
* Metadata is included in AI review, spec generation, and handoff generation context.

### Project Conversation

* Conversation messages are durable relational data in Postgres, not Liveblocks-only state.
* Liveblocks streams the live conversation feed for real-time presence; Postgres is the source of truth.
* Each message carries: author (Clerk user ID or AI source), message type (user, AI clarify, AI review, system), content, created timestamp, and an optional thread target.
* Thread targets can reference: project, node ID, edge ID, decision, assumption, risk, open question, or another message.
* Targets referencing canvas elements are soft references because canvas elements can be deleted. Missing targets are handled gracefully — the message remains visible with a "target deleted" indicator and is excluded from generation context for that target.
* Conversation messages are included as context in spec and handoff generation, scoped by the conversation cursor at the moment of generation.

### Decisions, Assumptions, Risks, and Open Questions

These are four distinct entity types in Postgres, each with its own fields. They share a base shape (project ID, author, timestamps, linked element references, source tag for human vs. AI) but the per-type fields differ.

#### Decision

* Title, context, options considered, decision made, rationale, alternatives rejected, status (proposed, accepted, superseded).

#### Assumption

* Title, description, confidence (high, medium, low), status (active, validated, invalidated).

#### Risk

* Title, description, severity (info, suggestion, blocker), likelihood (low, medium, high), status (open, mitigated, accepted, resolved).

#### Open Question

* Title, description, status (open, resolved, intentionally_open).

#### Common behavior

* All four can be linked to nodes, edges, review items, conversation messages, or other entities of the same family.
* All four are included in spec and handoff generation context.
* Canvas element references are soft and handled gracefully when targets are deleted.

### Review Workflow

* Review items are a single primitive used for both human comments and AI-surfaced findings, distinguished by source.
* Each review item carries: title, description, source (`human` or `ai`), severity (`info`, `suggestion`, `blocker`), status (`open`, `resolved`, `dismissed`), assignee (optional), resolver (set on resolution), resolution reason, target (project, node, edge, decision, assumption, risk, or open question), and a threaded discussion via conversation messages.
* AI-generated review output is materialized as review items with `source: ai`; the UI and resolution flow are unified across human and AI sources.
* Any collaborator can resolve or dismiss any review item; the resolver and reason are recorded.
* Blocker-severity review items and open questions with status `open` (not `intentionally_open`) trigger a confirmation step at spec generation time. The user can resolve them, mark them as intentionally open, or proceed and accept that they will appear flagged in the generated spec.

### AI Generation Model

All AI generation runs as durable background tasks via Trigger.dev. Request handlers in `app/api` validate input, enforce ownership, and trigger the task; they do not run AI work directly.

#### Design Generation

* Input: user prompt or guided pre-generation interview output, project context, current canvas snapshot, and existing project entities.
* Output: structured node and edge updates with v1 metadata populated where supported. Unsupported metadata is marked `confidence: low` rather than fabricated.
* Canvas mutation path: the background task writes updates via the Liveblocks server client (or by emitting events the client applies through the existing collaborative state path). Snapshot writes are taken on completion.
* This is the only AI mode permitted to mutate the canvas.

#### Clarify Mode

* Input: user instruction, project context, current canvas snapshot, metadata, conversation cursor.
* Output: conversation messages of type `AI clarify`, threaded to relevant nodes, edges, or the project.
* Does not mutate the canvas.

#### Review Mode

* Input: user instruction, project context, current canvas snapshot, metadata, conversation cursor, existing decisions and review items.
* Output: review items with `source: ai`, each with severity, target, and description. Findings appear in the unified review workflow.
* Does not mutate the canvas.

#### Spec Generation

* Input: a frozen generation context consisting of:
  * The canvas snapshot ID captured at generation start.
  * The conversation cursor at generation start.
  * The decision log state (decisions, assumptions, risks, open questions) at generation start.
  * The set of open review items at generation start.
* Generation reads from the captured snapshot, not from the live Liveblocks room, so the spec reflects a stable moment.
* Spec generation is gated on unresolved blocker review items and on non-intentional open questions: the API returns a confirmation requirement, and the task only starts after the user resolves, marks intentionally open, or explicitly proceeds.
* Output: Markdown spec saved as an immutable artifact at `specs/{projectId}/{specVersionId}.md`, with a Postgres record linking it to the canvas snapshot ID, conversation cursor, and decision log state used.
* Specs are versioned; each generation creates a new version. Version history is queryable and downloadable.

#### Handoff Generation

* Input: the same frozen context model — canvas snapshot ID, conversation cursor, decision log state, open review items — plus the spec version it is generated from.
* Output: Markdown handoff brief saved as an immutable artifact at `handoffs/{projectId}/{handoffId}.md`, with a Postgres record linking it to the source spec version.
* The handoff brief includes a copyable coding-agent prompt as a structured section, embedding architecture summary, contracts (extracted from edge metadata), implementation scope, acceptance checks, and known traps.
* Handoff generation prepares implementation context but does not execute external coding agents.

### Multiple Views

* The engineering, executive, and implementation views are derived client-side from the canvas snapshot and metadata.
* Engineering view: full canvas with all metadata.
* Executive view: filtered to high-level components, hiding internal services and ephemeral nodes.
* Implementation view: nodes grouped by `lifecycleStatus` and implementation phase, with edges colored by `failureBehavior` and `securitySensitivity` for risk visibility.
* Views require no separate persistence in v1; they are filters and groupings over the existing canvas data.

### Canvas Snapshot Cadence

* Snapshots are written:
  * On every spec generation start (the generation reads from this snapshot).
  * On every handoff generation start.
  * At periodic checkpoints during active editing (debounced).
  * On explicit user save.
* Each snapshot is a new immutable blob at `canvas/{projectId}/{snapshotId}.json`. The current snapshot pointer in Postgres is updated to reference the latest.
* Historical snapshots are retained so spec versions remain reproducible.

### Invariants

1. Request handlers do not run long-lived AI work; that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers — Postgres for metadata and references, Blob for content.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema and v1 metadata contract are consistent between user-created content and imported templates.
6. The canvas snapshot is the source of truth for visual architecture structure and semantic node/edge metadata.
7. AI clarify and AI review modes do not mutate canvas nodes, edges, or metadata. They produce conversation messages and review items only. Design generation is the only AI mode that mutates the canvas.
8. Generated Markdown artifacts are immutable once written. Regeneration produces a new artifact, never an overwrite.
9. Conversation messages, decisions, assumptions, risks, open questions, and review items are durable relational metadata in Postgres, not Liveblocks-only state.
10. Spec and handoff brief records reference the canvas snapshot ID, decision log state, and conversation cursor at the moment of generation, so any version can be reconstructed.
11. Canvas snapshots are append-only and never overwritten; the latest pointer is tracked in Postgres and historical snapshots are retained.
12. Spec generation reads from the captured canvas snapshot, not from the live Liveblocks room, so generation reflects a stable moment.
13. Spec generation is gated on unresolved blocker review items and non-intentional open questions; the user must resolve, mark intentionally open, or explicitly proceed.
14. Canvas element references on conversation messages, decisions, assumptions, risks, open questions, and review items are soft references and must be handled gracefully when targets are deleted.
