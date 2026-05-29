
# Spec 04 — Project Conversation as a First-Class Object

This is the fourth of nine specs. Spec 02 left a stopgap: clarifying questions from templates landed in a `pendingClarifyingQuestions` array on the project, rendered as a static read-only list. Spec 03 added another stopgap: the AI sidebar showed one-way status messages from the generation task. Both were deliberately temporary. This spec replaces them with a real conversation.

### Strategic Intent

The product spec was unambiguous: conversation is a first-class persistent object, not a transient chat panel. The persona document was equally clear that "spec generation from the actual canvas and conversation" is one of Arqitect's differentiators. The architecture context committed conversation to Postgres rather than Liveblocks-only state.

This matters more than it might seem. Three Arqitect-specific behaviors depend on conversation being durable, structured, and threadable to canvas elements:

1. **Spec generation reads the conversation.** Spec 06 will include conversation messages in its generation context. A conversation that lives only in Liveblocks state would be lost between sessions, and the persona promise of conversation-aware specs would degrade to canvas-aware specs — which competitors already match.
2. **AI clarify mode lives in the conversation.** The architecture context defined clarify mode as producing conversation messages threaded to relevant nodes and edges. Spec 03 deferred clarify mode entirely because the conversation system did not exist. This spec makes it possible.
3. **Decisions, assumptions, risks, and open questions reference conversation.** Spec 02 created two of these entities; spec 07 will complete the set. All of them need to link to the conversation messages that produced them, so the reasoning chain is reconstructable.

The conversation system also resolves a subtle UI tension. Currently the AI sidebar in the editor is doing four overlapping jobs: showing pending clarifying questions (spec 02), showing the interview preview (spec 01), showing generation status (spec 03), and serving as a future home for AI clarify. Four jobs in one panel produces an incoherent surface. After this spec, the sidebar has one job: it is the conversation surface, with everything else surfaced as message types within it.

### What This Spec Delivers

A durable, threaded, real-time-synchronized conversation system where:

* Every message is persisted in Postgres with author, type, content, timestamps, and an optional thread target.
* Thread targets can reference the project, nodes, edges, decisions, assumptions, risks, open questions, or other messages — soft references with graceful handling per the architecture context.
* Live updates flow through Liveblocks so collaborators see new messages immediately, but Postgres remains the source of truth.
* The template clarifying questions stopgap from spec 02 is migrated to real conversation messages.
* The generation status messages stopgap from spec 03 is migrated to real conversation messages, with the generator's plan summary appearing as a completed-generation message.
* AI clarify mode is implemented as a durable Trigger.dev task that produces conversation messages threaded to canvas elements.
* The editor sidebar is restructured into a single conversation surface with type-aware rendering.
* Conversation messages can be quoted into decisions, assumptions, risks, and open questions (the latter two already exist from spec 02; the former two arrive in spec 07).
* Conversation cursor — a timestamp marking the state of conversation at a given moment — is a first-class concept used by spec 06's spec generation.

What this spec does *not* deliver:

* AI review mode. Spec 08.
* Spec generation reading the conversation. Spec 06 will do that using the conversation cursor introduced here.
* Decisions and risks as first-class entities. Spec 07.
* Conversation search across projects, archiving, or muting. The conversation is per-project and chronological in v1.
* File or image attachments in messages. Text only.

### User Story

> As an engineering lead working on a system design with my team, when one of us notices that a component's responsibility is ambiguous, I want to leave a question right on that component — not in Slack, not in a separate doc, not in a sticky note. The AI should be able to answer there too, and when we eventually generate the spec, the conversation that produced our decisions should be part of what the spec is built from.

### Conversation Data Model

prisma

