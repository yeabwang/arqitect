# 39 — Durable Project Conversation

> Phase A of `34-full-dev.md`. Depends on: 38. Blocks: 42, 45, 49.

## Goal

Make the project conversation a first-class persistent object (invariant 9): Postgres is the source of truth, Liveblocks streams the live feed, and messages can be threaded to canvas elements and reasoning entities. Spec generation later scopes context by a conversation cursor.

## Current State

Chat lives only in the Liveblocks `ai-chat` feed (`AI_CHAT_FEED_ID`, `components/editor/ai-sidebar.tsx` ChatTab + ArchitectTab). Messages vanish from Postgres' perspective; nothing is threadable; AI completions are feed-only.

## Implementation

1. **Create `lib/project-conversation.ts`:**
   - `createConversationMessage({ projectId, roomId, authorId, authorType, messageType, content, targetKind?, targetId?, runId? })` — persists the `ConversationMessage` row, then broadcasts a feed message to the room's `ai-chat` feed via the Liveblocks server client (reusing the `ensureFeedRef`/409-swallow pattern from `trigger/design-agent.ts`) carrying `{ messageId, ...payload }`. Postgres write is authoritative; a failed broadcast logs and continues (clients reconcile on next load).
   - `listConversationMessages(projectId, { before?, limit = 100 })` — cursor pagination, ascending order for render.
   - `latestConversationCursor(projectId)` — id of the newest message (the generation-context cursor).
2. **Routes `app/api/projects/[projectId]/conversation/route.ts`:**
   - `GET` — auth (`getCurrentProjectIdentity` + `getProjectWithAccess`), returns paginated messages with author display data resolved best-effort from Clerk (id + name + avatar, cached per request).
   - `POST` — body zod: `content` (1–4000 chars), optional `targetKind`/`targetId` (enum from spec 38). Persists via the lib helper with `authorType: HUMAN`, `messageType: USER`. Returns the created message.
3. **Client wiring (`ai-sidebar.tsx`):**
   - Merge the `Chat` tab into the **Arqitect** tab per the 34 §3.5 IA: one thread showing user messages, AI completions, clarify questions, and review summaries chronologically.
   - Initial load: `GET` conversation (last 100). Live updates: keep subscribing to the `ai-chat` feed; entries carrying a `messageId` already loaded are deduped by id.
   - Sending: POST to the conversation route (replaces direct `useCreateFeedMessage` for user messages); optimistic append, rollback + inline error on failure (reuse the existing error-pill pattern).
   - Design-agent completion/error messages move server-side: `trigger/design-agent.ts` replaces its feed-only assistant message with `createConversationMessage` (`authorType: AI`, `messageType: SYSTEM` for status-final summaries). The client `RunTracker` stops pushing assistant messages itself (server is authoritative; the broadcast delivers it live).
4. **Threading UI:**
   - Composer gains an "attach to selection" chip: when exactly one node/edge is selected on the canvas, show `Thread to: {label}` (toggleable off). POST includes `targetKind`/`targetId`.
   - Messages with a target render a small mono chip (`↳ {target label}`); clicking selects + centers the element via `useReactFlow().fitView({ nodes: [...] })`. If the target no longer exists in the room, render a muted `target deleted` chip instead (invariant 14) — no navigation.
5. **Status feed unchanged:** `ai-status-feed` remains transient Liveblocks-only state (phases are ephemeral, not conversation).

## Data Flow

User send → POST → Postgres row → Liveblocks broadcast → all clients append. AI task → lib helper → same path. Reload → GET rebuilds the thread from Postgres exactly.

## Error Handling

- POST validation failures → 400 with field errors; optimistic message rolls back.
- Broadcast failure after persist: message appears for others on next GET; log only.
- Target resolution is render-time and lazy — deleted targets never block message rendering.

## Scope Limits

- No message editing/deletion, no reactions, no nested replies (threading = target references only).
- No backfill of historical feed-only messages.
- Clarify/review message *production* belongs to specs 45/46; this unit only renders the types.

## Check When Done

- Messages persist across reload and across browsers; two clients see each other's messages live.
- Threaded messages navigate to their canvas element; deleted targets degrade gracefully.
- Design-agent completions appear as durable AI messages.
- `npx tsc --noEmit`, touched-file ESLint, `npm run build` pass.
