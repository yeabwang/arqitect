# 35 — Canvas Metadata Contract (v1)

> Phase A of `34-full-dev.md`. Depends on: nothing. Blocks: 36, 43, 44, 47, 52, 53.

## Goal

Implement the v1 node/edge metadata contract from `context/architecture-context.md` as shared types, zod schemas, and canvas data extensions, so metadata can flow through React Flow + Liveblocks like any other canvas change and be consumed by AI tasks and the spec compiler.

## Current State

- `types/canvas.ts` defines `CanvasNodeData = {label, color, shape}` and `CanvasEdgeData = {label?}` — no metadata.
- The metadata contract exists only as documentation in `architecture-context.md`.

## Implementation

1. **Create `types/canvas-metadata.ts`** with the v1 contract:
   - Node enums: `COMPONENT_TYPES` (`service, datastore, queue, cache, client, external, job, gateway, other`), `PERSISTENCE_ROLES` (`system_of_record, cache, derived, ephemeral, none`), `LIFECYCLE_STATUSES` (`existing, new, deprecated, planned`), `CONFIDENCE_LEVELS` (`high, medium, low`).
   - Edge enums: `EDGE_PROTOCOLS` (`http, grpc, message_bus, database, file, websocket, sse, other`), `INTERACTION_MODES` (`sync, async, batch, streaming`), `FAILURE_BEHAVIORS` (`retry, dead_letter, fail_open, fail_closed, undefined`), `SECURITY_SENSITIVITIES` (`public, internal, sensitive, regulated`).
   - `NodeMetadataV1` interface: `componentType?, responsibility?, owner?, runtime?, persistenceRole?, securityBoundary?, externalDependency?, lifecycleStatus?, confidence?, storageEngine?, notes?` — all optional per the schema rules ("optional on individual nodes to keep editing fluid, but the schema itself is fixed and validated").
   - `EdgeMetadataV1` interface: `protocol?, interactionMode?, dataExchanged?, producerRole?, consumerRole?, failureBehavior?, securitySensitivity?, confidence?, notes?`.
   - Zod schemas `nodeMetadataSchema` / `edgeMetadataSchema` (strict object, all fields optional, enums validated) and `parseNodeMetadata` / `parseEdgeMetadata` helpers that return a clean object or `undefined` for malformed input (never throw at render boundaries).
   - Helpers:
     - `emptyNodeMetadata()` / `emptyEdgeMetadata()`.
     - `nodeMetadataCompleteness(meta)` / `edgeMetadataCompleteness(meta)` → `{ filled: number, total: number, missing: string[] }` counting non-empty v1 fields (exclude `notes` and `storageEngine` from the total — they are contextual, not completeness signals).
     - `isLowConfidence(meta)` → true when `confidence === "low"` or `confidence` is unset.
2. **Extend `types/canvas.ts`:** `CanvasNodeData` gains `metadata?: NodeMetadataV1`; `CanvasEdgeData` gains `metadata?: EdgeMetadataV1`. Both remain `Record<string, unknown>`-compatible so existing Liveblocks state and saved canvases parse unchanged (metadata simply absent on old nodes).
3. **Snapshot compatibility:** `app/api/projects/[projectId]/canvas/route.ts` GET/PUT payload validation must accept nodes/edges with or without `metadata` (validation is `passthrough` today — confirm, do not tighten in a way that drops metadata).
4. **Update `context/architecture-context.md`** edge `protocol` enum (+`websocket`, `sse`) and node metadata table (+`storageEngine`, optional, datastore-oriented) — these are the research-approved v1 amendments (research brief 02 §4).
5. **Tests:** `types/canvas-metadata.test.ts` covering schema acceptance/rejection, completeness math, low-confidence detection, and that a legacy node datum (`{label,color,shape}`) parses with `metadata` undefined.

## Error Handling

- Malformed metadata from the room or a saved blob never crashes a renderer: parse helpers return `undefined` and the UI treats the element as metadata-empty.
- Unknown enum values (e.g. from a future schema version) are stripped by parsing, not persisted back.

## Scope Limits

- No UI in this unit (spec 36 owns the inspector).
- No v2 fields (`scalingConcern`, `costSensitivity`, `complianceTags`, latency/throughput/idempotency).
- No relational mirror of metadata — it lives inside canvas state and snapshots only (storage rule in `architecture-context.md`).
- Do not change node rendering, autosave, or the design agent in this unit.

## Check When Done

- Types, schemas, and helpers exist and are exported from `types/canvas-metadata.ts`.
- `CanvasNodeData`/`CanvasEdgeData` carry optional metadata; existing canvases load unchanged.
- `architecture-context.md` reflects the enum amendments.
- `npx tsx --test types/canvas-metadata.test.ts`, `npx tsc --noEmit`, and `npm run build` pass.