```prisma
model ConversationMessage {
  id              String    @id @default(cuid())
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  authorType      String    // "user" | "ai_generation" | "ai_clarify" | "ai_review" | "system" | "template"
  authorUserId    String?   // Clerk user ID when authorType = "user"
  authorTaskRunId String?   // TaskRun id when author is an AI task; ties messages back to the run that produced them

  messageType     String    // "text" | "ai_question" | "ai_finding" | "generation_status" | "generation_summary" | "template_clarifying_question" | "system_event"
  content         String    // markdown-compatible text, max 5000 chars

  // Soft references — handled gracefully when targets are deleted (Invariant 14).
  targetType      String?   // "project" | "node" | "edge" | "decision" | "assumption" | "risk" | "open_question" | "message"
  targetId        String?   // canvas node/edge id, or Postgres id of the target entity

  parentMessageId String?   // for replies; null for top-level messages
  parent          ConversationMessage?  @relation("MessageReplies", fields: [parentMessageId], references: [id], onDelete: SetNull)
  replies         ConversationMessage[] @relation("MessageReplies")

  status          String    @default("active")  // "active" | "deleted"
  deletedAt       DateTime?
  deletedBy       String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Indexes for the common query shapes
  @@index([projectId, createdAt])
  @@index([projectId, targetType, targetId])
  @@index([projectId, parentMessageId])
}
```

Several choices in this schema deserve explicit justification:

**Author and type are separate fields.** `authorType` answers "who sent this" (a user, an AI generation task, the system); `messageType` answers "what kind of message is this" (free text, a generation summary, a template clarifying question). The two are correlated but not equivalent — a user can post free text or quote a canvas element into a question, and an AI clarify task can post both questions and findings. Separating them avoids forcing the UI to special-case based on author when it should special-case based on message kind.

**Replies are flat one-level threading.** A message can have a parent, but replies cannot have their own replies. Deep threading is a known whiteboard-tool failure mode — conversations become unreadable nested trees. Spec 02's review item discussions and spec 07's decision discussions will use the same one-level rule.

**Soft delete, not hard delete.** Conversation messages are part of the reasoning trail. A user can delete their own messages, but the message is marked deleted, not removed. Spec generation (spec 06) excludes deleted messages from its context. This preserves audit and prevents the "where did that decision come from" problem when the supporting message is gone.

**`authorTaskRunId` ties AI messages to their run.** Generation status messages from spec 03's `TaskRun` are linked back. The user can ask "which run produced this message," and the system can answer.

### Real-Time Synchronization

The architecture context committed conversation to Postgres as source of truth, with Liveblocks streaming the live feed. The implementation pattern:

1. **Write to Postgres first.** Any client that wants to send a message posts to `POST /api/projects/{projectId}/conversation/messages`. The handler validates access, writes the message row, and returns the message with its assigned id and timestamps.
2. **Broadcast via Liveblocks event.** After the Postgres write succeeds, the handler emits a `conversation_message_created` event into the project's Liveblocks room via the server client. All connected clients receive the event and merge the message into their local conversation view.
3. **Other clients reconcile.** If a client missed events (network blip, late join), it falls back to fetching `GET /api/projects/{projectId}/conversation/messages?since={lastSeenCursor}` to catch up.

This pattern is the inverse of Liveblocks' default optimistic-then-persist flow. The inversion is intentional: conversation is durable state, not collaborative cursor state. Optimistic writes followed by persistence would create a window where one user sees a message that another client cannot retrieve. The architecture context's Invariant 9 forbids that.

AI tasks (spec 03's generation task, this spec's clarify task) write messages directly to Postgres from server context, then emit Liveblocks events the same way. The task does not impersonate a client.

### Conversation Cursor

A conversation cursor is a timestamp identifying a point in the conversation. It is not a separate database entity — it is a value: the `createdAt` of the most recent active message at a given moment, plus the project id for scoping.

This spec introduces the cursor concept so spec 06 can use it. When spec 06 generates a spec version, it captures the cursor at generation start and stores it on the spec version record. The spec is generated from the conversation up to and including that cursor. Later messages do not affect prior spec versions.

This is also how clients reconcile after disconnects. The client tracks the cursor of the last message it has seen and asks the API for messages newer than that cursor on reconnect.

### Targeting Conversation Messages to Canvas Elements

A user who sees a node and wants to ask a question about it should not have to copy the node name into a chat box. The conversation surface supports targeting from three entry points:

**1. From the canvas.** Right-clicking a node or edge offers `Discuss this component` (or `Discuss this connection`). The action opens the conversation surface scoped to that target — the input is pre-attached to the node/edge id, and the existing thread for that target is displayed first.

**2. From the conversation surface.** When composing a new message, a `Target` selector lets the user pick a target type and value. For canvas elements, the picker is the existing canvas selection — clicking a node while the picker is active sets the target. For Postgres entities (decisions, assumptions, etc.), the picker is a typeahead.

