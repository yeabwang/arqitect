# 50 — Spec History, Staleness, Compare, and Sharing

> Phase E of `34-full-dev.md`. Depends on: 49.

## Goal

Make regeneration a normal, fast workflow (product goal 9): the Artifacts tab shows version history with staleness signals, side-by-side compare, download, and read-only share links so artifacts leave Arqitect and reach implementation (outcome criterion 18).

## Current State

Specs tab lists `ProjectSpec` rows with preview dialog + download (`react-markdown` rendering, private-blob streaming). No versions surfaced, no staleness, no compare, no share.

## Implementation

1. **Artifacts tab** (`components/editor/artifacts/artifacts-tab.tsx`, absorbing the current SpecsTab):
   - Header action: `Generate spec` (fires the 49 flow incl. gate dialog).
   - Spec list rows: `v{version}` mono badge, created date + author, low-confidence count from `generationContext`, and a **staleness chip** — `Canvas changed since v{n}` when `Project.currentSnapshotId !== spec.canvasSnapshotId` (computed in the list route; only meaningful for the latest version). Latest row gets a `Regenerate` shortcut.
   - Row actions: `Preview` (existing dialog), `Download`, `Compare`, `Share`.
   - Handoff briefs section below (filled by 51).
2. **List route update** `GET /api/projects/[projectId]/specs`: return `version`, `createdAt`, `createdById` (+ resolved display name), `generationContext` summary fields, `isStale` for the latest. Content still never inlined.
3. **Compare** (`spec-compare-dialog.tsx`): pick two versions (default latest vs previous); full-screen dialog rendering both Markdown documents side-by-side in synchronized `ScrollArea`s with version headers. No semantic diffing at launch (deferred per 34 §6) — the side-by-side answers "what changed at a glance" cheaply.
4. **Share links:**
   - Prisma `share-link.prisma`: `ShareLink` `{id cuid, token String @unique (32-byte url-safe random), projectId FK cascade, specId? FK, handoffId? FK, createdById, revokedAt?, createdAt}` — exactly one of specId/handoffId set (validated in code). Delegate guard update.
   - Routes: `POST /api/projects/[projectId]/specs/[specId]/share` (auth; returns existing non-revoked link or creates one; `{url}`), `DELETE` to revoke. `ProjectActivity` row on create.
   - Public page `app/share/[token]/page.tsx` (excluded from auth protection in `proxy.ts`): server component resolving the token → non-revoked link → streams the blob server-side → renders read-only Markdown (reuse the preview renderer extracted to `components/shared/markdown-document.tsx`) with a minimal header (project name, `Spec v{n}`, generated date, Arqitect wordmark) and **no project navigation**. Unknown/revoked tokens → minimal not-found state.
   - Share dialog: copy-link with `Copied!` feedback (pattern from the share-project dialog), revoke action, and the warning copy "Anyone with this link can read this spec version."
5. **Download** unchanged (existing route); add `Copy as Markdown` to the preview dialog (clipboard write of the fetched text) — the sysdesai-parity affordance for pasting into coding agents pre-handoff.

## Error Handling

- Share-page blob fetch failure → 502-shaped friendly error, never a stack.
- Compare with a missing/corrupt version isolates the failing pane.

## Scope Limits

- Share links are read-only, unauthenticated, per-version; no expiry, no password (revoke covers retraction). Note in `architecture-context.md`.
- No semantic diff, no spec deletion, no spec editing.
- Handoff sharing reuses the same model but ships with 51.

## Check When Done

- Versions list with staleness; regenerate produces v(n+1) and clears the chip; compare renders two versions side-by-side.
- Share link opens the spec logged-out; revoke kills it; copy-markdown works.
- Migration applied; `npx tsc --noEmit` and `npm run build` pass.
