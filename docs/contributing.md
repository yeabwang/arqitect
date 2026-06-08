# Contributing

## Required Reading

Before implementation or architecture decisions, read these in order:

1. `context/project-overview.md`
2. `context/architecture-context.md`
3. `context/ui-context.md`
4. `context/code-standards.md`
5. `context/ai-workflow-rules.md`
6. `context/progress-tracker.md`

`AGENTS.md` also requires checking relevant Next.js guides under `node_modules/next/dist/docs/` before writing Next.js code. This repo uses Next.js 16 conventions, including `proxy.ts`.

## Change Rules

- Keep changes scoped to one subsystem.
- Default to React Server Components.
- Add `"use client"` only for browser interactivity, hooks, or real-time state.
- Keep long-running AI work in `trigger/`, not route handlers.
- Validate external input at API boundaries.
- Enforce project access before mutations.
- Use existing CSS tokens from `app/globals.css`; avoid raw colors in components.
- Do not edit `components/ui/*` unless the task explicitly asks for foundation component changes.
- New files use lowercase kebab-case unless Next.js requires a convention filename.

## Documentation Rules

- Update `context/progress-tracker.md` after meaningful implementation changes.
- Update relevant context docs when architecture, scope, or standards change.
- Keep developer docs short and current. Prefer exact file paths and implemented behavior.

## Verification

Use the smallest check that proves the change, then run broader checks for shared behavior.

```bash
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

There is no `npm test` script. Existing `.test.ts` files use `node:test`.