**3. Programmatically (from AI tasks and templates).** AI clarify produces messages with targets pre-set. Template clarifying questions become messages targeted at the canvas elements the template's `linkedNodeIds`/`linkedEdgeIds` reference.

When a target is deleted (a node is removed from the canvas, an open question is resolved and pruned), the message stays. Its target indicator reads `Target removed` and is no longer interactive. The message remains visible in the project-level thread.

This soft-reference handling is the conversation system's implementation of Invariant 14.

### AI Clarify Mode

Clarify mode was defined in the architecture context but never implemented. It produces conversation messages threaded to canvas elements, asking questions about ambiguous or underspecified parts of the design. This spec implements it.

#### Trigger

The user invokes clarify mode from the editor toolbar (`Ask Arqitect to clarify`) or from a node/edge context menu (`Ask about this`). The toolbar invocation runs clarify against the whole canvas; the context menu invocation runs it scoped to a specific element.

#### Task

`trigger/clarify-design.ts` follows the same lifecycle pattern as `generate-design.ts` from spec 03:

1. Create a `TaskRun` with `type: "clarify"`, `status: "running"`.
2. Load context: current canvas snapshot, metadata, existing conversation (recent messages), existing assumptions and open questions, optional scope (which node/edge to focus on).
3. Call the model with a structured-output schema for the clarify plan:

typescript

```typescript
exportconstClarifyPlan= z.object({
  questions: z.array(z.object({
    content: z.string().max(1000),
    targetType: z.enum(["project","node","edge"]),
    targetId: z.string().optional(),// required when targetType is node or edge
    reasoning: z.string().max(500),// why this question matters; shown on hover
})).max(15),
});
```

4. Validate the plan. Invalid plans retry once, then fail.
5. **Write each question as a `ConversationMessage`** with `authorType: "ai_clarify"`, `messageType: "ai_question"`, `targetType` and `targetId` from the plan, and `authorTaskRunId` set.
6. Emit Liveblocks events for each new message.
7. Mark the `TaskRun` complete.

Clarify mode does not mutate the canvas. This is enforced by the architecture invariant and by the fact that clarify's task code has no canvas-write path — only message writes. Invariant 7 is structurally honored.

#### Differences from generation

Clarify produces messages, not nodes and edges. There is no materialization step, no two-store consistency problem — only Postgres writes, then Liveblocks broadcasts. The task is shorter (clarify caps at 15 questions; generation caps at 40 nodes and 80 edges), and the failure modes are narrower: model timeout, invalid plan, model error.

#### Why clarify is not the same as the interview

The spec 01 interview is pre-generation. It collects structure before the canvas exists. Clarify is post-canvas. It asks about an existing design, references specific components, and adds to the conversation rather than starting one. The two should not be unified.

### Template Clarifying Questions Migration

Spec 02 added `pendingClarifyingQuestions: string[]` to the `Project` model as a stopgap. This spec removes it.

On migration:

1. For every existing project with non-empty `pendingClarifyingQuestions`, create one `ConversationMessage` per question with `authorType: "template"`, `messageType: "template_clarifying_question"`, `content` set to the question, `targetType: "project"`.
2. The `templateId` is preserved in the message content as a parenthetical reference: `"... (from template: monolith-migration)"`. Templates do not have stable Postgres IDs, so embedding the slug in the content is sufficient.
3. Drop the `pendingClarifyingQuestions` field from `Project`.

Going forward, template imports (spec 02) write clarifying questions directly as `ConversationMessage` rows during import, replacing the array write. The template import flow gains a step: after writing assumptions and open questions to Postgres, it writes one conversation message per clarifying question, targeted to the relevant linked node or edge if the template specifies one, or to the project otherwise.

### Generation Status Messages Migration

Spec 03's sidebar showed status messages directly from `TaskRun.status` values. This spec moves those into conversation messages.

When a `TaskRun` of type `design_generation` transitions through its states, the task writes conversation messages at three key points:

| TaskRun state             | Conversation message                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `running`→`drafting` | One `system_event`message: "Arqitect started drafting the architecture, initiated by {user}."                                               |
| `completed`             | One `generation_summary`message: the plan summary, with subgraph statistics. Authored by `ai_generation`, linked via `authorTaskRunId`. |
| `failed`                | One `system_event`message: failure summary with error code.                                                                                 |

