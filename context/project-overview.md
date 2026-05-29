## Arqitect

### Overview

Arqitect is a real-time collaborative system design workspace for engineering teams. Users start from a blank canvas, a curated architecture template, or a plain-English prompt. Arqitect interviews the team when the idea is underspecified, drafts an architecture on a shared canvas, asks clarifying questions, reviews the design for risks and gaps, and converts the canvas, conversation, decisions, and review context into implementation-ready Markdown specs and coding-agent handoff briefs.

Arqitect is not a generic whiteboard. It is a workspace for turning architecture conversations into reviewable system designs and developable artifacts that humans and coding agents can implement from.

### Product Principle

Every feature must support at least one of: clearer architecture, fewer missed risks, stronger implementation handoff, better shared understanding, or less diagram/spec drift. Features that do not support these outcomes are out of scope, regardless of how broadly useful they might be.

### Goals

1. Let authenticated users create and manage architecture projects with clear ownership and collaborator access.
2. Provide a collaborative real-time canvas purpose-built for system architecture, not generic diagramming.
3. Let users start from a blank canvas, a curated architecture template, or an AI prompt — and force structure into vague prompts before generation.
4. Store rich architecture semantics on canvas nodes and edges so AI reasoning is non-shallow and generated specs are non-generic.
5. Persist the architecture conversation alongside the canvas so spec generation reflects reasoning, not only visuals.
6. Let AI draft, extend, question, and review architecture designs without silently mutating the shared canvas.
7. Let collaborators refine the design, resolve review items, and capture decisions, assumptions, risks, and open questions as first-class objects.
8. Convert the canvas, conversation, metadata, and review context into persistent Markdown technical specs and coding-agent handoff briefs.
9. Make spec regeneration after canvas edits a normal, fast workflow — not a rare event.

### Core User Flow

1. User signs in.
2. User creates or selects a project.
3. User chooses how to start: blank canvas, starter architecture template, or AI prompt.
4. If the user chose AI prompt, Arqitect runs a guided pre-generation interview to collect system goal, users, critical flows, data stores, integrations, and constraints before generating anything.
5. User enters the project workspace and the canvas is initialized accordingly.
6. Arqitect generates or updates structured nodes and edges in the shared canvas, with metadata populated where the interview or template supplies it.
7. Collaborators edit the canvas, fill in architecture metadata on nodes and edges, and refine the design in real time.
8. The team converses with Arqitect and with each other in a persistent project conversation that can be threaded to specific nodes, edges, or decisions.
9. Arqitect asks clarifying questions or reviews the current design for risks, missing components, unclear flows, security boundaries, resilience gaps, observability gaps, and implementation blockers. AI proposals appear as reviewable suggestions, never as silent canvas mutations.
10. The team captures decisions, assumptions, risks, and unresolved questions, and creates or resolves review items on the project, nodes, edges, or decisions.
11. User triggers spec generation. If blocking review items or critical open questions exist, Arqitect surfaces them and asks the user to confirm proceeding, resolve them, or mark them as intentionally open.
12. App persists the generated Markdown technical spec as a new version, linked to the canvas snapshot, conversation state, and decision log at the moment of generation.
13. User optionally generates a coding-agent handoff brief from the current design and spec.
14. User previews, downloads, or shares generated artifacts.
15. User returns later to continue the design; canvas, conversation, decisions, review items, and prior spec versions are all preserved.

### Features

#### Authentication and Projects

* User sign-in and route protection.
* Project creation, ownership, and collaborator access.
* Project list and workspace navigation.
* Access model: project owner can manage collaborators, delete the project, and trigger generation. Collaborators can edit the canvas, participate in conversation, capture decisions, raise and resolve review items, and trigger generation. Access changes are recorded in the project activity log.

#### Guided Start

* Three entry paths from project creation: blank canvas, starter architecture template, or AI prompt.
* For AI prompt, a guided pre-generation interview elicits structured input before any generation runs. The interview collects, at minimum: system goal, primary users, critical user flows, expected data stores, external integrations, runtime and deployment context, scale expectations, and known constraints.
* The interview accepts partial answers; unanswered fields are surfaced as open questions on the resulting canvas rather than being silently assumed.
* Users can skip the interview, but the resulting canvas will then be heavily annotated with open questions and low-confidence flags so the shallowness is visible rather than hidden.

