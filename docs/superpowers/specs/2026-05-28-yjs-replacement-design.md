# Replace Liveblocks with React Flow + Yjs + Hocuspocus

**Status:** Approved (2026-05-28)
**Trigger:** `context/feature_specs/31-reactflow_yjs.md`

## Goal

Remove all Liveblocks usage. Replace realtime canvas sync, presence, room events, and feeds with Yjs (CRDT) over Hocuspocus (WebSocket server). React Flow stays. Every feature currently working through Liveblocks must keep working: collaborative node/edge editing, live cursors, presence avatars, AI ghost cursor, AI status pills, chat feed, undo/redo, AI mutations from Trigger.dev tasks, canvas persistence.

## Non-goals

- Changing canvas UX, shape set, node/edge schema, toolbar, AI prompts, spec format.
- Migrating existing Vercel Blob canvas snapshots to a new format. Old snapshots are JSON `{nodes, edges}`; new persistence stores raw Y.Doc updates. Migration handled on load (parse JSON → seed Y.Doc once; subsequent saves are Y updates).
- Replacing Trigger.dev, Clerk, Prisma, Blob, or React Flow.

## Architecture

```
Browser (Next.js)                   Hocuspocus WS server                Vercel Blob
─────────────────                   ────────────────────                ──────────
@hocuspocus/provider  ──── WS ───▶  Y.Doc per roomId                   canvas/{roomId}.bin
  ├─ y-doc                           ├─ onLoadDocument  ◀───── read ───┤
  ├─ awareness                       ├─ onStoreDocument ────── write ─▶│
  └─ UndoManager                     ├─ onAuthenticate
                                     └─ awareness merging
Trigger.dev task     ──── WS ───▶  same room (system JWT)
```

One Y.Doc per project room. `roomId` = existing project slug already routed at `/editor/[roomId]`.

## Y.Doc schema

| Key | Type | Purpose |
|-----|------|---------|
| `nodes` | `Y.Map<id, CanvasNode>` | Synced React Flow nodes. Value is plain object using existing `CanvasNode` shape. |
| `edges` | `Y.Map<id, CanvasEdge>` | Synced React Flow edges. |
| `chat` | `Y.Array<AiChatMessagePayload>` | Persisted chat feed. Replaces Liveblocks `ai-chat` feed. |
| `status` | `Y.Array<AiStatusFeedPayload>` | Persisted AI status log. Replaces Liveblocks `ai-status-feed` feed. |

Awareness state per connected client:

```ts
type AwarenessState = {
  user: { id: string; name: string; avatarUrl: string; color: string; cursorColor: string };
  cursor: { x: number; y: number } | null;
  thinking: boolean;
  aiRunId: string | null;   // present only for system (AI) clients
  kind: "user" | "system";
};
```

`aiRunId` non-null marks an AI ghost cursor. Replaces the existing `ai:presence` `RoomEvent`.

## Files

### New