The sidebar's status display still shows live progress, but progress is no longer the conversation's purpose. The conversation records that generation happened and what it produced; the sidebar's progress indicator is ephemeral UI.

This shift also means the conversation contains a coherent history of every AI action taken on the project. Spec 06's spec generation will use this history as part of its context.

### The Editor Sidebar, Restructured

Before this spec, the editor sidebar accumulated three overlapping panels: the interview preview from spec 01, the pending clarifying questions list from spec 02, and the generation status display from spec 03. After this spec, the sidebar has one primary surface: the conversation.

#### Layout

* **Header.** Project name, conversation filter controls (`All`, `Mentions me`, `AI`, `Targeted at selection`).
* **Message list.** Chronological, oldest at top, newest at bottom, auto-scrolling on new messages unless the user has scrolled up. Each message renders type-aware: AI questions get a question icon and target chip, generation summaries get a summary card with subgraph stats, template clarifying questions get a template-origin badge, user messages get standard chat styling.
* **Selection-scoped thread.** When the user selects a canvas node or edge, the sidebar shows a small "Thread for {label}" section at the top with messages targeted at the selection. This is a filter, not a separate surface — the messages also appear in the main chronological list.
* **Composer.** Bottom of the sidebar. Text area with target selector. Below it, action chips: `Ask Arqitect to clarify`, `Ask about selection` (visible only when something is selected). The interview preview and confirm button from spec 01 still appear in the sidebar but only when a `PendingGeneration` row exists for the project — they are now a pre-conversation state, not a permanent feature.

#### Rendering by message type

| messageType                      | Rendering                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `text`                         | Standard message bubble.                                                                                          |
| `ai_question`                  | Bubble with question icon, target chip showing linked element, "View reasoning" expandable showing `reasoning`. |
| `ai_finding`                   | (Reserved for spec 08.)                                                                                           |
| `generation_status`            | Inline system event, muted styling.                                                                               |
| `generation_summary`           | Card with plan summary, subgraph stats, "View generation details" link to the generated subgraph.                 |
| `template_clarifying_question` | Bubble with template-origin badge ("From template: monolith-migration"), question icon.                           |
| `system_event`                 | Inline event, muted, single line.                                                                                 |

#### Composer behavior

* The composer supports markdown-compatible plain text. No rich formatting toolbar.
* The target selector defaults to the current canvas selection if there is one, otherwise to `project`.
* A small "Quote this message into..." menu on each AI question lets the user convert the question into an open question entity (writes a row to `OpenQuestion`, targets are inherited).
* Send is `Enter`, newline is `Shift+Enter`.

### Quoting Conversation Into Entities

The conversation should not be a dead-end discussion log. It should produce structured artifacts: assumptions, open questions, and (after spec 07) decisions and risks.

This spec wires up the conversation → entity flow for the two entity types that already exist:

**Conversation message → OpenQuestion.** Any AI question or user message can be promoted to an open question. The promotion creates an `OpenQuestion` row with `title` derived from the message's first sentence (editable in a confirmation dialog), `description` from the full message content, `source: "user"` (the promoter, even if the original message was AI-authored), and the same `linkedNodeIds`/`linkedEdgeIds` derived from the message's target. A reverse link is recorded: the open question row gets a new `sourceMessageId` field pointing back at the message.

**Conversation message → Assumption.** Same pattern. Writes a new `Assumption` row, with confidence defaulting to `medium` (editable in the dialog).

The schema additions:

prisma

```prisma
// Added to OpenQuestion and Assumption from spec 02:
sourceMessageId String?
sourceMessage   ConversationMessage? @relation(fields: [sourceMessageId], references: [id], onDelete: SetNull)
```

The `onDelete: SetNull` is deliberate — soft-deleting a conversation message should not delete the entities it produced.

Spec 07 will add the same flow for decisions and risks.

### API Surface

#### `GET /api/projects/{projectId}/conversation/messages`

Returns conversation messages with optional filters. Pagination by `createdAt` cursor.

Query parameters:

* `since` — messages with `createdAt > since`. Used for reconciliation after reconnect.
* `before` — messages with `createdAt < before`. Used for loading history.
* `targetType`, `targetId` — filter to messages with a specific target.
* `limit` — default 50, max 200.

Returns deleted messages with `status: "deleted"` and content blanked out. Clients render these as "Message deleted" placeholders to preserve thread continuity.

#### `POST /api/projects/{projectId}/conversation/messages`