#### Starter Architecture Templates

* A curated library of prebuilt architecture templates covering common patterns: SaaS app, AI app, event-driven backend, marketplace, internal tool, data pipeline, monolith migration, microservices, CI/CD, serverless, and others added over time.
* Each template ships as more than a canvas snapshot. A template includes: a structured canvas (nodes and edges with pre-populated metadata), a seed set of assumptions, a seed set of open questions specific to that pattern, and a set of suggested clarifying questions Arqitect will ask immediately after import.
* Users can import a template into the canvas at any point during editing. Imported templates merge with the existing canvas as a clearly labeled subgraph that can be inspected or removed.
* Templates start an architecture discussion, not only a drawing.

#### Collaborative Canvas

* Shared real-time canvas using Liveblocks and React Flow (current implementation choices; not part of the product contract).
* Live cursors, presence indicators, and concurrent node/edge editing.
* Canvas snapshots persisted to artifact storage on a defined cadence: a snapshot is written on every spec generation, on every coding-agent handoff generation, and at periodic checkpoints during active editing, so the canvas history can be reconstructed and tied to generated artifacts.
* Multiple lightweight views from the same underlying canvas: an engineering architecture view (full detail), an executive summary view (high-level components and flows only), and an implementation plan view (components grouped by implementation phase). Views are derived from the canvas, not separately maintained.

#### Canvas Metadata Schema

The metadata schema is the foundation that makes AI reasoning non-shallow and specs non-generic. The schema is phased.

**Node metadata, v1 (required for launch):**

* Component type (service, datastore, queue, cache, client, external system, job, gateway, other)
* Responsibility (free text, what this component is responsible for)
* Owner (team or individual)
* Runtime or deployment target
* Persistence role (system of record, cache, derived store, ephemeral, none)
* Security boundary marker (which trust boundary this node sits inside)
* External dependency flag
* Lifecycle status (existing, new, deprecated, planned)
* Confidence level (high, medium, low)

**Node metadata, v2 (post-launch):**

* Scaling concern
* Cost sensitivity
* Compliance tags

**Edge metadata, v1 (required for launch):**

* Protocol (HTTP, gRPC, message bus, database, file, other)
* Interaction mode (sync, async, batch, streaming)
* Data exchanged (free text or structured payload description)
* Producer and consumer roles
* Failure behavior (retry, dead-letter, fail-open, fail-closed, undefined)
* Security sensitivity (public, internal, sensitive, regulated)
* Confidence level (high, medium, low)

**Edge metadata, v2 (post-launch):**

* Latency sensitivity
* Throughput expectations
* Idempotency guarantees

Metadata is editable on the canvas, surfaces in spec generation, and is used by the AI co-architect during review. Low-confidence and missing metadata are visible in the UI and called out by review.

#### Project Conversation

* The project conversation is a first-class persistent object, not a transient chat panel.
* It captures user-to-user discussion, user-to-AI exchanges, AI clarifying questions, and AI review output.
* Messages can be threaded to specific nodes, edges, or decisions, so conversation context attaches to the part of the architecture it concerns.
* The conversation is included as context in spec generation and handoff brief generation. The persona promise of "spec generation from the actual canvas and conversation" depends on this.
* Conversation history is preserved across sessions and tied to spec versions.

#### AI Co-Architect

* AI generates a system design from the guided pre-generation interview or from a direct prompt.
* Output is structured as canvas nodes and edges with metadata populated where the input supports it. Unsupported metadata fields are flagged low-confidence rather than fabricated.
* Generation runs as a durable background task.
* Two non-generation modes that never silently mutate the canvas:
  * **Clarify mode:** AI asks clarifying questions about the current design and posts them into the project conversation, threaded to the relevant nodes or edges.
  * **Review mode:** AI surfaces risks, missing components, unclear flows, security concerns, resilience gaps, observability gaps, and implementation blockers as review items the team can accept, dismiss, or resolve.
