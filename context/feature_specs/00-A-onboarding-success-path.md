## Spec 01 — Onboarding and First-Run Experience

This is the first of nine specs that move Arqitect from an AI diagramming product into the system design workspace described in the product overview, persona document, and architecture context.

Onboarding is spec 01 because it is the moment where the product's positioning is either confirmed or contradicted in the user's mind. If the persona arrives expecting a workspace that reduces ambiguity before implementation and lands on a generic create-a-diagram dialog, the product has already lost the framing battle. This spec fixes that.

### Strategic Intent

The persona document is explicit: the highest-value users — engineering leads, staff engineers, architects, technical founders — are not arriving to learn drawing tools. They are arriving to reduce ambiguity before implementation. The onboarding must make this clear in the first 60 seconds, route them to the entry path that best fits their situation, and get them to a canvas with structured context, not a blank rectangle on a grid.

The starter spec provided treats onboarding as a routing problem: pick a mode, create a project, navigate to the editor, let the editor figure it out. That is too thin. It misses three things the persona and product specs require:

1. **The guided pre-generation interview.** The product spec commits to structured pre-generation input for vague prompts. The starter spec defers this entirely. If we ship that way, AI generation produces shallow output, which is risk #2 in the persona document.
2. **The framing of Arqitect as a system design workspace.** The starter spec's copy is generic. It does not signal that this is different from Miro, Whimsical, or FigJam. The landing inside the product should reinforce the positioning that the marketing site is trying to establish.
3. **The success moment.** The persona success moment is a generated spec the user can hand off. The starter spec gets the user to the canvas, then trusts the editor to do the rest. Onboarding should foreshadow the spec output from the first dialog so the user knows what they are working toward.

This spec corrects those gaps without expanding scope into AI generation, template content, or spec generation itself — those are later specs.

### What This Spec Delivers

A coherent first-run path that:

* Routes new users to a focused start-design dialog with three modes: blank canvas, template, prompt.
* Runs a guided pre-generation interview when the user picks the prompt path, capturing structured input before generation is queued.
* Hands the structured input off to the editor for execution by a later spec.
* Shows the user what the end state looks like (a generated spec) at the framing layer, not just at the dialog layer.
* Handles repeat users and empty-state dashboard gracefully.
* Persists nothing transient that does not need to be persisted.

What this spec does *not* deliver:

* AI generation itself. The interview output is captured and passed; execution is spec 03.
* Template content or library expansion. Templates are spec 02.
* Conversation persistence. Spec 04.
* Canvas metadata schema. Spec 02 begins this; spec 03 completes it.
* Spec generation. Spec 06.

### User Story

> As an engineering lead preparing a new system change, when I open Arqitect, I want to choose between starting blank, starting from a known architecture pattern, or describing my system to the AI — and if I describe my system, I want the product to ask me the right questions before drawing anything, so that what I get is a real first pass and not a generic diagram.

### Flow

#### Entry points

1. Dashboard "New design" primary action.
2. Dashboard quick-action tiles: `Blank canvas`, `Use template`, `Prompt Arqitect`.
3. Empty dashboard primary action (zero existing designs).

All three open the same start-design dialog with the relevant mode preselected.

#### Start-design dialog

The dialog has two stages:

**Stage 1: Name and mode**

* Design name (required, validated by existing project creation rules).
* Mode selector: three compact tiles — `Blank canvas`, `Use template`, `Prompt Arqitect`.
* Each tile shows a one-line description.
* Selecting blank or template advances to project creation immediately on confirm.
* Selecting prompt advances to stage 2.

**Stage 2: Guided pre-generation interview (prompt mode only)**

A multi-step wizard. It is short enough to complete in 90 seconds and skippable at any point. The fields map directly to the structured input the design generation task will consume in spec 03. This should be desigend in a way thats feels like a team talking to them instead of traditional static form.

Required (cannot be empty if the interview is submitted):

* **System goal** — one sentence. What is this system for?

Recommended (submittable empty, but their absence is recorded as open questions on the resulting canvas):

* **Primary users** — who uses this system?
* **Critical flows** — two or three core flows the system supports.
* **Expected data stores** — what must be persisted?
* **External integrations** — what does this system talk to?
* **Runtime context** — where does this run? (web app, mobile, batch, etc.)
* **Scale expectations** — rough scale signal (prototype, team, product, scale).
* **Known constraints** — anything non-negotiable (compliance, latency, language/runtime, existing infra).

Below the fields, a single secondary action: `Skip interview and write a free-form prompt instead`. This collapses the interview into a single textarea. The user can still submit, but the resulting canvas will be heavily annotated with open questions and low-confidence flags — the product spec commits to making shallowness visible rather than hidden.

A subtle line under the submit button: *"Arqitect will use these answers to draft your architecture and the spec it'll generate from it."* This is the framing line. It is the first time the user sees that a spec is the deliverable.

#### What happens on submit

| Mode     | Action                                                                                                                                                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blank    | Create project. Navigate to `/editor/[roomId]`. Canvas opens empty.                                                                                                                                                                                                                          |
| Template | Create project. Navigate to `/editor/[roomId]?start=template`. Editor opens the template modal once after the room loads.                                                                                                                                                                    |
| Prompt   | Create project. Persist the interview payload as a `PendingGeneration`row tied to the project. Navigate to `/editor/[roomId]?start=ai`. Editor opens the AI sidebar, reads the pending generation, and pre-fills its review state. The user confirms or edits before generation is queued. |

The `PendingGeneration` table is a small, scoped addition to the schema — not a generic onboarding store. It exists because the interview payload is too large and too structured for a URL parameter and is needed by spec 03's generation task. It is cleared once the user confirms generation in the editor, or expired after 24 hours if untouched.

### Schema Addition

