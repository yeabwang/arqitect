# 00-A - Onboarding Success Path

Create a focused first-run and new-design flow that moves users toward Arqitect's researched success moment: create a design, start from blank/template/AI prompt, reach the canvas quickly, and understand that the goal is a developable architecture spec, not generic diagramming.

## Product Intent

From `00-user_persona.md`, the highest-value users are engineering leads, architects, technical founders, and product engineering squads. These users do not arrive because they want to learn drawing tools. They arrive because they need to reduce ambiguity before implementation.

The current dashboard already has entry points for `New design`, `Prompt the AI architect`, and `Templates Soon`, but the paths are not yet a coherent onboarding system. This feature makes the entry path explicit and action-oriented without implementing AI generation, templates, metadata, review workflows, or spec upgrades in the same unit.

## Current State

- `/dashboard` is the authenticated home.
- `DashboardShell` owns the create-design dialog state through `DashboardContext`.
- Dashboard quick actions include blank canvas, AI prompt, and templates, but non-blank paths are not yet true creation flows.
- Project creation exists through existing project APIs and navigates to `/editor/[roomId]`.
- The editor already has a canvas, template import modal, and AI sidebar.

## User Story

As an engineering lead or technical founder, when I create a new design, I want to choose the right starting mode before entering the canvas, so that I can start from a blank workspace, an architecture template, or an AI prompt without hunting through the editor UI.

## Implementation

1. Replace the current single-purpose new design dialog with a start-design dialog.

   The dialog should support three mutually exclusive start modes:

   - Blank canvas.
   - Start from template.
   - Prompt Arqitect.

   Keep the dialog focused. Do not add account setup, team setup, billing, or a tutorial.

2. Keep project creation behavior centralized.

   - Reuse the existing project creation hook/API path.
   - Continue creating a normal `Project` record before navigating to the editor.
   - Do not create a separate onboarding table.
   - Do not store large onboarding state in the database.

3. Blank canvas path.

   - User enters a design name.
   - User submits.
   - App creates the project.
   - App navigates to `/editor/[roomId]`.
   - Canvas opens empty, exactly as today.

4. Template path.

   - User enters a design name.
   - User selects "Start from template" in the dialog.
   - The dialog should show a compact placeholder template chooser only if existing template data is already easy to reuse. If that would require duplicating the editor template modal, pass mode through the URL instead.
   - Preferred minimal behavior: create the project and navigate to `/editor/[roomId]?start=template`.
   - Editor reads the `start=template` search param and opens the existing starter template modal once after the room loads.
   - Clear the `start` state in client memory after the modal opens so it does not reopen repeatedly.

5. AI prompt path.

   - User enters a design name.
   - User selects "Prompt Arqitect".
   - User can enter a short architecture prompt in the dialog.
   - App creates the project and navigates to `/editor/[roomId]?start=ai`.
   - Editor opens the AI sidebar and pre-fills the prompt if it was provided.
   - Do not auto-run the prompt in this unit. The user should still confirm submission from the editor because AI generation has task/runtime cost and needs visible status.

6. Dashboard quick actions.

   - Wire `Blank canvas`, `Prompt the AI architect`, and `Templates` to the same start-design dialog with the corresponding mode preselected.
   - Replace any `Soon` state for Templates only if the editor template import flow is available and can be opened through `start=template`.
   - Keep future pages such as Agents, Team, Usage, Audit logs, Storage, and Settings as coming soon.

7. Empty dashboard.

   - The zero-design dashboard should route users into the same three paths.
   - The primary action should remain "New design" or "Blank canvas".
   - Secondary actions should be "Prompt Arqitect" and "Use a template".
   - Copy should be concise and product-specific: "Start with a prompt, a template, or a blank canvas. Export the spec when the design is ready."

8. Editor start-state handling.

   - Add a small client-side helper in the editor workspace client to interpret the `start` search param.
   - Supported values: `template`, `ai`.
   - Unknown values should be ignored.
   - The helper should not block canvas rendering.
   - The helper should not run server mutations.

9. Prefilled AI prompt.

   - If the start dialog passes prompt text, use a query-safe short payload.
   - Keep the prompt max length modest, for example 500 characters, because URL transport is not a durable storage layer.
   - If prompt text is missing, open the AI sidebar with the input empty.
   - Do not persist draft prompts in Prisma for this unit.

## UI Details

- Follow the existing dark-only dashboard and dialog language.
- Use existing shadcn/ui Dialog, Button, Input, and Textarea components.
- Use lucide icons for mode tiles if icons are used.
- Use only design tokens from `globals.css`.
- Do not introduce a marketing-style onboarding tour.
- Keep mode cards compact, not oversized feature cards.
- The dialog should feel like a command surface for technical users.

Suggested mode labels:

- `Blank canvas`
- `Use template`
- `Prompt Arqitect`

Suggested supporting copy:

- Blank: `Start with an empty system canvas.`
- Template: `Load a known architecture pattern and adjust it.`
- AI: `Describe the system and let Arqitect draft the first pass.`

## Data Flow

1. Dashboard action opens start-design dialog.
2. User selects mode and enters name/prompt where relevant.
3. Existing project create API creates the project.
4. Client navigates to `/editor/[roomId]` with optional start params.
5. Editor interprets params and opens template modal or AI sidebar.
6. Existing editor systems handle the actual template import or AI submission.

## Error Handling

- Project creation failure should show inline dialog error text.
- Invalid or empty project names should reuse existing validation behavior.
- Empty AI prompt is allowed if the user wants to write it in the editor.
- Invalid `start` query values should be ignored silently.
- If the editor cannot open the requested start tool, show no blocking error; the user can still use the canvas.

## Scope Limits

- Do not implement AI clarifying questions.
- Do not auto-trigger AI generation.
- Do not create new template data.
- Do not redesign the dashboard shell.
- Do not add new database models.
- Do not change auth, project access, Liveblocks auth, or canvas persistence.
- Do not build a multi-step onboarding tutorial.

## Dependencies

- Existing project creation route.
- Existing dashboard shell and create dialog state.
- Existing starter template modal.
- Existing AI sidebar.

## Check When Done

- Dashboard quick actions open the start-design dialog with the correct mode selected.
- Blank mode creates a project and opens an empty canvas.
- Template mode creates a project and opens the editor template modal.
- AI mode creates a project and opens the AI sidebar with optional prompt text prefilled.
- Unknown start params do not crash the editor.
- No new persistent onboarding storage is introduced.
- TypeScript and build pass.