* AI-surfaced risks and review items share a single data model with human-raised review items so the UI and resolution flow are unified.
* AI suggestions that would modify the canvas are always presented as proposed changes the user can accept, edit, or reject — never applied directly.

#### Decisions, Assumptions, Risks, and Open Questions

* All four are first-class persisted objects, not free text in a sidebar.
* Each can be linked to nodes, edges, review items, conversation messages, or other decisions.
* Decisions carry: title, context, options considered, decision made, rationale, alternatives rejected, author, timestamp.
* Assumptions and risks carry: title, description, linked elements, confidence or severity, status.
* Open questions carry: title, description, linked elements, status (open, resolved, intentionally open).
* All four are included in generated specs and handoff briefs.

#### Review Workflow

* Review items are a single primitive used for both human comments and AI-surfaced risks, distinguished by source.
* A review item has: title, description, source (human or AI), linked element (project, node, edge, or decision), severity (info, suggestion, blocker), status (open, resolved, dismissed), assignee (optional), and discussion thread.
* Blocker-severity review items and unresolved critical open questions surface a confirmation step at spec generation time. The user can resolve them, mark them as intentionally open (recorded in the spec), or proceed and accept that they will appear flagged in the generated spec.
* Any collaborator can resolve any review item; the resolver and resolution reason are recorded.

#### Spec Generation

* Input to spec generation: current canvas, node and edge metadata, project conversation, decisions, assumptions, risks, open questions, and review items.
* Output is a Markdown technical specification, persisted as a new version. Each version is linked to the canvas snapshot, conversation state, and decision log at the moment of generation.
* Users can view spec history, compare versions, and download any version.
* Spec sections (canonical structure):
  * Overview
  * Goals and non-goals
  * User journeys and critical flows
  * Architecture diagram summary
  * Components and responsibilities (driven by node metadata)
  * Data flow (driven by edge metadata)
  * Data model and persistence
  * API, event, and integration contracts
  * Runtime and deployment assumptions
  * Security and access boundaries
  * Failure modes and resilience
  * Observability
  * Implementation phases
  * Decisions and rationale (from the decision log)
  * Assumptions
  * Open questions
  * Risks and tradeoffs
* Sections backed by sparse or low-confidence input are explicitly marked as such, so generic-looking content is visible as generic rather than hidden.

#### Coding-Agent Handoff Brief

The handoff brief is a primary differentiator and is specified deliberately rather than as a thin wrapper around the spec.

* Generated from the current design, the latest spec version, the decision log, and the project conversation.
* Persisted as a separate Markdown artifact linked to the spec version it was generated from.
* Sections:
  * Implementation scope (what is in and out of this implementation pass)
  * Architecture summary (compact, agent-readable)
  * Components to implement (each with responsibility, interfaces, and dependencies)
  * Contracts and data shapes (extracted from edge metadata)
  * Suggested work breakdown (ordered, with dependencies)
  * Risks and known unknowns the agent should not silently resolve
  * Acceptance checks (criteria the implementation must satisfy)
  * Out-of-scope items and known traps
  * Copyable agent prompt (a self-contained prompt the user can paste into a coding agent, embedding the architecture context, contracts, scope, and acceptance checks)
* The copyable prompt is generic enough to work with Claude Code, Cursor, GitHub Copilot, or other coding agents. Agent-specific tuning is a post-launch concern, not a launch requirement.
* Arqitect does not auto-run coding agents in the product at this stage.

#### Persistence and Artifacts

* Project metadata, canvas snapshots, conversation, decisions, assumptions, risks, open questions, review items, spec versions, and handoff briefs are all persisted.
* Generated artifacts (specs, handoff briefs, canvas snapshots) are stored as files in artifact storage and linked from the project database.
* Project workspace state is fully reconstructable from persisted data.

### Scope

#### In Scope

