# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, decisions, review items, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots, generated Markdown specs, and handoff briefs |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation, AI review, spec generation, and handoff generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, decisions, review items, generated artifact records, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json`, specs at `specs/{projectId}/{specId}.md`, and handoff briefs under a generated artifact path such as `handoffs/{projectId}/{artifactId}.md` or a typed specs path when using a shared artifact table.
- Project records, decision records, review records, spec/artifact records, collaborator records, invitation records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.
- Canvas node and edge metadata lives inside the canvas snapshot, not as separate relational rows, until a feature explicitly requires queryable architecture elements.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Project sharing starts as a pending invitation by email.
- Pending invitations do not grant project access.
- Only the invited user's matching primary email can accept or deny an invitation.
- Accepting an invitation creates the collaborator relationship that grants access.
- Denied invitations remain visible to the inviter as denied state and are hidden from the invitee's Shared tab.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Template nodes and edges may include the same architecture metadata as user-created canvas content.
- Template records can include static catalog metadata such as category, assumptions, open questions, and best-fit persona in code.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## Canvas Metadata Model

- The canvas remains the source of truth for visual architecture structure: nodes, edges, positions, sizes, labels, colors, and semantic metadata.
- Semantic node metadata can include component type, responsibility, owner, runtime, persistence role, external dependency, security boundary, scaling concern, lifecycle status, and notes.
- Semantic edge metadata can include protocol, interaction mode, data exchanged, failure behavior, latency sensitivity, security sensitivity, confidence, and notes.
- Metadata fields are optional so existing canvases and templates remain compatible.
- Metadata updates flow through React Flow and Liveblocks just like labels, colors, sizes, and connections.
- Metadata should be included in AI review, spec generation, and handoff generation context when available.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.
- Generation mode may mutate the canvas through the existing collaborative state path.

### Clarifying Questions and Review

- Input: user instruction, project context, current canvas state, architecture metadata, and relevant chat context.
- Execution: durable background task via Trigger.dev.
- Output: shared AI chat/status messages containing questions, findings, risks, assumptions, and recommendations.
- Clarify and review modes do not automatically mutate canvas nodes or edges.
- Suggested canvas changes remain user-reviewed until a later feature explicitly adds apply/accept behavior.

### Spec Generation

- Input: current canvas, architecture metadata, project context, chat context, decisions, and open review items where available.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to Vercel Blob and linked to the project in the database.
- Specs are generated artifacts; Markdown content does not belong directly in PostgreSQL.

### Handoff Generation

- Input: current canvas, architecture metadata, project context, latest or selected spec content when available, decisions, and open review items where available.
- Execution: durable background task via Trigger.dev.
- Output: Markdown coding-agent handoff brief saved to Vercel Blob and linked to the project in the database.
- Handoff generation prepares implementation context but does not execute external coding agents.

## Decisions and Review Model

- Decisions, assumptions, risks, and open questions are durable project metadata in PostgreSQL.
- Review items are durable project metadata in PostgreSQL and can target the project, a node, an edge, or a decision.
- Review targets may reference canvas element IDs stored in Blob snapshots; missing targets must be handled gracefully because canvas elements can be deleted.
- Decision and review records are included as context for spec and handoff generation when available.
- Liveblocks feeds can show AI chat/status and real-time collaboration, but durable project decisions and review items belong in PostgreSQL.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
6. The canvas snapshot remains the source of truth for visual architecture structure and semantic node/edge metadata.
7. AI review and clarification do not silently mutate the canvas.
8. Generated Markdown artifacts are stored in Blob; Prisma stores metadata and access references only.
9. Durable decisions and review items are relational project metadata, not transient Liveblocks-only state.