- `server/yjs/index.ts` — Hocuspocus entrypoint. Boots `Server.configure({ port: YJS_PORT, extensions: [BlobDatabase, Logger] })`. Custom `onAuthenticate` calls `verifyConnectionToken`.
- `server/yjs/auth.ts` — `signConnectionToken(payload, ttl)` + `verifyConnectionToken(token, documentName)` using `jose` HS256, secret `YJS_JWT_SECRET`. Token payload `{ userId, roomId, kind: "user" | "system", iat, exp }`.
- `server/yjs/blob-database.ts` — Hocuspocus `Database` extension subclass. `fetch({ documentName })` HEADs/fetches Blob `canvas/{documentName}.bin`; returns binary Y update or `null`. On `null` returns, also attempts legacy `canvas/{documentName}.json` and, if found, parses it and seeds the Y.Doc on first store (handled inside extension `onLoadDocument` hook). `store({ documentName, state })` puts raw `Y.encodeStateAsUpdate` bytes back to Blob (`access: "public"`, `contentType: "application/octet-stream"`, `allowOverwrite: true`, `addRandomSuffix: false`). Built-in Hocuspocus debounce set to 1500 ms (matches existing autosave cadence).
- `lib/yjs/doc-schema.ts` — Y.Doc key constants and runtime guards. Re-exports `AiChatMessagePayload`, `AiStatusFeedPayload` from `types/tasks.ts`.
- `lib/yjs/provider.tsx` — `<YjsRoomProvider roomId>` React context. Lazy-creates `Y.Doc`, `Awareness`, and `HocuspocusProvider`. Fetches connection token from `POST /api/yjs/token`, refreshes on 401 disconnect. Suspense fallback while initial `sync` event pending; error fallback on `connection-error`. Exposes `useYDoc()`, `useAwareness()`, `useProvider()` hooks.
- `lib/yjs/use-yjs-flow.ts` — Replaces `useLiveblocksFlow`. Observes `nodes`/`edges` Y.Maps via `observeDeep`, materializes React state arrays, returns `[nodes, edges, onNodesChange, onEdgesChange, onConnect]`. Mutations wrap in `doc.transact(fn, localOriginRef.current)` so the Y.UndoManager filter works. Adds/removes/changes use `Y.Map.set` / `Y.Map.delete`. `onConnect` adds an edge via shared `addEdge` helper, injects the custom type + marker (mirrors current Liveblocks wrapper) and writes the new edge into `edges` map.
- `lib/yjs/use-awareness.ts` — `useLocalAwareness()` returns `(patch) => awareness.setLocalStateField(...)` plus current value. `useOthersAwareness(selector)` subscribes to `awareness.on("change", ...)` and returns the latest snapshot of other clients (filtered to exclude local clientID). `useAiPresence()` returns the single system client's state or null. All hooks read identity from Clerk's `useUser()` and seed the local `user` field on mount.
- `lib/yjs/use-undo.ts` — `useYjsUndo()`. Builds one `Y.UndoManager` per provider mount, tracking `nodes` and `edges` maps, `trackedOrigins: new Set([localOrigin])`. Returns `{ undo, redo, canUndo, canRedo }`. Subscribes to manager's `stack-item-added` / `stack-item-popped` events to recompute can-flags.
- `lib/yjs/use-feed.ts` — `useYjsFeed<T>(key: "chat" | "status")` returns `{ messages: T[], append: (msg: T) => void }`. Observes the Y.Array, returns the materialized snapshot, push wraps in `doc.transact`.
- `lib/yjs/system-client.ts` — Server-side helper used by Trigger tasks. `withSystemDoc(roomId, fn)`:
  1. mints system JWT (`kind: "system", roomId`) with 10-min TTL via `signConnectionToken`,
  2. opens `HocuspocusProvider` with `WebSocket: ws.WebSocket` (Node), `token`, `name: roomId`,
  3. awaits initial `synced` event,
  4. constructs `{ doc, awareness, status: Y.Array, chat: Y.Array, nodes: Y.Map, edges: Y.Map }`,
  5. invokes `fn` with that scope,
  6. on resolve, awaits `provider.flush()` and disconnects.
- `app/api/yjs/token/route.ts` — `POST { roomId: string }`. Runs `getCurrentProjectIdentity()` + `getProjectWithAccess(roomId, identity)`. Issues 5-minute user JWT via `signConnectionToken`. Returns `{ token, expiresAt }`. 401 if unauthenticated. 403 / 404 if no access (match existing helper).
- `types/yjs.ts` — `AwarenessState`, `LocalOrigin`, room key string-literal union, `SYSTEM_USER` constant `{ id: "arqitect", name: "Arqitect", avatarUrl: "", color: "#8b82ff", cursorColor: "#8b82ff" }`.

### Deleted

- `liveblocks.config.ts`
- `lib/liveblocks.ts`
- `app/api/liveblocks-auth/route.ts`
- `hooks/useCanvasAutosave.ts` (Hocuspocus persists; debounced server-side)
- `app/api/projects/[projectId]/canvas/route.ts` — only callers are `components/editor/canvas-workspace.tsx` and `hooks/useCanvasAutosave.ts`, both deleted/rewritten. Spec generation already reads `nodes`/`edges` from POST body, not this route.

### Updated