* Authentication and route protection
* Project creation, ownership, and collaborator access
* Guided start: blank canvas, starter template, or AI prompt with pre-generation interview
* Starter architecture template library with structured canvas, assumptions, open questions, and clarifying questions
* Real-time shared canvas with nodes, edges, presence, and live cursors
* Canvas metadata schema (v1 fields for launch)
* Multiple views from the same canvas: engineering, executive, implementation
* Project conversation as a persistent first-class object, threadable to canvas elements
* AI architecture generation from interview or prompt
* AI clarify mode and AI review mode, neither of which silently mutate the canvas
* Decisions, assumptions, risks, and open questions as first-class objects
* Unified review workflow for human and AI review items
* Spec generation with versioning, history, and gating on blocker review items
* Coding-agent handoff brief generation with a copyable agent prompt
* Persistent storage for project state and generated artifacts
* Preview, download, and share of generated artifacts

#### Out of Scope

* Billing and subscription systems
* Enterprise permission tiers beyond owner and collaborator
* Heavy enterprise architecture governance
* Deep BPMN/UML modeling
* Direct Miro, Lucidchart, draw.io, or Excalidraw import/export
* Automatic codebase ingestion and architecture drift detection
* Direct coding-agent execution or external agent orchestration
* GitHub/Linear issue creation from specs
* Formal approval workflows and organization policy enforcement
* Production object storage migration
* Mobile-native applications
* Canvas metadata v2 fields (scaling concern, cost sensitivity, compliance tags, latency sensitivity, throughput, idempotency)
* Agent-specific handoff brief tuning (per-agent prompt variants)
* ADR document generation as a separate artifact (decisions are captured in-spec for launch)
* C4 view auto-generation as a separate artifact
* Organization-level architecture library across projects

### Success Criteria

#### Capability Criteria

1. A signed-in user can create and open a project, and the access model is enforced.
2. Multiple users can collaborate in the same canvas simultaneously with presence and live cursors.
3. A user can start from a blank canvas, a starter template, or an AI prompt with guided pre-generation interview.
4. A user can import a prebuilt starter architecture template that brings assumptions, open questions, and clarifying questions with it.
5. AI can generate an architecture into the shared room from the interview or a prompt.
6. AI clarify mode and AI review mode operate without silently mutating the canvas.
7. Users can add and edit v1 metadata on nodes and edges.
8. Users can capture decisions, assumptions, risks, and open questions as first-class objects linked to canvas elements.
9. Collaborators can create and resolve review items, and AI-surfaced risks appear in the same review primitive.
10. Spec generation gates on blocker review items and surfaces a confirmation step.
11. The design can be converted into a persisted, versioned, implementation-ready Markdown spec, with each version linked to the canvas snapshot, conversation state, and decision log at generation time.
12. The design and spec can be converted into a persisted coding-agent handoff brief with a copyable agent prompt.
13. Project state and generated artifacts are stored in the correct layers and the workspace is fully reconstructable.

#### Outcome Criteria

These verify that the loop works, not only that the features exist:

14. Users return to continue an existing design across sessions.
15. Users invite collaborators, and more than one user edits a given project.
16. Users regenerate the spec after canvas edits, indicating the architecture-to-spec loop is being used iteratively rather than once.
17. Users accept a non-trivial portion of AI review suggestions (or explicitly dismiss them with reason), indicating AI review is useful rather than ignored.
18. Users download or share generated specs and handoff briefs, indicating the artifacts leave Arqitect and reach implementation.
19. Specs are generated against projects that have at least one decision, one assumption, and one resolved review item, indicating the reasoning layer is being used rather than skipped.

### Key Risks and Mitigations

* **Generic whiteboard feel.** Mitigated by metadata schema, structured templates, AI review depth, and visible spec output. If the metadata layer feels heavy, the v1/v2 phasing exists to lighten it without abandoning the foundation.
* **Shallow AI output.** Mitigated by the guided pre-generation interview, low-confidence flagging, clarifying-question mode, and review mode that surfaces gaps rather than papering over them.
* **Generic specs.** Mitigated by structured node and edge metadata feeding spec sections directly, by explicit marking of sparse sections, and by the conversation being a real input to generation rather than a side channel.
* **Competitor parity on AI features.** Mitigated by the depth of the loop — conversation, decisions, review items, versioned specs, and handoff briefs are all proprietary context that generic AI diagramming tools do not accumulate.
* **Metadata burden on users.** Mitigated by phased schema, AI-populated defaults during generation, low-confidence flags rather than required fields, and the fact that metadata absence is visible in spec output as a prompt to fill it in.