prisma

```prisma
model PendingGeneration {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  payload     Json     // structured interview answers
  rawPrompt   String?  // present when user skipped the interview
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}
```

Justification against architecture invariants: this is durable relational metadata (Invariant 9 territory), it is scoped per project, and it is not a Liveblocks-only transient. The architecture allows scoped Postgres additions where they serve a feature; this serves the guided start path.

### Editor Start-State Handling

The editor reads `start` and the project's `PendingGeneration` row, then:

| `start`    | Behavior                                                                                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `template` | Open the existing template modal once after the Liveblocks room mounts. Clear from client memory.                                                                                                                                                                           |
| `ai`       | Open the AI sidebar. Fetch `PendingGeneration`. Render the interview answers as an editable preview with a confirm button. On confirm, the AI sidebar passes the payload to the design generation task (implemented in spec 03) and deletes the `PendingGeneration`row. |
| unknown/null | Ignore.                                                                                                                                                                                                                                                                     |

The AI sidebar in the editor is not running generation in this spec — it is showing the user what they entered, letting them edit it, and giving them a clear "generate" affordance. Spec 03 will replace the confirm action with the actual Trigger.dev call. Until then, the confirm button can be wired to a no-op or to whatever placeholder generation the current product has, with a visible "Generation arrives in the next release" note if needed.

### Dashboard Changes

#### Quick actions

* `Blank canvas` → Directly create a empty canvas with the selected name.
* `Use template` → Show a full modern designed popup with templates header. Here will be people can quickly check and select templates. Sice we haven't did the templates part leave it empty for jow
* `Prompt Arqitect` → This should take them to the beautifully, modern design, developer first interation dialog in very modern, attractive way instead of doing it through one full traditional form lets do it through a form of interactive guide asking the people a question and letting them answer one at a time.
* `Agents`, `Team`, `Usage`, `Audit logs`, `Storage`, `Settings` remain coming soon.

#### Empty dashboard

The zero-design state is the most important onboarding surface. It should:

* Show a single primary line that frames the product: *"Design systems your team and AI can build from."* This is one of the recommended landing-page lines from the persona document, brought into the product.
* Show the three start paths as compact, equal-weight options below the line.
* Show a one-line preview of the end state: *"You'll leave with a canvas and a Markdown spec ready for engineers or coding agents."*
* Not show a tour, video, sample project carousel, or marketing-style hero. The persona is technical and impatient.

#### Populated dashboard

Existing layout. The "New design" button opens a short dialog box allowing them to select from the three quick actions in the modern way. The three quick-action tiles remain available at the top.

### UI Language

* Dark-only, consistent with the existing dashboard.
* shadcn/ui Dialog, Button, Input, Textarea, RadioGroup for mode selection.
* Lucide icons on the mode tiles: `Square` for blank, `LayoutTemplate` for template, `Sparkles` for prompt — but kept small, no oversized illustration.
* Mode tiles are compact horizontal cards with icon, label, and one-line description. Selected state uses the existing accent token; unselected uses muted border.
* The interview form uses a single-column layout with labels above inputs. No collapsible sections. No progress indicator — the form is short enough that a progress bar implies more length than there is.
* Skip-to-free-prompt is a text link, not a button, so it doesn't compete visually with the primary submit.
* Submit button label is mode-dependent:
  * Blank: `Create design`
  * Template: `Create and choose template`
  * Prompt: `Create and review answers`

The "review answers" framing reinforces that the next step is the user confirming, not the AI silently running.

### Copy

The copy is the cheapest and most visible lever for positioning. The persona document gave us strong lines; we use them here.

| Surface                     | Copy                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Empty dashboard headline    | Design systems your team and AI can build from.                                                                            |
| Empty dashboard subheadline | You'll leave with a canvas and a Markdown spec ready for engineers or coding agents.                                       |
| Start-design dialog title   | New design                                                                                                                 |
| Mode tile: Blank            | Start with an empty system canvas.                                                                                         |
| Mode tile: Template         | Begin from a known architecture pattern and adjust it.                                                                     |
| Mode tile: Prompt           | Describe your system. Arqitect will draft the first pass.                                                                  |
| Interview intro line        | A few questions first. Vague prompts produce vague architecture.                                                           |
| Interview submit footnote   | Arqitect will use these answers to draft your architecture and the spec it'll generate from it.                            |
| Skip-to-free-prompt link    | Skip the interview and write a free-form prompt instead.                                                                   |
| Free-prompt warning         | Free-form prompts produce designs with more open questions and lower confidence. That's visible in the result, not hidden. |

The interview intro line is deliberate. It is honest, technical, and respects the persona. It also pre-empts the "why are you asking me so many questions" reaction by naming the tradeoff explicitly.

### Error Handling

* Project creation failure: inline error in the dialog. Do not close the dialog. Preserve form state.
* Invalid project name: existing validation behavior.
* Empty system goal in interview mode: inline field error. Submit is blocked.
* Empty optional fields: allowed. Recorded as open questions in the `PendingGeneration` payload.
* `PendingGeneration` row already exists for project: replace it. (Only happens if the user re-enters the dialog before navigating.)
* Unknown `start` parameter: ignored silently.
* Editor cannot open the requested start tool: no blocking error. User reaches the canvas.

### Scope Limits

* No AI generation execution. The interview payload is captured; execution is spec 03.
* No new template content. Existing template modal is reused.
* No conversation persistence. Spec 04.
* No spec generation. Spec 06.
* No multi-step onboarding tour, tutorial overlay, or sample project library.
* No changes to auth, project access, Liveblocks token issuance, or canvas persistence.
* No changes to the dashboard shell structure beyond copy and quick-action wiring.
* No team or organization onboarding flow. Single-user start is the v1 surface.