| File | Change |
|------|--------|
| `components/editor/canvas-workspace.tsx` | Swap `RoomProvider`/`useLiveblocksFlow` for `<YjsRoomProvider>` + `useYjsFlow`. Swap `useUndo`/`useRedo`/`useCanUndo`/`useCanRedo` for `useYjsUndo()`. Swap `useUpdateMyPresence` for `useLocalAwareness().setLocalStateField("cursor", ...)`. Delete Blob load-on-mount block and autosave wiring. Keep React Flow event handlers, shape DnD, template import, copy/paste/cut/select-all/keyboard shortcuts. Keep `proOptions.hideAttribution`. |
| `components/editor/presence-cursors.tsx` | `useOthers` → `useOthersAwareness(s => s.filter(c => c.cursor && c.kind === "user"))`. Same render. |
| `components/editor/presence-avatars.tsx` | `useOthers` → `useOthersAwareness(s => s.filter(c => c.kind === "user"))`. |
| `components/editor/ai-presence-layer.tsx` | `useEventListener("ai:presence", ...)` → `useAiPresence()`. Removes the 8-second auto-expiry (no longer needed; awareness disconnect = AI gone). Keep ghost cursor + Bot badge + "thinking…" chip. |
| `components/editor/ai-sidebar.tsx` | `useFeedMessages(AI_CHAT_FEED_ID)` / `useCreateFeed` / `useCreateFeedMessage` → `useYjsFeed("chat")`. `useFeedMessages(AI_STATUS_FEED_ID)` → `useYjsFeed("status")`. `useUpdateMyPresence({ thinking })` → `useLocalAwareness().setLocalStateField("thinking", ...)`. `useRealtimeRun` (Trigger) and the `/api/ai/design` POST path unchanged. |
| `trigger/design-agent.ts` | Drop `@liveblocks/node` and `@liveblocks/react-flow/node`. Wrap full task body in `withSystemDoc(roomId, async ({ doc, awareness, nodes, edges, status }) => { ... })`. Status broadcasts → `status.push([payload])`. Each AI action: `doc.transact(() => nodes.set(id, node) / edges.set(...) / nodes.delete(...) / edges.delete(...), "system")`. AI cursor between actions → `awareness.setLocalState({ kind: "system", user: SYSTEM_USER, cursor: {x,y}, thinking, aiRunId })`. Final completion message → push assistant message to `chat` array. `finally` clears AI awareness state. |
| `trigger/generate-spec.ts` | Same `withSystemDoc` wrapper for status feed publishing (starting → thinking → complete / error). Does not write to `nodes`/`edges`. |
| `app/api/projects/route.ts`, `app/api/projects/[projectId]/route.ts` | Keep returning `canvasJsonPath` field for response shape compatibility (no client reads it after this migration; field stays in DB for legacy cleanup-on-delete). No code change required unless lint complains. |
| `components/editor/canvas-node.tsx`, `canvas-edge.tsx` | No logic change. Only removed if they imported Liveblocks CSS — they currently don't import any Liveblocks symbols themselves; verify Grep hit was a false positive (likely from a shared types import). |
| `app/globals.css` | Drop `@liveblocks/react-flow/styles.css`, `@liveblocks/react-ui/styles.css` imports if present. |
| `types/tasks.ts` | No change — payload schemas still used by feed payloads. |
| `package.json` | Remove: `@liveblocks/client`, `@liveblocks/node`, `@liveblocks/react`, `@liveblocks/react-flow`, `@liveblocks/react-ui`. Add: `yjs`, `y-protocols`, `@hocuspocus/server`, `@hocuspocus/provider`, `@hocuspocus/extension-database`, `ws`, `@types/ws` (dev), `jose`. Add scripts: `"yjs:dev": "tsx server/yjs/index.ts"`, `"yjs:start": "node --import tsx server/yjs/index.ts"`. |

## Auth flow

1. Client mounts `<YjsRoomProvider roomId>`.
2. Provider `POST /api/yjs/token` with `{ roomId }`.
3. Route: Clerk auth + `getProjectWithAccess(roomId, identity)`. Returns `{ token, expiresAt }`.
4. Provider opens WS to `NEXT_PUBLIC_YJS_URL`, passes `token` and `name: roomId` to `HocuspocusProvider`.
5. Hocuspocus `onAuthenticate({ token, documentName })` → `verifyConnectionToken(token, documentName)` → asserts `payload.roomId === documentName`. Rejects on mismatch / expiry.
6. Trigger task uses `signConnectionToken({ userId: "system", roomId, kind: "system" })` minted in-process with the same secret. Same `onAuthenticate` accepts.

`YJS_JWT_SECRET` lives in `.env.local` for dev, environment in deploy. Same secret shared between Next.js process, Hocuspocus process, and Trigger.dev environment.

## Undo / redo

`Y.UndoManager(new Set([nodes, edges]), { trackedOrigins: new Set([localOrigin]) })`. `localOrigin` is the user's Clerk ID. Each local mutation runs in `doc.transact(fn, localOrigin)`. Remote and system origins are not tracked, so other users' edits and AI mutations are not undoable from the local stack — matches current Liveblocks behavior.

