# Arqitect

## Overview

Arqitect is a real-time collaborative system design workspace for engineering teams. Users start from a blank canvas, a curated architecture template, or a plain-English prompt. Arqitect drafts and reviews the system with them, collaborators refine the structured architecture canvas, decisions and open questions are captured, and the app generates implementation-ready Markdown specs and coding-agent handoff briefs.

Arqitect is not a generic whiteboard. It is a workspace for turning architecture conversations into reviewable system designs and developable artifacts.

## Goals

1. Let authenticated users create and manage architecture projects.
2. Provide a collaborative real-time canvas for system architecture.
3. Let users start from a blank canvas, curated template, or AI prompt.
4. Store architecture semantics on canvas nodes and edges so the design can be reviewed and converted into better specs.
5. Let AI draft, extend, question, and review architecture designs.
6. Let collaborators refine the design, resolve review items, and capture decisions, assumptions, risks, and open questions.
7. Convert the final canvas and project context into persistent Markdown technical specs.
8. Generate coding-agent handoff briefs that help humans or coding agents implement from the design.

## Core User Flow

1. User signs in.
2. User creates or selects a project.
3. User chooses how to start: blank canvas, starter template, or AI prompt.
4. User enters the project workspace.
5. User imports a starter template or asks Arqitect to draft the system when needed.
6. Arqitect generates or updates structured nodes and edges in the shared canvas.
7. Collaborators edit the canvas, add architecture metadata, and refine the design.
8. Arqitect asks clarifying questions or reviews the current design for risks, assumptions, and missing pieces.
9. The team records decisions, assumptions, risks, and unresolved questions.
10. The team resolves review items or intentionally leaves open questions visible.
11. User triggers spec generation.
12. App persists the generated Markdown technical spec.
13. User optionally generates a coding-agent handoff brief from the design and spec.
14. User previews, downloads, or shares generated artifacts.

## Features

### Authentication and Projects

- User sign-in and route protection.
- Project creation, ownership, and collaborator access.
- Project list and workspace navigation.

### Collaborative Canvas

- Shared real-time canvas using Liveblocks and React Flow.
- Live cursors, presence indicators, and node/edge editing.
- Canvas snapshots persisted to artifact storage.
- Architecture metadata on nodes and edges, including component role, responsibility, ownership, protocol, interaction mode, data exchanged, sensitivity, and confidence where available.

### Starter System Designs

- A curated library of prebuilt system design templates.
- Users can import a starter template into the canvas at any point during editing.
- Templates are static canvas snapshots loaded directly into the active room.
- Covers common patterns: SaaS app, AI app, event-driven backend, marketplace, internal tool, data pipeline, monolith migration, microservices, CI/CD, serverless, and more.
- Templates include assumptions and open questions where useful so users start with an architecture discussion, not only a drawing.

### AI Co-Architect

- AI generates a system design from a user-supplied prompt.
- Output is structured as canvas nodes and edges written into the shared room.
- Generation runs as a durable background task.
- AI can ask clarifying questions when the prompt or design is underspecified.
- AI can review the current design for risks, missing components, unclear flows, security concerns, resilience gaps, and implementation blockers.
- AI review and clarify modes do not automatically mutate the canvas; suggested changes remain reviewable by the user.

### Decisions and Review

- Users can capture project decisions, assumptions, risks, and open questions.
- Collaborators can raise and resolve review items on the project, nodes, edges, or decisions.
- Open review blockers and open questions remain visible before spec generation.
- Decision and review context can be included in generated specs and handoff briefs.

### Spec Generation

- The current architecture canvas, metadata, chat context, decisions, and review context are converted into a Markdown technical specification.
- Specs are persisted as files and linked to the project in the database.
- Users can view and download generated specs.
- Generated specs should include implementation-oriented sections: goals, non-goals, critical flows, components, data flow, data model, contracts, runtime assumptions, security boundaries, failure modes, observability, implementation plan, risks, tradeoffs, and open questions.

### Coding-Agent Handoff

- Users can generate a Markdown handoff brief from the current design and spec.
- Handoff briefs are persisted as generated artifacts.
- Handoff briefs should include implementation scope, suggested work breakdown, risks, acceptance checks, and a copyable prompt for a coding agent.
- Arqitect does not auto-run coding agents in the product at this stage.

## Scope

### In Scope

- Authentication and route protection
- Project creation and ownership
- Collaborator access by project
- Guided start path: blank canvas, starter template, or AI prompt
- Starter system design template library and import
- Real-time shared canvas with nodes, edges, and presence
- Architecture metadata on canvas nodes and edges
- AI-powered architecture generation from prompts
- AI-powered clarifying questions and architecture review
- Decision, assumption, risk, and open-question capture
- Lightweight collaborative review workflow
- AI-powered Markdown spec generation from the canvas and project context
- AI-powered coding-agent handoff brief generation
- Persistent storage for project metadata and generated artifacts
- Spec and handoff preview/download

### Out Of Scope

- Billing and subscription systems
- Enterprise permission tiers beyond owner and collaborator
- Heavy enterprise architecture governance
- Deep BPMN/UML modeling requirements
- Direct Miro, Lucidchart, draw.io, or Excalidraw import/export
- Automatic codebase ingestion and architecture drift detection
- Direct coding-agent execution or external agent orchestration
- GitHub/Linear issue creation from specs
- Formal approval workflows and organization policy enforcement
- Production object storage migration
- Mobile-native applications

## Success Criteria

1. A signed-in user can create and open a project.
2. Multiple users can collaborate in the same canvas simultaneously.
3. A user can start from blank canvas, template, or AI prompt.
4. A user can import a prebuilt starter design into the canvas.
5. AI can generate an architecture into the shared room from a prompt.
6. AI can ask clarifying questions and review the design without silently mutating it.
7. Users can add architecture metadata to nodes and edges.
8. Users can capture decisions, assumptions, risks, and open questions.
9. Collaborators can create and resolve review items.
10. The design can be converted into a persisted implementation-ready Markdown spec.
11. The design and spec can be converted into a persisted coding-agent handoff brief.
12. Project metadata and generated artifacts are stored in the correct layers.
