# 00-H - Collaborative Review Workflow

Add a lightweight project review workflow so teams can resolve architecture feedback before generating final specs and handoff briefs.

## Product Intent

Arqitect's target teams need alignment before code. They already have real-time collaboration, but there is no explicit review loop for architecture comments, open questions, and sign-off. This feature adds just enough workflow to make team review practical without becoming enterprise governance.

This unit should come after AI review and decisions are in place. It connects human collaboration with the architecture-to-implementation loop.

## Current State

- Collaborators can be invited to projects.
- Live presence and cursors exist.
- Chat/status feeds exist for AI interactions.
- Project decisions may exist if `00-E` has been implemented.
- There is no user comment or review status model.

## User Story

As an engineering lead, I want collaborators to review the architecture, raise questions, and mark the design ready, so that the generated spec reflects team agreement rather than one person's draft.

## Implementation

1. Add a review item model.

   Create a Prisma model such as `ProjectReviewItem`:

   - `id`
   - `projectId`
   - `authorId`
   - `kind`
   - `status`
   - `targetType`
   - `targetId`
   - `title`
   - `body`
   - `createdAt`
   - `updatedAt`
   - `resolvedAt`

   Recommended values:

   - `kind`: comment, question, blocker, suggestion.
   - `status`: open, resolved.
   - `targetType`: project, node, edge, decision.

   Keep this model small. Do not build threaded comments yet.

2. Add access-controlled API routes.

   Create project-scoped routes:

   - `GET /api/projects/[projectId]/review-items`
   - `POST /api/projects/[projectId]/review-items`
   - `PATCH /api/projects/[projectId]/review-items/[reviewItemId]`
   - `DELETE /api/projects/[projectId]/review-items/[reviewItemId]`

   Access rules:

   - project members can list and create,
   - item author or project owner can edit/delete,
   - project members can resolve/unresolve unless stricter ownership is easy to support.

3. Add a Review tab or panel.

   Add a `Review` tab in the AI/right sidebar or a compact review panel accessible from the editor top controls.

   Recommended: right sidebar tab if the sidebar already handles AI/spec/decision workflows; top controls can show an open item count.

4. Review item creation.

   Users should be able to create:

   - project-level review item,
   - node-targeted review item when a node is selected,
   - edge-targeted review item when an edge is selected,
   - decision-targeted review item if decisions exist.

   The create UI should prefill target context from the selected canvas element.

5. Review item list.

   The list should show:

   - open items first,
   - kind,
   - target,
   - title,
   - short body,
   - author,
   - created date,
   - resolve action.

   Clicking a node/edge-targeted item should focus or select the target element if it still exists.

6. Ready-for-spec state.

   Add a compact project review status derived from review items:

   - `Needs review` if open blocker/question items exist.
   - `Ready for spec` if no open blocker/question items exist.

   This can be computed client-side from fetched review items for this unit.

   Show the status near the spec generation action so users understand whether open review work remains.

7. AI review integration.

   If `00-C` exists, allow saving an AI finding as a review item.

   AI-created review items should have source text in the body, but the author should be the current user who saved it, not an unauthenticated AI identity.

8. Decision integration.

   If `00-E` exists, allow converting a resolved question into a decision or assumption.

   Keep this as a simple action that opens the decision create dialog with prefilled text.

9. Spec generation integration.

   When generating a spec, include open review items in the task context.

   The generated spec should mention unresolved blockers/questions in `Open Questions` and should not silently treat them as resolved.

10. Tests.

   Add focused tests for:

   - access control,
   - author/owner edit and delete rules,
   - cross-project target rejection,
   - status derivation,
   - focusing missing targets fails gracefully if UI helper is added.

## UI Details

- Keep review workflow lightweight and technical.
- Do not use large social-comment cards.
- Use compact rows, small badges, and clear resolve actions.
- Use existing tokens only.
- Avoid visible instructional copy beyond empty states.

## Data Flow

1. User creates a review item from the sidebar or selected canvas element.
2. Client sends item to project review API.
3. API verifies access and stores metadata in PostgreSQL.
4. Review panel refreshes.
5. User resolves or edits items.
6. Spec generation fetches open items and includes them in task context.

## Error Handling

- Empty title/body should be rejected according to validation rules.
- Invalid target type should be rejected.
- Target ID may reference a node/edge that later disappears; UI should show it as missing rather than crash.
- Unauthorized users should not see or mutate review items.
- Failed resolve/edit/delete actions should show inline errors.

## Scope Limits

- Do not implement threaded comments.
- Do not implement notifications or email.
- Do not implement formal approval/sign-off roles.
- Do not implement enterprise review policies.
- Do not add organization-level dashboards.
- Do not store review items in Liveblocks only; they should be durable project metadata.

## Dependencies

- Existing project collaborators.
- Optional AI review mode from `00-C`.
- Optional decisions from `00-E`.
- Spec generation from `00-D`.

## Check When Done

- Project members can create and resolve review items.
- Review items can target project, node, edge, and decision where available.
- Open blockers/questions affect visible ready-for-spec status.
- Spec generation includes unresolved review items as context.
- Node/edge review items can focus/select existing targets.
- Access control prevents cross-project access.
- TypeScript, Prisma generate, and build pass.