## Persistence

`BlobDatabase` (Hocuspocus `Database` extension):

- `fetch({ documentName })`:
  1. Try `head("canvas/{documentName}.bin")`. If found, GET bytes, return `Uint8Array`.
  2. Else try legacy `head("canvas/{documentName}.json")`. If found, GET, parse as `{nodes, edges}`, build temp Y.Doc, seed `nodes`/`edges` Y.Maps from the JSON, return `Y.encodeStateAsUpdate(tempDoc)`.
  3. Else return `null` (Hocuspocus creates empty doc).
- `store({ documentName, state })`: `put("canvas/{documentName}.bin", state, { access: "public", contentType: "application/octet-stream", allowOverwrite: true, addRandomSuffix: false })`.
- Hocuspocus built-in debounce: `debounce: 1500, maxDebounce: 10000`.

Snapshot URL stored on the Project row (`canvasJsonPath`) becomes informational (kept for backward compat / deletion on project delete). New saves use deterministic key `canvas/{roomId}.bin`; no DB update needed per-save.

## Dev workflow

```
npm run dev           # Next.js
npm run trigger:dev   # Trigger.dev local dev
npm run yjs:dev       # Hocuspocus on YJS_PORT (default 1234)
```

Env vars added (`.env.local`):

```
YJS_PORT=1234
YJS_JWT_SECRET=<32+ random bytes>
NEXT_PUBLIC_YJS_URL=ws://localhost:1234
```

Production env adds:

```
NEXT_PUBLIC_YJS_URL=wss://yjs.<domain>
YJS_JWT_SECRET=<production secret>
BLOB_READ_WRITE_TOKEN=<existing>
```

Trigger.dev environment requires `YJS_JWT_SECRET` and `NEXT_PUBLIC_YJS_URL` (or a server-side `YJS_INTERNAL_URL` if Hocuspocus is reachable on a private network).

## Deployment

- Hocuspocus runs as a separate Node service. Recommended hosts: Fly.io, Render, Railway. Single instance per region.
- Vercel hosts Next.js. Trigger.dev tasks run in Trigger.dev cloud and reach Hocuspocus over the public URL.
- TLS terminated at the WS hostname (`wss://`).
- Vertical scaling: single instance handles thousands of concurrent rooms; horizontal scaling requires sticky routing per `documentName` (out of scope — single-instance is sufficient for current product stage).

## Verification (golden path)

After implementation:

1. Open same room in two browsers as two different Clerk users.
2. Create a node in A → appears in B within ~150 ms. Move it in B → A reflects.
3. Local cursor moves in A → cursor + name badge appear in B (colored from `cursorColor`).
4. Avatar pill in B shows A.
5. Undo in A undoes A's own move only; A's undo does not revert B's edits.
6. AI prompt sent from A → status pill animates through `starting → thinking → applying → complete`; AI ghost cursor visible in both browsers; new nodes appear synced; assistant chat bubble appears in both.
7. A reloads → nodes, edges, chat, status all rehydrate (Hocuspocus → Blob round-trip).
8. Project with pre-migration `canvas/{id}.json` snapshot: first room load seeds Y.Doc from legacy JSON; subsequent saves write `.bin`.
9. Spec generation reads current canvas via existing POST body, writes spec to Blob — unchanged.
10. `rg "liveblocks|@liveblocks" --type ts --type tsx app components lib hooks trigger server types` returns no matches.
11. `npm run build`, `npx tsc --noEmit`, `npm run lint` pass.

## Risks

- Hocuspocus is OSS-MIT and self-hosted; ops responsibility (process supervision, TLS) is on you.
- Blob round-trip on cold doc load adds ~100–300 ms; matches current autosave-load path.
- Cross-region latency to Hocuspocus drives perceived canvas latency. Pick the host region closest to the user base.
- Legacy JSON snapshot migration path runs once per room on first post-migration load; verify it doesn't double-seed by checking `nodes.size === 0 && edges.size === 0` before seeding.

## Out of scope

- Multi-instance Hocuspocus + sticky routing.
- Real-time multi-region replication.
- Migrating chat / status history that lived in Liveblocks Feeds — current rooms keep their canvas, lose prior chat (acceptable; chat is volatile context).
- Versioned canvas snapshots / time travel beyond the local undo stack.
