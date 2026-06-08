# API and Data

All app API routes require Clerk auth unless noted. Project mutations must pass owner or collaborator checks; owner-only routes are called out below.

## Routes

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/projects` | `GET` | List owned and shared projects |
| `/api/projects` | `POST` | Create project with client-provided slug ID |
| `/api/projects/[projectId]` | `PATCH` | Rename project; owner only |
| `/api/projects/[projectId]` | `DELETE` | Delete project; owner only |
| `/api/projects/[projectId]/canvas` | `GET` | Load saved canvas JSON from Blob |
| `/api/projects/[projectId]/canvas` | `PUT` | Save `{ nodes, edges }` canvas JSON to Blob |
| `/api/projects/[projectId]/pending-generation` | `GET` | Read pending onboarding payload |
| `/api/projects/[projectId]/pending-generation` | `POST` | Upsert pending onboarding payload for 24 hours |
| `/api/projects/[projectId]/pending-generation` | `DELETE` | Clear pending onboarding payload |
| `/api/projects/[projectId]/collaborators` | `GET` | List collaborators and owner-visible invitations |
| `/api/projects/[projectId]/collaborators` | `POST` | Invite collaborator by email; owner only |
| `/api/projects/[projectId]/collaborators/[collaboratorId]` | `DELETE` | Remove collaborator; owner only |
| `/api/project-invitations` | `GET` | List pending invitations for current user's email |
| `/api/project-invitations/[invitationId]` | `PATCH` | Accept or deny invitation |
| `/api/liveblocks-auth` | `POST` | Issue Liveblocks room token after access check |
| `/api/ai/onboarding` | `POST` | Stateless onboarding turn or summary generation |
| `/api/ai/design` | `POST` | Trigger canvas design task and return Trigger run token |
| `/api/ai/design/token` | `POST` | Mint Trigger public read token for a recorded run |
| `/api/ai/spec` | `POST` | Trigger Markdown spec generation |
| `/api/ai/spec/token` | `POST` | Mint Trigger public read token for a recorded run |
| `/api/projects/[projectId]/specs` | `GET` | List generated specs for a project |
| `/api/projects/[projectId]/specs/[specId]/download` | `GET` | Stream generated Markdown spec from Blob |

## Trigger Tasks

| Task ID | File | Current output |
| --- | --- | --- |
| `design-agent` | `trigger/design-agent.ts` | Mutates Liveblocks canvas with nodes/edges and returns run summary |
| `generate-spec` | `trigger/generate-spec.ts` | Persists Markdown spec to Blob and returns `{ spec, specId, projectId, roomId }` |

Both tasks publish status messages to Liveblocks feed `ai-status-feed`.

## Prisma Models

| Model | Purpose |
| --- | --- |
| `Project` | Owned design workspace; stores latest `canvasJsonPath` |
| `ProjectCollaborator` | Accepted collaborator email per project |
| `ProjectInvitation` | Pending, accepted, or denied email invitation |
| `PendingGeneration` | Durable onboarding payload before AI generation |
| `TaskRun` | Trigger run ID linked to project and user |
| `ProjectSpec` | Generated spec record linked to Blob URL |

## Canvas Types

Canvas contracts live in `types/canvas.ts`.

- Node type: `canvasNode`.
- Edge type: `canvasEdge`.
- Shapes: `rectangle`, `diamond`, `circle`, `pill`, `cylinder`, `hexagon`.
- Node data: `label`, `color`, `shape`.
- Edge data: optional `label`.
- Drag MIME type: `application/arqitect-shape`.

Starter templates live in `components/editor/starter-templates.ts`. Current templates: Microservices, CI/CD Pipeline, Event-Driven System.
