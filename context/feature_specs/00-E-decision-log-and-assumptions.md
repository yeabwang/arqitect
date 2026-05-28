# 00-E - Decision Log and Assumptions

Add a project-level decision and assumption log so Arqitect preserves the reasoning behind architecture changes, not only the final canvas.

## Product Intent

The persona research shows that architecture handoff fails when the team loses why a decision was made. Diagrams show structure, but they rarely preserve alternatives, constraints, assumptions, and unresolved questions.

This feature introduces a lightweight decision log that can feed future specs and reviews. It should feel like a practical architecture decision record workflow without forcing heavyweight process.

## Current State

- Projects exist in Prisma.
- Canvas and specs are stored as artifacts.
- AI chat and status are stored in Liveblocks feeds.
- There is no persistent project decision log.
- Spec generation may mention open questions, but decisions are not stored as first-class project data.

## User Story

As an architect or engineering lead, I want to record decisions and assumptions during system design, so that future engineers understand why the architecture exists and what still needs validation.

## Implementation

1. Add a Prisma model for decision records.

   Create a model such as `ProjectDecision`:

   - `id`
   - `projectId`
   - `kind`
   - `title`
   - `summary`
   - `rationale`
   - `alternatives`
   - `status`
   - `source`
   - `createdBy`
   - `createdAt`
   - `updatedAt`

   Recommended enum-like values:

   - `kind`: decision, assumption, open-question, risk.
   - `status`: proposed, accepted, rejected, resolved.
   - `source`: manual, ai-review, spec-generation.

   Use strings or Prisma enums according to the project's existing migration style. Keep the schema simple.

2. Add access-controlled API routes.

   Create project-scoped routes under `app/api/projects/[projectId]/decisions`.

   Required endpoints:

   - `GET` list decisions for a project.
   - `POST` create a decision.
   - `PATCH /[decisionId]` update title, summary, rationale, alternatives, kind, and status.
   - `DELETE /[decisionId]` remove a decision.

   Access rules:

   - owner and collaborator can read.
   - owner and collaborator can create.
   - owner and collaborator can update.
   - owner and collaborator can delete for this initial product scope.

   Enforce access with existing project access helpers before any mutation.

3. Add a Decisions tab or panel in the AI workspace.

   Use the existing right sidebar structure where possible.

   Options:

   - Add a fourth tab named `Decisions`.
   - Or add a compact decisions section inside the existing Chat/Specs area if a fourth tab makes the sidebar cramped.

   Recommended: add a `Decisions` tab because the product concept is important and distinct.

4. Decision list UI.

   Each decision item should show:

   - kind,
   - status,
   - title,
   - short summary,
   - created date,
   - created-by label if available.

   Keep it compact and scrollable.

5. Create/edit UI.

   Add a dialog or inline editor for creating and editing decisions.

   Required fields:

   - title,
   - kind,
   - status,
   - summary.

   Optional fields:

   - rationale,
   - alternatives.

   Use textareas for summary/rationale/alternatives.

6. AI review integration.

   If `00-C` exists, review findings should include an action to save as:

   - risk,
   - assumption,
   - open question,
   - decision.

   For this unit, do not require the AI task itself to write to Prisma. The client can create a decision from a review message if the review message is structured enough.

7. Spec generation integration.

   Update the spec generation trigger route to include decisions in the context if they exist.

   The generated spec should use them in:

   - Risks and Tradeoffs,
   - Open Questions,
   - Architecture Notes,
   - Implementation Plan where relevant.

   Keep Markdown content stored in Blob as before.

8. Tests.

   Add focused tests for:

   - decision validation helpers,
   - access checks on list/create/update/delete,
   - cannot access decisions across projects,
   - spec route includes decisions if the route is updated.

## UI Details

- Keep visual hierarchy dense and technical.
- Use status dots or small text pills, not large cards.
- Use existing tokens only.
- Do not create nested cards.
- Use `rounded-xl` for small controls and `rounded-2xl` only for list item surfaces if needed.

## Data Flow

1. User creates or saves a decision in the sidebar.
2. Client calls project decision API.
3. API authenticates and validates project access.
4. Decision metadata is stored in PostgreSQL.
5. Decisions list refreshes.
6. Future spec generation fetches decisions and passes them into the task payload.

## Error Handling

- Empty title should be rejected.
- Empty summary should be rejected for manual decisions.
- Invalid kind/status should be rejected.
- Cross-project decision IDs should return 404.
- Unauthorized access should behave like existing project routes.
- Failed saves should show inline error text in the sidebar.

## Scope Limits

- Do not implement comments.
- Do not implement approval workflows.
- Do not implement decision version history.
- Do not store decision attachments.
- Do not let Trigger.dev tasks directly mutate decisions in this unit.
- Do not add organization-level governance.

## Dependencies

- Existing project access helpers.
- Existing Prisma setup.
- Optional AI review mode from `00-C`.
- Spec generation from `00-D` if decision context is included there.

## Check When Done

- Users can create, list, edit, and delete decisions for projects they can access.
- Decisions are unavailable to non-members.
- Decisions can be saved from AI review output if structured output exists.
- Spec generation can include project decisions as context.
- No Markdown decision content is stored as a generated spec artifact.
- TypeScript, Prisma generate, and build pass.
