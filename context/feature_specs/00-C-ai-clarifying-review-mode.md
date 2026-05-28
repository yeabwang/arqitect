# 00-C - AI Clarifying Questions and Review Mode

Upgrade the AI workspace from a prompt submission surface into a co-architect that can ask clarifying questions and review the current system for risks, assumptions, and missing pieces.

## Product Intent

The persona research identifies a key customer need: AI should not only draw boxes. It should help engineering leads and architects catch ambiguity before implementation.

This feature adds two related AI behaviors:

- clarifying questions before generation when the user's prompt is vague,
- review mode for existing canvases that surfaces risks, assumptions, open questions, and suggested improvements.

This unit should not rewrite the whole design agent or spec generator. It should add an actionable review loop in the existing AI sidebar and Trigger.dev task model.

## Current State

- The AI sidebar has Architect, Chat, and Specs tabs.
- Users can submit prompts to `/api/ai/design`.
- AI task status is tracked through Trigger.dev public tokens.
- Chat and status messages use Liveblocks feeds.
- The design agent task exists as the place for durable AI work.
- The current canvas can be read from React Flow in the client.

## User Story

As an engineering lead, I want Arqitect to review my architecture and ask useful questions, so that I can find missing responsibilities, risky dependencies, ambiguous data flows, and implementation blockers before handing work to the team.

## Implementation

1. Add an AI action mode contract.

   Extend the AI design API/task payload with a mode field:

   - `generate`
   - `review`
   - `clarify`

   Preserve the default behavior as `generate` for backward compatibility.

   The route should validate mode with Zod and reject unsupported values.

2. Add canvas context for review and clarify modes.

   For `review` and `clarify`, include:

   - current nodes,
   - current edges,
   - recent chat history if available,
   - project room ID,
   - the user's latest prompt or review instruction.

   Do not trust client-supplied project IDs. Continue resolving project access from the authenticated user and room ID.

3. Clarify mode behavior.

   Clarify mode should return a set of concise questions instead of mutating the canvas.

   The AI should ask questions only when the prompt is materially underspecified, such as:

   - no users or actors,
   - no critical flows,
   - no data stores,
   - unclear external integrations,
   - unclear scale or reliability needs,
   - unclear security requirements.

   Questions should be grouped as plain chat output, not a new database object.

   The user can answer in the chat and then run generation manually.

4. Review mode behavior.

   Review mode should inspect the current canvas and return structured review findings.

   Findings should include:

   - title,
   - severity: low, medium, high,
   - category: missing-component, unclear-flow, resilience, security, ownership, scalability, data, observability, implementation,
   - evidence from canvas labels/metadata,
   - recommendation,
   - optional suggested canvas change.

   For this unit, review mode should publish findings as AI chat messages and status feed updates. Do not create a Prisma model yet.

5. Add review quick actions in the AI sidebar.

   In the Architect tab, add compact action buttons:

   - `Draft architecture`
   - `Ask clarifying questions`
   - `Review current design`
   - `Find risks`

   `Draft architecture` maps to generate mode.

   `Ask clarifying questions` maps to clarify mode.

   `Review current design` and `Find risks` map to review mode with different prompt text.

6. Keep canvas mutation restricted.

   - `generate` may mutate the canvas as the existing design agent does.
   - `review` must not automatically mutate the canvas.
   - `clarify` must not mutate the canvas.
   - Suggested changes from review should be text recommendations in this unit.

7. Status messaging.

   Publish clear status phases:

   - `Reading canvas...`
   - `Checking assumptions...`
   - `Review complete.`

   If review fails, publish an error status and a chat message explaining that the review failed.

8. Response formatting.

   Chat output should be readable and compact.

   Suggested review output:

   ```
   Review findings

   High - Orders DB is a single point of failure
   Evidence: Checkout and Orders both depend on Orders DB.
   Recommendation: define backup, failover, and retry behavior.

   Medium - Payment confirmation flow is unclear
   Evidence: Stripe edge has no webhook or async confirmation path.
   Recommendation: add a webhook receiver or order reconciliation worker.
   ```

9. Tests.

   Add focused tests for:

   - API validation of mode,
   - unsupported mode rejection,
   - default mode behavior,
   - task input schema accepting review canvas context,
   - review output parser if a parser is introduced.

## UI Details

- Keep the AI sidebar layout intact.
- Use compact buttons or chips, not a new page.
- Use existing status strip patterns.
- Show errors in the chat feed.
- Avoid long explanatory text in the UI.

## Data Flow

1. User chooses an AI action in the sidebar.
2. Client collects prompt, nodes, edges, and recent chat context.
3. Client calls the AI route with mode.
4. Route authenticates and verifies project access.
5. Route triggers the durable task and stores run ownership.
6. Task publishes status and chat messages through Liveblocks.
7. Client tracks run status through existing Trigger.dev realtime token.
8. Review and clarify outputs appear in the shared chat feed.

## Error Handling

- If no canvas nodes exist, review mode should explain that there is nothing substantial to review.
- If the AI returns invalid structured review data, fall back to a plain text review message.
- If the task fails, publish an error status and an AI chat message.
- If the token route fails, show a local sidebar error without breaking the canvas.

## Scope Limits

- Do not create persistent review findings.
- Do not auto-apply suggested canvas changes.
- Do not implement comments or decision logs.
- Do not change spec generation.
- Do not create a new AI provider abstraction.
- Do not redesign the AI sidebar.

## Dependencies

- Existing AI design API and Trigger.dev task.
- Existing Liveblocks chat/status feeds.
- Optional structured metadata from `00-B`; review must still work without it.

## Check When Done

- AI sidebar exposes clear generate, clarify, and review actions.
- Clarify mode asks useful questions and does not mutate the canvas.
- Review mode returns structured risk/assumption findings and does not mutate the canvas.
- Generate mode continues to work as before.
- Status feed reflects review progress.
- Errors are visible without breaking the canvas.
- TypeScript and build pass.
