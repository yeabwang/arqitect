# 00-F - Coding Agent Handoff Pack

Create a focused handoff export that turns a finalized architecture design and spec into a concise, coding-agent-ready implementation brief.

## Product Intent

Arqitect's best differentiated promise is not only "generate a spec." It is "make the design implementable by your team or coding agents." This feature creates the first explicit coding-agent handoff artifact without integrating directly with any external coding agent platform.

The handoff pack should be a Markdown artifact derived from the existing canvas, spec, decisions, and open questions. It should help a human or AI implementer understand scope, files likely to change, sequencing, risks, and acceptance checks.

## Current State

- Specs can be generated and downloaded.
- Project specs are stored in Vercel Blob with Prisma metadata.
- There is no separate handoff artifact.
- There is no integration with GitHub, Linear, Cursor, Claude Code, or other coding tools.

## User Story

As a technical founder or engineering lead, I want to export a coding-agent handoff brief from my architecture design, so that I can give an implementation agent enough context to build the system with fewer missing assumptions.

## Implementation

1. Add a handoff generation action in the Specs tab.

   The action should be project-scoped and use existing spec generation patterns.

   Suggested button label:

   - `Generate handoff brief`

   The button can sit near existing spec generation actions.

2. Add a Trigger.dev task.

   Create a task such as `generate-handoff`.

   Input should include:

   - projectId,
   - roomId,
   - current nodes,
   - current edges,
   - recent chat history,
   - latest generated spec content or selected spec content if available,
   - decisions/open questions if `00-E` exists.

   The task should produce Markdown only.

3. Add API routes.

   Create:

   - `POST /api/ai/handoff`
   - `POST /api/ai/handoff/token`

   Follow the same ownership and token pattern as design/spec generation:

   - authenticate user,
   - resolve project access from room ID,
   - trigger task,
   - store `TaskRun`,
   - return run ID,
   - issue public token scoped to the run.

4. Add artifact persistence.

   Reuse the ProjectSpec model if adding a `kind` field was done in `00-D`.

   If `ProjectSpec.kind` exists:

   - store handoff artifacts as `kind: "handoff-brief"`.

   If `ProjectSpec.kind` does not exist:

   - either add a narrow `kind` field now,
   - or store the artifact path in the same table and distinguish by filename in UI only.

   Recommended: add `kind String @default("technical-spec")` if it does not exist yet, because handoff briefs and specs are different artifacts.

   Markdown remains in Vercel Blob. Prisma stores metadata only.

5. Handoff Markdown structure.

   The generated handoff should include:

   - `# Coding Agent Handoff - <System Name>`
   - `## Objective`
   - `## Relevant Architecture`
   - `## Implementation Scope`
   - `## Out of Scope`
   - `## Suggested Work Breakdown`
   - `## Data and API Contracts`
   - `## Files or Areas Likely to Change`
   - `## Risks and Constraints`
   - `## Open Questions Before Coding`
   - `## Acceptance Checks`
   - `## Prompt For Coding Agent`

   The final prompt section should be directly copyable into a coding agent.

6. Grounding rules.

   The model must:

   - avoid inventing repository files unless codebase context is provided,
   - clearly separate known architecture from assumptions,
   - include open questions instead of guessing,
   - prefer small implementation steps,
   - include verification commands only if they are known from the current repo context.

7. UI listing.

   Specs tab should distinguish:

   - technical specs,
   - handoff briefs.

   Use compact labels. Do not create a new dashboard section.

8. Download and preview.

   Reuse existing preview/download behavior.

   Handoff briefs should preview as Markdown and download as `.md`.

9. Tests.

   Add focused tests for:

   - handoff route auth and project access,
   - task input validation,
   - artifact kind handling,
   - prompt contains required handoff sections.

## Data Flow

1. User clicks `Generate handoff brief`.
2. Client sends current canvas, chat history, and selected/latest spec reference if available.
3. API verifies access and triggers `generate-handoff`.
4. Task reads or receives necessary context.
5. AI generates Markdown.
6. Task stores artifact in Vercel Blob.
7. Prisma metadata records the artifact.
8. Sidebar lists the handoff brief.
9. User previews/downloads/copies the coding-agent prompt section.

## Error Handling

- If no technical spec exists, the task can still generate from canvas and chat, but it should mark missing spec context.
- If the canvas is empty, the task should fail with a clear user-facing error.
- If a selected spec cannot be fetched, fall back to latest spec or canvas-only generation only if clearly indicated.
- Blob failures should fail the run.
- Token route should reject runs not owned by the current user.

## Scope Limits

- Do not integrate with Cursor, Claude Code, GitHub Copilot, Linear, or GitHub in this unit.
- Do not create issue tickets.
- Do not inspect the user's codebase unless a later feature explicitly adds codebase ingestion.
- Do not claim the handoff is guaranteed correct.
- Do not auto-run implementation agents.

## Dependencies

- Existing spec generation flow.
- Existing artifact storage model.
- Optional decisions from `00-E`.
- Optional richer spec generation from `00-D`.

## Check When Done

- Users can generate a coding-agent handoff brief as a durable task.
- Handoff artifacts are persisted in Blob with Prisma metadata.
- Specs tab can distinguish handoff briefs from technical specs.
- Preview and download work for handoff briefs.
- The Markdown contains a copyable coding-agent prompt section.
- TypeScript, Prisma generate if needed, and build pass.
