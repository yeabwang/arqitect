# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- None (ready for next feature unit)

## Current Goal

- Project dialogs complete: editor home, create/rename/delete dialogs, sidebar actions, hook state management. All wired with mock data. Build/lint/type passes clean.

## Completed

- 01-design-system: shadcn/ui installed with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea. `lib/utils.ts` with `cn()` helper. `globals.css` wired with dark-only theme tokens from `ui-context.md`. Build passes clean.
- 02-editor: `components/editor/editor-navbar.tsx` — fixed top navbar with sidebar toggle, left/center/right sections, PanelLeftOpen/Close icons. `components/editor/project-sidebar.tsx` — floating overlay sidebar with Tabs (My Projects/Shared), empty placeholders, New Project button. Dialog pattern confirmed ready via existing `components/ui/dialog.tsx` (title, description, footer actions using color tokens). TypeScript, ESLint, and Next.js build all pass clean.
- 03-auth: `proxy.ts` at root using `clerkMiddleware` — all routes protected except `/sign-in` and `/sign-up` (configured via `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars with defaults). `ClerkProvider` wraps root layout with `dark` theme from `@clerk/ui/themes`, appearance variables mapped to app CSS custom properties. Sign-in and sign-up pages at `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — two-panel layout on large screens (left: top logo, big headline "Design systems at the speed of thought.", subtitle, three feature rows with Lucide icons — Sparkles/Users/FileText — for AI Architecture Generation, Real-time Collaboration, Instant Spec Generation, copyright footer; right: surface panel with Clerk form), form-only on small screens. `/` redirects authenticated users to `/editor`, unauthenticated to `/sign-in`. `UserButton` added to editor navbar right section. `@clerk/ui` installed. Build passes clean.
- 04-project-dialogs: `hooks/use-project-dialogs.ts` — dedicated hook managing dialog state, form state, loading state, slug preview derivation, and mock project data with `isOwner` flag. `components/editor/editor-home.tsx` — heading, description, New Project button with Plus icon. `components/editor/create-project-dialog.tsx` — project name input, live slug preview updating as user types, Cancel/Create footer. `components/editor/rename-project-dialog.tsx` — prefilled input, current name in description, auto-focus on open, Enter submits, Cancel/Save footer. `components/editor/delete-project-dialog.tsx` — destructive confirmation only, no text input, Cancel/Delete with destructive variant. `components/editor/project-sidebar.tsx` — updated with project lists, inline Pencil/Trash2 actions for owned projects only, hidden actions for shared projects, sidebar New Project wired to create dialog. `app/editor/page.tsx` — wires dialogs, editor home, and sidebar together with hook. TypeScript, ESLint, and Next.js build all pass clean.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Auth route protection uses `proxy.ts` with `clerkMiddleware` (Next.js 16 proxy convention, not deprecated middleware.ts).
- Clerk `dark` base theme overridden with CSS variable references — no hardcoded colors in auth components.
- Root layout loads `Geist` and `Geist_Mono` from `next/font/google` as `--font-geist-sans` and `--font-geist-mono` CSS variables, matching the `ui-context.md` typography spec. `globals.css` cascades `--font-sans → var(--font-geist-sans)` and `--font-mono → var(--font-geist-mono)` so Tailwind utilities `font-sans` / `font-mono` resolve correctly.
- Project dialog state managed via `hooks/use-project-dialogs.ts` — single hook owns dialog/form/loading state. Mock projects with `isOwner` flag control sidebar action visibility.

## Session Notes

- Add context needed to resume work in the next session.
