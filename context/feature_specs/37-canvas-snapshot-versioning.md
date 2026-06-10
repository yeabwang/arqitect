# 37 — Versioned Canvas Snapshots

> Phase A of `34-full-dev.md`. Depends on: nothing (parallel with 35). Blocks: 43, 49, 50, 51.

## Goal

Implement invariant 11: append-only, immutable canvas snapshots with a Postgres pointer, written on a defined cadence — so spec versions can link to the exact canvas state they were generated from and history is reconstructable.

## Current State

- Autosave (`hooks/useCanvasAutosave.ts` + `PUT /api/projects/[projectId]/canvas`) overwrites a single blob `canvas/{projectId}.json` and stores its URL in `Project.canvasJsonPath`. No history exists.

## Implementation

1. **Prisma model `prisma/models/canvas-snapshot.prisma`:**
   - `CanvasSnapshot`: `id` cuid PK, `projectId` FK cascade, `blobPath` String, `trigger` enum `SnapshotTrigger` (`checkpoint, manual, spec_generation, handoff_generation, design_generation, template_import`), `createdById` String? (null for system/task writes), `nodeCount` Int, `edgeCount` Int, `createdAt`; `@@index([projectId, createdAt])`.
   - `Project` gains `currentSnapshotId String?` and the inverse relation. Extend `REQUIRED_PRISMA_DELEGATES` in `lib/prisma.ts` with `canvasSnapshot`. Commit migration; note `npx prisma migrate deploy` requirement.
2. **Create `lib/canvas-snapshots.ts`:**
   - `writeCanvasSnapshot({ projectId, payload, trigger, createdById? })` — validates `{nodes, edges}` shape, creates the row first, uploads to `canvas/{projectId}/{snapshotId}.json` (`access: "private"`, `contentType: "application/json"`, `addRandomSuffix: false`, `allowOverwrite: false` — immutability enforced at the blob layer), updates `blobPath` + `Project.currentSnapshotId`, returns the row. On upload failure, delete the orphan row and rethrow.
   - `readCanvasSnapshot(snapshotId)` — loads the row, streams the private blob (same SDK `get(..., { access: "private" })` pattern as the spec download route), parses, returns `{nodes, edges}`.
   - `readLatestSnapshot(projectId)` convenience.
3. **Cadence wiring** (per `architecture-context.md` Canvas Snapshot Cadence):
   - **Generation starts** (spec/handoff/design tasks) call `writeCanvasSnapshot` from their API routes/tasks — wired in specs 43/49/51; this unit only exposes the helper.
   - **Periodic checkpoint during active editing:** extend `useCanvasAutosave` with a second timer — after a successful debounced working-copy save, if ≥5 minutes have passed since the last checkpoint and the payload differs from the last checkpointed payload, `POST /api/projects/[projectId]/snapshots` with `trigger: "checkpoint"`. Track the last-checkpoint timestamp in a ref.
   - **Explicit user save:** the navbar save-status pill becomes clickable ("Save snapshot") and fires a `manual` snapshot; show the existing saved/error states.
   - **Template import:** wired in spec 53.
   - The existing 1.5 s working-copy autosave to `canvas/{projectId}.json` is unchanged — it remains the fast-restore path. Document this split in `architecture-context.md` (working copy = mutable restore cache; snapshots = immutable history).
4. **API `app/api/projects/[projectId]/snapshots/route.ts`:**
   - `POST` — auth via `getCurrentProjectIdentity` + `getProjectWithAccess`; body `{ nodes, edges, trigger }` (trigger restricted to `checkpoint | manual` from clients); calls `writeCanvasSnapshot`; returns `{ snapshotId, createdAt }`.
   - `GET` — lists snapshots `{ id, trigger, nodeCount, edgeCount, createdAt }` ordered desc, capped at 50. Content is never returned from list.
5. **Retention:** none at launch — historical snapshots are retained so spec versions remain reproducible (invariant). Note storage growth as an accepted cost in `architecture-context.md`.

## Error Handling

- Checkpoint POST failures are silent-retry-next-interval (do not surface to the user; working-copy autosave already covers data safety). Manual save failures surface via the existing save-status error state.
- `readCanvasSnapshot` of a missing/corrupt blob throws a typed error callers convert to 404/502.

## Scope Limits

- No snapshot browsing/restore UI (spec 50 surfaces snapshot links on spec versions; full restore is post-launch).
- No deletion or retention policy.
- Do not change Liveblocks room state handling or the working-copy autosave contract.

## Check When Done

- Editing for >5 minutes produces checkpoint rows; manual save produces a `manual` row; blobs exist at `canvas/{projectId}/{snapshotId}.json` and a second write to the same path fails (immutability).
- `Project.currentSnapshotId` tracks the latest; GET lists history.
- Migration applied; delegate guard updated; `npx tsc --noEmit` and `npm run build` pass.