Creates a user message. Body: `{ content, targetType?, targetId?, parentMessageId? }`. The handler:

1. Validates project access.
2. Validates content (non-empty, length cap).
3. Validates target if provided (the target must exist or be a valid soft reference).
4. Writes the row.
5. Emits the Liveblocks event.
6. Returns the created message.

#### `PATCH /api/projects/{projectId}/conversation/messages/{messageId}`

Edits a user message. Only the author can edit. Sets `updatedAt`. Edits are full replacements; no edit history is kept in v1.

#### `DELETE /api/projects/{projectId}/conversation/messages/{messageId}`

Soft-deletes a user message. Only the author or project owner can delete. Sets `status: "deleted"`, `deletedAt`, `deletedBy`. AI-authored and template-authored messages cannot be deleted by users — they can only be hidden by the owner.

#### `POST /api/projects/{projectId}/conversation/promote`

Promotes a conversation message into an `OpenQuestion` or `Assumption`. Body: `{ messageId, entityType: "open_question" | "assumption", title, description, confidence? }`. Creates the entity, sets `sourceMessageId`, returns the new entity.

#### `POST /api/projects/{projectId}/clarify`

Queues an AI clarify task. Body: `{ scope: "project" | { type: "node" | "edge", id: string } }`. Returns the `TaskRun` id. Same patterns as spec 03's generation endpoint: ownership check, idempotency, one-in-flight-clarify-per-project limit.

### UI Language

* The conversation surface uses the existing sidebar geometry but with denser message styling — closer to a developer-tool conversation log than a chat app.
* Message bubbles use foreground/muted-foreground tokens; AI messages get an accent border on the left edge, not a different background, to keep the surface visually flat.
* Targets are rendered as inline chips: `[Service: PaymentProcessor]` or `[Edge: api → db]`. Clicking the chip highlights and pans to the canvas element.
* The selection-scoped thread at the top of the sidebar uses a thin divider, not a card — it should feel like a contextual filter, not a separate panel.
* Generation summary cards use the same accent color as generation subgraphs on the canvas, tying the conversation entry to the visual artifact.
* Lucide icons: `MessageCircle` for `text`, `HelpCircle` for `ai_question`, `Sparkles` for `generation_summary`, `Layers` for `template_clarifying_question`, no icon for `system_event`.

### Copy

| Surface                               | Copy                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Empty conversation state              | No conversation yet. Ask Arqitect a question, or discuss a component by selecting it on the canvas.            |
| Composer placeholder                  | Discuss the design...                                                                                          |
| Composer target indicator (project)   | Targeting: this project                                                                                        |
| Composer target indicator (node)      | Targeting: {node label}                                                                                        |
| `Ask Arqitect to clarify`action     | Ask Arqitect to clarify                                                                                        |
| `Ask about selection`action         | Ask about {selection label}                                                                                    |
| Clarify in progress (sidebar status)  | Arqitect is reviewing the design for ambiguity.                                                                |
| Clarify completed system event        | Arqitect posted {n} questions about the design.                                                                |
| Clarify failed system event           | Arqitect couldn't complete the review. You can retry from the toolbar.                                         |
| Generation summary card title         | Architecture drafted                                                                                           |
| Generation summary card body format   | {plan summary first line}. {n} components, {n} connections, {n} assumptions, {n} open questions.               |
| Generation summary card link          | View the generated subgraph                                                                                    |
| Promote to open question dialog title | Capture as an open question                                                                                    |
| Promote to open question explanation  | Open questions are tracked separately from the conversation and are included in the spec when you generate it. |
| Promote to assumption dialog title    | Capture as an assumption                                                                                       |
| Promote to assumption explanation     | Assumptions are tracked separately and surfaced in the spec. Mark how confident you are in this assumption.    |
| Target removed indicator              | Target removed                                                                                                 |
| Message deleted placeholder           | Message deleted                                                                                                |

The promotion explanations are deliberate. They tell the user *why* the entity exists separately from the conversation — because the spec generation will use it. This is the first place in the product where the user encounters the "conversation is one input to the spec, structured entities are another" distinction. The copy makes the distinction concrete without lecturing.

### Error Handling

