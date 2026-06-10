# 38 — Design Data Foundation (Prisma)

> Phase A of `34-full-dev.md`. Depends on: nothing (parallel with 35/37). Blocks: 39–51. Schema only — no routes, no UI.

## Goal

Add every relational model the design ladder needs in one migration unit, so later specs ship behavior without schema churn: durable conversation, the reasoning layer (decisions/assumptions/risks/open questions), unified review items, the requirements document, typed design sections (the "book"), handoff briefs, activity log, and spec-version linkage.

## Current State

Models: `Project`, `ProjectCollaborator`, `ProjectInvitation`, `ProjectSpec` (id/projectId/filePath/createdAt only), `TaskRun`, `PendingGeneration`. Nothing for conversation, reasoning entities, review, sections, or handoffs.

## Implementation

One Prisma model file per entity (kebab-case singular, per code standards), one migration. Shared conventions: `id` cuid PK, `projectId` FK with `onDelete: Cascade`, `createdAt`/`updatedAt` timestamps, `@@index([projectId, createdAt])` unless noted. `source` enums use `HUMAN | AI | TEMPLATE` (templates seed entities at import, spec 53). Soft canvas references are `targetKind` + `targetId` string columns — never FKs (invariant 14).

1. **`conversation-message.prisma` — `ConversationMessage`:** `authorId` String (Clerk id or `"arqitect"`), `authorType` enum (`HUMAN, AI, SYSTEM`), `messageType` enum (`USER, AI_CLARIFY, AI_REVIEW, SYSTEM`), `content` String, `targetKind` enum? (`PROJECT, NODE, EDGE, DECISION, ASSUMPTION, RISK, OPEN_QUESTION, REVIEW_ITEM, MESSAGE`), `targetId` String?, `runId` String?.
2. **`project-decision.prisma` — `ProjectDecision`:** `title`, `context` String?, `optionsConsidered` Json? (string[]), `decision` String, `rationale` String?, `alternativesRejected` String?, `status` enum (`PROPOSED, ACCEPTED, SUPERSEDED`), `source`, `authorId`, `links` Json? (array of `{kind, id}`).
3. **`project-assumption.prisma` — `ProjectAssumption`:** `title`, `description` String?, `confidence` enum (`HIGH, MEDIUM, LOW`), `status` enum (`ACTIVE, VALIDATED, INVALIDATED`), `isDefault` Boolean @default(false) (analyst-proposed default vs user-stated — research brief 01 §4.7), `source`, `authorId`, `links` Json?.
4. **`project-risk.prisma` — `ProjectRisk`:** `title`, `description` String?, `severity` enum (`INFO, SUGGESTION, BLOCKER`), `likelihood` enum (`LOW, MEDIUM, HIGH`), `status` enum (`OPEN, MITIGATED, ACCEPTED, RESOLVED`), `source`, `authorId`, `links` Json?.
5. **`project-open-question.prisma` — `ProjectOpenQuestion`:** `title`, `description` String?, `status` enum (`OPEN, RESOLVED, INTENTIONALLY_OPEN`), `proposedDefault` String? (labeled default, never auto-applied), `category` String? (fr/nfr/extended/scope/constraint/scale — free string at launch), `source`, `authorId`, `resolvedById` String?, `resolution` String?, `links` Json?. `@@index([projectId, status])` (gating queries).
6. **`project-review-item.prisma` — `ProjectReviewItem`:** `title`, `description` String?, `source` (`HUMAN, AI`), `severity` enum (`INFO, SUGGESTION, BLOCKER`), `status` enum (`OPEN, RESOLVED, DISMISSED`), `assigneeId` String?, `resolverId` String?, `resolutionReason` String?, `targetKind` (same enum as messages), `targetId` String?, `runId` String?, `authorId`. `@@index([projectId, status, severity])` (gating).
7. **`requirements-document.prisma` — `RequirementsDocument`:** `projectId` @unique (one per project), `content` Json (schema owned by spec 42 / `types/requirements.ts`), `status` enum (`DRAFT, VALIDATED, SIGNED_OFF`), `version` Int @default(1).
8. **`design-section.prisma` — `DesignSection`:** `phase` enum (`REQUIREMENTS, HLD, LLD`), `sectionType` String (registry key: `tech-stack`, `deployment`, `capacity-estimation`, `scalability-resilience`, `api-surface`, `data-model`, `api-contract`, `sequence-flow`, `state-machine`, `class-model`, `interfaces`, `error-handling`, `design-patterns` — validated in code, not the DB), `targetNodeId` String? (LLD chapter key), `title`, `content` Json, `confidence` enum (`HIGH, MEDIUM, LOW`), `source`, `version` Int @default(1), `staleAt` DateTime?, `runId` String?. `@@index([projectId, phase])`, `@@index([projectId, targetNodeId])`.
9. **`handoff-brief.prisma` — `HandoffBrief`:** `specId` FK → `ProjectSpec` (Restrict delete), `filePath` String, `createdById` String.
10. **`project-activity.prisma` — `ProjectActivity`:** `actorId` String, `kind` String (e.g. `collaborator_added`, `invitation_accepted`, `spec_generated`, `handoff_generated`, `review_resolved`), `detail` Json?. Writes wired opportunistically by later specs; collaborator routes start logging in this unit (the access-change invariant).
11. **Extend `ProjectSpec`** (`project-spec.prisma`): `version` Int @default(1), `canvasSnapshotId` String?, `conversationCursor` String? (last included `ConversationMessage` id), `generationContext` Json?, `createdById` String?, plus `@@unique([projectId, version])` so concurrent generations can never mint the same version number (spec 49 assigns transactionally). Existing rows backfill via migration defaults — if a project already has multiple rows, backfill sequential versions by `createdAt` order in the migration so the unique constraint applies cleanly.
12. **Extend `TaskRun`** (`task-run.prisma`): `taskKind` String? (e.g. `design`, `spec`, `review`, `clarify`, `lld`, `hld-sections`, `handoff`) + `@@index([projectId, taskKind, createdAt])` — the ledger for the per-project AI rate cap (34 §5 rule 9). Existing rows stay null (excluded from caps).
13. **`lib/prisma.ts`:** extend `REQUIRED_PRISMA_DELEGATES` with all new delegates; update `lib/prisma.test.ts` fixture.
14. **Collaborator/invitation routes** write `ProjectActivity` rows on add/remove/accept/deny (small, contained change proving the table).

## Scope Limits

- No CRUD routes (40/41), no conversation wiring (39), no UI.
- No `RequirementsDocument.content` zod schema here (42 owns it) — the column is opaque Json.
- No join table for links; `links` Json stays until a feature needs reverse queries (documented decision in 34 §3.2).

## Check When Done

- `npx prisma validate`, `npx prisma generate`, migration SQL committed (note deploy requirement), delegate guard + test updated.
- Collaborator add/remove and invitation accept/deny produce `ProjectActivity` rows.
- `npx tsc --noEmit` and `npm run build` pass.
