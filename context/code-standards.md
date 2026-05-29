# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, or real-time state.
- Keep route handlers focused on a single responsibility.
- Long-running work belongs in background tasks, not in request handlers.

## Styling

- Use CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, etc.
- Maintain the border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards, `rounded-3xl` for modals.
- Do not define one-off color, shadow, border, font, or animation values inside components when the value represents reusable visual language. Add or reuse a centralized token in `app/globals.css`, then reference it through Tailwind or `var(--token-name)`.
- Component-level arbitrary values are allowed only for local layout geometry that is not part of the design system, such as `max-w`, grid tracks, fixed canvas preview dimensions, or transform offsets.
- If a new recurring surface, state, accent, shadow, or canvas visual appears in more than one place, promote it to the centralized design tokens before continuing.

## API Routes

- Validate and parse request input before any logic runs.
- Enforce auth and project ownership checks before any mutation.
- Return consistent, predictable response shapes.
- Keep route handlers thin — push complexity into shared modules or background tasks.

## Data and Storage

- Project metadata and relationships belong in PostgreSQL via Prisma.
- Canvas snapshots and generated specs belong in Vercel Blob; Prisma stores only the blob URL reference.
- Do not store large generated content directly in the database.
- Task run records are first-class relational data — treat ownership and run IDs as verified before any token issuance.

## File Organization

- `lib/` — shared infrastructure: Prisma client, auth helpers, utilities.
- `trigger/` — all durable background tasks and AI workflows.
- `components/` — UI composition only; no business logic.
- `app/api/` — route handlers for auth, triggering, and persistence.
- Name files after the responsibility they contain, not the technology.

## File Naming

- New files use lowercase kebab-case: `architecture-inspector.tsx`, `project-review-items.ts`, `generate-handoff.ts`.
- React component files are named after the product responsibility they render, not the generic UI primitive: use `decision-log-panel.tsx`, not `panel.tsx` or `index.tsx`.
- React component exports use PascalCase even when the file is kebab-case: `DecisionLogPanel` from `decision-log-panel.tsx`.
- Hooks use `use-` kebab-case filenames and `useCamelCase` exports: `use-project-dialogs.ts` exports `useProjectDialogs`. Do not rename existing legacy hook files solely for naming cleanup.
- Shared helpers in `lib/` use noun or verb phrases that describe the domain responsibility: `project-access.ts`, `spec-artifacts.ts`, `canvas-metadata.ts`.
- Tests sit next to the unit they verify and use `.test.ts` or `.test.tsx`: `canvas-metadata.test.ts`.
- Next.js route convention files keep framework-required names: `page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`, and `route.ts`.
- Dynamic route folder names must describe the identifier: `[projectId]`, `[roomId]`, `[specId]`, `[decisionId]`. Avoid vague params like `[id]` when a domain name is known.
- Prisma model split files use lowercase kebab-case singular domain names: `project-review-item.prisma`, `project-decision.prisma`.
- Feature specs use the project numbering scheme and lowercase kebab-case after the number: `00-A-onboarding-success-path.md`, `40-critical-dashboard.md`.
- Do not add barrel `index.ts` files unless the surrounding folder already uses that pattern and the export boundary is genuinely helpful.