* Send failure (network or server): message stays in the composer as a draft with a retry affordance. No optimistic display — the message does not appear in the list until the server confirms.
* Target validation failure on send: inline error in the composer, "The selected component is no longer on the canvas." The user can clear the target and resend.
* Clarify task failure: system event posted to the conversation, retry affordance in the toolbar.
* Reconciliation gap (client receives a message id it has not seen): client fetches that message individually and merges it into the list.
* Liveblocks event dropped: client's polling fallback (every 30 seconds when the tab is active) catches up via the `since` parameter.
* Project deleted with conversation messages: cascade delete removes all messages. No orphaned conversation rows.

### Scope Limits

* No file or image attachments. Text only.
* No edit history. Edits replace content; an `editedAt` timestamp is the only signal that a message was edited.
* No reactions, mentions of other users, or notifications. Mentions/notifications would require an organization model that does not exist yet.
* No conversation export as a standalone artifact. Conversation flows into spec generation (spec 06); it is not a separate downloadable file in v1.
* No cross-project conversation or threading.
* No AI review messages. Review mode is spec 08; the `ai_finding` message type is reserved for it.
* No automatic question generation on canvas changes. The user explicitly invokes clarify.
* No conversation archival or muting. Every active message is visible by default; filters are the only attenuator.

### Architecture Alignment Check

| Architecture invariant                                           | This spec                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. Request handlers do not run AI work                           | Clarify mode runs as a Trigger.dev task; the API endpoint queues and returns.                     |
| 2. Metadata and large artifacts in separate layers               | Conversation is metadata in Postgres; no blob writes.                                             |
| 3. Auth and ownership at every mutation boundary                 | All conversation endpoints validate project membership before any write.                          |
| 7. AI clarify does not mutate the canvas                         | The clarify task writes only to `ConversationMessage`. No canvas-write path exists in its code. |
| 9. Conversation is durable Postgres state, not Liveblocks-only   | Postgres-first write pattern. Liveblocks broadcasts after persistence.                            |
| 14. Soft references handled gracefully                           | Targets stay on messages when the target is deleted; rendering shows "Target removed."            |
| Spec/handoff records reference conversation cursor at generation | Cursor is defined here; spec 06 and 09 will consume it.                                           |

### Persona Alignment Check

| Persona need                                            | This spec                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Architecture conversation captured alongside the design | Conversation is durable, threadable to canvas elements, and visible to all collaborators.                      |
| AI as co-architect that asks clarifying questions       | Clarify mode is implemented as a discrete user action that produces threaded questions.                        |
| Reasoning preserved across sessions                     | Postgres persistence; conversation cursor lets specs reference a stable point in the conversation.             |
| Spec generation from canvas AND conversation            | The cursor introduced here is the mechanism spec 06 will use to read conversation into spec context.           |
| Decisions captured rather than lost in chat threads     | Conversation messages can be promoted into structured entities (open questions, assumptions, more in spec 07). |
| Collaboration with cursors, presence, comments          | Canvas presence already exists; this spec adds the comments dimension as durable conversation.                 |

### Definition of Done

* `ConversationMessage` model is in Prisma with the schema above, migrated, and indexed.
* `OpenQuestion` and `Assumption` gain `sourceMessageId` with `SetNull` cascade.
* `Project.pendingClarifyingQuestions` is removed; existing data is migrated to conversation messages.
* All conversation endpoints (`GET`, `POST`, `PATCH`, `DELETE`, `/promote`, `/clarify`) are implemented with auth, validation, and Liveblocks event emission.
* The clarify Trigger.dev task is implemented and follows the same `TaskRun` pattern as spec 03's generation.
* Spec 03's generation task writes generation_status, generation_summary, and system_event messages into the conversation at the appropriate transitions.
* Spec 02's template import flow writes clarifying questions as conversation messages instead of into the dropped `pendingClarifyingQuestions` field.
* The editor sidebar is restructured into a single conversation surface with type-aware message rendering, selection-scoped threading, and a target-aware composer.
* The composer supports canvas targeting via right-click `Discuss this component` and via selection-aware target chips.
* Promote-to-open-question and promote-to-assumption flows are implemented with confirmation dialogs.
* Real-time message delivery works for multi-user sessions, with polling fallback for missed events.
* Soft delete renders correctly; soft-deleted messages do not appear in spec generation context.
* Target removed indicator renders when a referenced node or edge no longer exists.
* TypeScript and build pass.
* No regression in project creation, template import, generation, or canvas editing.
