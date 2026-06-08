# Architecture

## Stack

- Framework: Next.js `16.2.6`, React `19.2.4`, TypeScript.
- UI: Tailwind CSS v4, shadcn/ui primitives, Lucide icons.
- Auth: Clerk.
- Database: Prisma `7.8.0` with PostgreSQL.
- Canvas: Liveblocks + React Flow.
- AI jobs: Trigger.dev tasks using Vercel AI SDK + Requesty.
- Artifacts: Vercel Blob.

## App Surfaces

- `/` - public landing page, signed-in CTAs route to `/dashboard`.
- `/sign-in`, `/sign-up` - Clerk auth pages wrapped in project styling.
- `/dashboard` - authenticated project dashboard.
- `/dashboard/new` - full-screen design creation flow: blank, template, or prompt.
- `/editor/[roomId]` - authenticated collaborative canvas workspace.

`proxy.ts` uses Clerk's Next.js 16 proxy convention and redirects sign-in/sign-up completion to `/dashboard`.

## Boundaries

- `app/api` - route handlers for auth checks, validation, persistence, and task triggers.
- `trigger` - durable AI/background work.
- `lib` - Prisma, access control, Liveblocks, onboarding, and utility code.
- `components` - UI composition.
- `types` - shared canvas, onboarding, and task contracts.
- `prisma` - Prisma config, split model files, and migrations.

## State Layers

| Layer | Current responsibility |
| --- | --- |
| Clerk | User identity and protected routes |
| PostgreSQL | Projects, collaborators, invitations, pending generation, task runs, spec records |
| Liveblocks | Real-time canvas storage, presence, AI feed messages |
| Vercel Blob | Saved canvas JSON and generated Markdown specs |
| Trigger.dev | Long-running design and spec generation runs |

The live canvas is edited through Liveblocks. Autosave writes `{ nodes, edges }` to Blob through `/api/projects/[projectId]/canvas`.

## Main Flows

### Create Design

1. `/dashboard/new` collects a name and start path.
2. `POST /api/projects` creates the project using the generated room ID.
3. Blank path opens `/editor/[id]`.
4. Template path opens `/editor/[id]?start=template&template=<templateId>`.
5. Prompt path stores a pending-generation payload, then opens `/editor/[id]?start=ai`.

### Canvas Collaboration

1. Editor loads the project after `getProjectWithAccess`.
2. `LiveblocksProvider` authenticates through `/api/liveblocks-auth`.
3. React Flow nodes and edges sync through Liveblocks storage.
4. Autosave writes the latest canvas JSON to Blob after edits.

### AI Design

1. Client calls `POST /api/ai/design`.
2. Route validates access, triggers Trigger task `design-agent`, and records `TaskRun`.
3. Task uses Requesty + tool calls to mutate Liveblocks flow state.
4. Task publishes AI status feed messages and AI presence events.

### Spec Generation

1. Client calls `POST /api/ai/spec` with room ID, chat history, nodes, and edges.
2. Route resolves the project from `roomId`, triggers `generate-spec`, and records `TaskRun`.
3. Task generates Markdown, creates a `ProjectSpec`, uploads to Blob, and stores the Blob URL.
4. Specs are listed by `GET /api/projects/[projectId]/specs` and downloaded through the project download route.

## Current Gaps vs Product Context

The context docs describe the full product direction. Current code does not yet implement first-class decisions, assumptions, risks, open questions, review items, handoff briefs, versioned canvas snapshots per generation, or the full v1 node/edge metadata contract. Current canvas nodes store label, color, and shape.
