## Spec 09 — Coding-Agent Handoff Brief

This is the last of nine specs. Eight specs have built up to this moment: onboarding (01), templates (02), AI design generation (03), conversation (04), metadata editing (05), spec generation (06), the four-entity reasoning model (07), and the unified review workflow (08). Each spec was scoped tightly, and several deliberately deferred work to this one. Spec 09 closes the loop the product overview defined as Arqitect's core promise: leaving with a canvas and a spec ready for engineers or coding agents.

### Strategic Intent

The persona document was specific about why the coding-agent handoff brief matters as a separate artifact from the technical spec. Five reasons cohere into the design intent:

**Different readers, different artifacts.** A human reviewing a system design wants to understand intent, alternatives, and reasoning. A coding agent implementing the system wants scope, contracts, acceptance checks, and known traps. The same Markdown document optimized for one is suboptimal for the other. The product spec evaluation explicitly rejected conflating them.

**Coding agents are the persona document's emerging buyer trigger.** Technical founders adopting Claude Code, Cursor, GitHub Copilot, and others need stronger specs than humans tend to write. "AI-first builders who want a clean spec before delegating work to coding agents" appeared in the persona document as a target customer. The handoff brief is the artifact they came for.

**This is Arqitect's sharpest defensible differentiation.** Miro, Lucidchart, Eraser, FigJam, and Whimsical all have AI diagramming. None of them produce a handoff brief tuned for coding agents. The persona document's competitive read was unambiguous: depth of the loop, not breadth of features, is the moat. The handoff brief is where that depth becomes concrete.

**The spec must remain the primary artifact.** A team should be able to generate a spec without a handoff brief. The handoff brief is downstream — it consumes a spec version and produces an agent-tuned derivative. This ordering matters because it preserves the human-readable spec as the canonical artifact and treats the agent version as a transformation, not a parallel deliverable.

**The copyable agent prompt is the practical payload.** The persona document called the handoff brief a "Markdown coding-agent handoff brief" — but inside that brief, the most valuable section is a single self-contained prompt the user pastes into Claude Code, Cursor, or another agent. That prompt embeds architecture context, contracts, scope, and acceptance checks in the shape an agent can actually use. The whole brief exists to produce this prompt; the prompt is what reaches the agent.

There is a sixth strategic point that emerged from the spec sequence: this is where the metadata schema from spec 02 finally produces its complete value. Edge metadata becomes contracts. Component metadata becomes implementation scope. Confidence flags become known unknowns. Risks from spec 07 become traps the agent should not silently resolve. Each prior spec's structured data feeds into a single coherent agent payload here.

### What This Spec Delivers

A handoff brief generation system where:

* Every handoff brief is generated from a chosen spec version (from spec 06), not from the live canvas — the brief is downstream of a spec, not an independent artifact.
* The brief is a structured Markdown document with the canonical sections from the product spec: implementation scope, architecture summary, components, contracts, work breakdown, risks, acceptance checks, out-of-scope items, and the copyable agent prompt.
* The copyable agent prompt is the structural focus: a self-contained block the user can copy and paste into a coding agent that includes everything the agent needs without requiring the rest of the brief.
* Handoff briefs are persisted as immutable artifacts linked to their source spec version, following the same versioning and storage pattern as specs.
* Generation is initiated from the spec panel (spec 06) — the user is generating a handoff brief *from* a spec, not in parallel to one.
* Implementation scope can be configured before generation: full design, generation subgraph only, template subgraph only, lifecycle-phase only (existing/new/planned).
* The brief is downloadable, copyable, and viewable in the editor, with the copyable agent prompt section having its own one-click copy action distinct from copying the whole brief.

What this spec does *not* deliver:

* Agent-specific prompt tuning. The copyable prompt is structured to work with Claude Code, Cursor, GitHub Copilot, and other agents through their common conventions. Per-agent variants (Cursor-specific frontmatter, Claude Code MCP markers, etc.) are out of scope for v1 per the product spec.
* Direct coding-agent execution. The brief produces a prompt; the user takes it to the agent. Arqitect does not run agents on the user's behalf. This boundary is explicit in the architecture context.
* Iteration loops where the agent's output flows back into Arqitect. The handoff is one-directional in v1.
* Multiple brief formats per generation. One brief, one Markdown document, one copyable prompt block.
* Handoff brief versioning independent of spec versioning. A brief is always linked to its source spec version; regenerating from the same spec version produces a new brief.

### User Story

> As a technical founder who just generated spec version 3 of my event pipeline design, when I'm ready to hand the implementation off to my coding agent, I want a single Markdown document with everything the agent needs — the scope of what to build, the contracts between components, the acceptance criteria, and the known traps — plus a single copy-paste prompt block that contains all of that distilled for the agent. I want to be able to paste that prompt into Claude Code or Cursor and have the agent produce code that respects the architecture I designed, not code that drifts because the agent had to fill in gaps.

### The Handoff Brief Document Structure

The product spec specified the sections. This spec maps each to its input sources and the LLM's bounded role, in the same shape as spec 06's section mapping for the human-readable spec.

| Section                               | Primary input                                                                                      | LLM role                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Header metadata                       | Project name, spec version number, handoff version, generated date, scope label                    | None — formatted from data                               |
| Implementation scope                  | The user's scope selection at generation time; node and edge counts within scope                   | Synthesize a 2-paragraph scope statement                  |
| Architecture summary (agent-readable) | Components in scope, grouped by `componentType`, with their direct relationships                 | Compact summary tuned for agent context                   |
| Components to implement               | Every node in scope with `responsibility`,`owner`,`runtime`, dependencies                    | Format and synthesize; no fabrication                     |
| Contracts and data shapes             | Every edge in scope with `protocol`,`interactionMode`,`dataExchanged`,`failureBehavior`    | Convert metadata into agent-usable contract descriptions  |
| Suggested work breakdown              | Components in scope ordered by `lifecycleStatus`, with dependencies derived from edges           | Produce an ordered list with dependency notes             |
| Risks and known unknowns              | Risks (from spec 07) targeting in-scope elements; low-confidence metadata; open questions in scope | Format as agent-facing "do not silently resolve" warnings |
| Acceptance checks                     | Critical flows (from interview or conversation), system goal, in-scope contracts                   | Derive concrete acceptance criteria the agent can verify  |
| Out-of-scope items and known traps    | Components explicitly outside scope; deprecated lifecycle items; dismissed review items            | List items the agent should not implement and why         |
| Copyable agent prompt                 | The compressed essence of all above sections                                                       | Compose a self-contained agent prompt                     |

A few choices warrant explicit attention.

**The architecture summary is its own section because agents work better with compact context.** Coding agents have context windows. A long human-readable spec is suboptimal for an agent both because of token cost and because LLM attention degrades over very long inputs. The compact architecture summary section, written specifically for agent consumption, is one of the things that distinguishes the handoff brief from a copy-paste of the human spec.

**Contracts are extracted from edge metadata directly.** The spec 02 edge metadata schema includes `protocol`, `interactionMode`, `dataExchanged`, `producerRole`, `consumerRole`, `failureBehavior`. These map naturally to what an agent needs to implement an integration: which side calls which, over what wire format, with what payload shape, with what error handling. The contracts section is the metadata's most direct payoff.

**Acceptance checks are derived, not invented.** The LLM does not invent acceptance criteria the user did not imply. It derives them from the system goal (from the interview), the critical flows (from the interview and conversation), and the contracts (from edge metadata). If a flow says "user submits payment → payment service charges card → event published to billing," the acceptance check is "implementing this flow produces a charge call followed by an event publish." Concrete and verifiable.

**Risks become "do not silently resolve" warnings.** This is the most distinctive section. A coding agent implementing a service whose `failureBehavior` is `undefined` will often make a reasonable-seeming choice (try-catch with retry, perhaps). The brief makes it explicit: this behavior is undefined in the design, the agent should surface the decision to the human, not pick one silently. Spec 07's risks become these warnings directly.

**The copyable agent prompt is composed last but generated as a structured section.** It is not a copy of the brief. It is a distilled, self-contained payload designed to fit in an agent's context window and produce useful output. Composing it deliberately, with its own constraints, is what makes it usable.

### The Copyable Agent Prompt

This is the artifact's payload. The persona document explicitly called it out: "a copyable prompt for a coding agent." The product spec evaluation pushed for it to be specified in detail rather than left as a bullet point. This spec delivers that detail.

#### What goes in the prompt

The copyable prompt is a single Markdown block, self-contained, around 1500–3000 words depending on scope. It opens with the agent role framing, then layers in context, contracts, scope, acceptance, and traps.

The structure:

```
You are implementing a portion of a system architecture designed in Arqitect.
The full architecture spec is available; this prompt contains the implementation-ready
distillation. Treat the design decisions as constraints, not suggestions.

## System
{system goal, 1-2 sentences}
{technology constraints if specified — runtime, language, key dependencies}

## What you are implementing
{scope statement — which components are in this implementation pass}
{components listed with responsibility and runtime}

## Contracts between components
{for each in-scope edge: producer → consumer, protocol, interaction mode, data exchanged, failure behavior}

## Suggested order of implementation
{ordered work breakdown derived from dependencies}

## Acceptance checks
{concrete verifiable criteria derived from flows and contracts}

## Do not silently resolve
{risks, undefined behaviors, low-confidence metadata that the agent must surface back to the user instead of choosing}
{open questions in scope}

## Out of scope
{components and behaviors the agent should not implement, with brief reasons}

## Known traps
{items dismissed in review with reasons; deprecated lifecycle items; common mistakes implied by the design}
```

#### How the prompt differs from the full brief

The full brief is a Markdown document for humans to read, review, and reference. The agent prompt is a single block optimized for paste-into-agent use. Three concrete differences:

**No section headers above h2.** The agent prompt is parsed by an LLM, not navigated by a human. Heavy nesting and document chrome reduce token efficiency.

**Prose is denser.** The full brief explains. The agent prompt directs. "The payment service is responsible for processing card charges and emitting payment events" in the brief becomes "Implement payment-service: process card charges, emit payment events" in the prompt.

**Imperative voice throughout.** The agent prompt addresses the agent in second person and tells it what to do. The brief is descriptive prose.

The prompt is generated by a dedicated section-prompt in the LLM call, with the constraint that the prompt must be self-contained — an agent reading only the prompt should have enough to implement the in-scope components.

#### Why a single prompt block, not multiple

A natural temptation would be to generate per-component prompts, or per-flow prompts, or one prompt with a directory structure. We resist this for v1 for two reasons:

**Composition is the user's job, not Arqitect's.** A coding agent receives a prompt. The user decides how to use it: paste it whole, paste the relevant sections, paste it as MCP context. Arqitect producing structured slices presumes the agent's calling pattern. A single self-contained block is the lowest common denominator.

**Single-block-with-clear-structure works across agents.** Claude Code, Cursor, GitHub Copilot, and Aider all accept long-form prompts. Per-agent variants would couple Arqitect to specific agent UIs and APIs. The product spec evaluation explicitly said agent-specific tuning is post-launch.

### Scope Configuration

A handoff brief without scope configuration would always be "the whole design," which is wrong: implementation usually proceeds in phases, components, or subgraphs. The product spec listed implementation scope as the first section of the brief, which implies the user must be able to set it. This spec implements scope configuration.

When the user initiates a handoff brief generation, a configuration dialog appears with these options:

**Full design.** Every component and edge in the canvas. Sensible for small designs or initial handoffs.

**Lifecycle-phase scope.** Only components with `lifecycleStatus` in a selected set. The user picks one or more of: existing, new, planned. Default: new + planned. This is the most common scope for ongoing development — implement what is new and planned, leaving existing as context only.

**Subgraph scope.** A picker showing the available subgraphs in the canvas: any template imports (spec 02), any AI generation subgraphs (spec 03). The user selects one or more subgraphs. Useful for delegating a specific feature's implementation to an agent.

**Custom selection.** The user lassos or clicks specific nodes on the canvas to include. The canvas enters a selection mode where the dialog stays open and the user picks nodes. Edges between selected nodes are automatically included; edges between selected and unselected nodes are noted as "boundary contracts" in the brief.

The dialog also offers a few cross-cutting options:

* **Include existing components as context.** When checked (default), components outside scope but adjacent to scope are included in the brief as context, not as implementation targets. This is how the agent learns about the surrounding system.
* **Include AI-generated components.** When unchecked, components from AI generation subgraphs are excluded even if they match the scope. Useful when the user has not yet reviewed AI-generated parts.
* **Strict mode.** When checked, components with `confidence: low` are excluded from the implementation set. Strict mode produces a smaller, more rigorous brief; the user explicitly opts in.

The scope configuration is stored on the resulting `HandoffBrief` row so the brief is reproducible: regenerating from the same spec version with the same scope produces an equivalent brief.

### The Generation Task

`trigger/generate-handoff.ts` follows the same patterns as spec 06's spec generation task, with the differences below.

#### Input

typescript

```typescript
exporttypeGenerateHandoffInput={
  projectId:string;
  specVersionId:string;// The spec version this handoff is generated from
  scopeConfig:HandoffScopeConfig;
  initiatedBy:string;
  idempotencyKey:string;
};

exporttypeHandoffScopeConfig={
  scopeType:"full"|"lifecycle"|"subgraph"|"custom";
  lifecycleStatuses?:("existing"|"new"|"planned"|"deprecated")[];
  subgraphIds?:string[];
  customNodeIds?:string[];
  includeAdjacentContext:boolean;
  includeAiGenerated:boolean;
  strictMode:boolean;
};
```

#### Lifecycle

1. **Create TaskRun.** `type: "handoff_generation"`, `status: "running"`. The pattern from specs 03 and 06.
2. **Load the spec version.** Fetch `SpecVersion` by ID, then the `SpecGenerationContext` it references (which contains the canvas snapshot ID, conversation cursor, decision log state, and review items state from spec 06's freezing model).
3. **Load the canvas snapshot.** Fetch the Blob at the captured `canvasSnapshotId`. The handoff brief reads from the same frozen snapshot as its source spec — this is essential for reproducibility and for the brief to be consistent with the spec.
4. **Apply the scope filter.** Compute the set of in-scope nodes and edges based on `scopeConfig`. Compute the adjacent-context set if requested.
5. **Update status.** `TaskRun.status = "drafting"`.
6. **Build section inputs.** For each section, assemble its input from the scoped canvas data, the source spec's content (parsed from the Markdown for relevant context), the decision log state, and the review items state.
7. **Generate each section.** Section-by-section LLM calls, as in spec 06. Each section has its own prompt template, structured input, and Zod schema. The copyable agent prompt is generated last, after all other sections, so the LLM has the assembled brief content as context for composing the distilled prompt.
8. **Validate each section.** Same pattern as spec 06. Single-section failures produce a partial brief; total failure produces no brief.
9. **Assemble the document.** Concatenate sections in the canonical order. The header metadata is constructed deterministically (project name, spec version reference, scope label, generated date).
10. **Write the document.** Save the Markdown to Blob at `handoffs/{projectId}/{handoffId}.md`. Immutable; never overwritten.
11. **Create HandoffBrief row.** Postgres record linking to the source spec version, the canvas snapshot ID (inherited from the spec), the scope configuration, and the file path.
12. **Complete.** `TaskRun.status = "completed"`. Summary message in the conversation: "Handoff brief generated for spec version {n}, scope: {scope label}."

#### Section-by-section, like spec 06

The same reasoning applies. Section-by-section keeps each prompt focused, allows partial failure tolerance, and makes section-level validation tractable. There are roughly 10 LLM calls per handoff brief (one per section, including the copyable prompt section).

The copyable prompt section is the most complex single call. Its input is the assembled content of the preceding sections plus the structured canvas data. Its output is the self-contained prompt block. Its schema validates that the output contains no Arqitect-specific terminology the agent wouldn't understand (no references to "spec version 3" or "open question entities" — instead, "implementation context" and "things to surface back to the user").

### Schema Additions

prisma

```prisma
model HandoffBrief {
  id                String    @id @default(cuid())
  projectId         String
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  specVersionId     String
  specVersion       SpecVersion @relation(fields: [specVersionId], references: [id])

  filePath          String    // Blob path: handoffs/{projectId}/{handoffId}.md
  canvasSnapshotId  String    // Inherited from the source spec version
  scopeConfig       Json      // The HandoffScopeConfig used
  scopeLabel        String    // Human-readable scope description, e.g., "New + Planned components"

  status            String    @default("complete")  // "complete" | "partial"
  partialSections   String[]
  summary           String

  generatedAt       DateTime  @default(now())
  generatedBy       String
  taskRunId         String

  @@index([projectId, generatedAt])
  @@index([specVersionId])
}
```

The `HandoffBrief.specVersionId` foreign key without `onDelete` cascade is intentional — a `SpecVersion` cannot be deleted in v1 (spec 06's scope limits), so there is no cascade to define. If spec deletion is added later, handoff briefs should not be silently orphaned; the cascade behavior should be revisited at that time.

`scopeLabel` is precomputed and stored so the handoff brief list shows it directly. Computing it from `scopeConfig` at render time would require parsing the JSON repeatedly.

`canvasSnapshotId` is denormalized from the source spec for query efficiency. The brief can be reproduced from `specVersionId` alone, but listing handoff briefs with their snapshot summaries is faster with denormalization.

### API Surface

#### `POST /api/projects/{projectId}/handoff-briefs/check`

Pre-flight check before generation. Body: `{ specVersionId, scopeConfig }`. Returns a preview:

json

```json
{
"scopeSummary":{
"inScopeNodeCount":14,
"inScopeEdgeCount":22,
"adjacentContextNodeCount":3,
"outOfScopeNodeCount":5,
"excludedDueToStrictMode":2
},
"scopeLabel":"New + Planned components (excluding low-confidence)"
}
```

No writes. The user sees what they're about to generate before committing.

#### `POST /api/projects/{projectId}/handoff-briefs`

Triggers generation. Body: `{ specVersionId, scopeConfig, idempotencyKey }`. Validates project access, validates that the spec version exists and belongs to the project, queues the Trigger.dev task, returns the run ID and reserved handoff brief ID.

#### `GET /api/projects/{projectId}/handoff-briefs`

Lists handoff briefs. Returns briefs ordered by `generatedAt` descending, with their source spec version and scope label. Pagination by `generatedAt` cursor.

#### `GET /api/projects/{projectId}/handoff-briefs/{handoffId}`

Returns the full brief content. The Markdown is fetched from Blob.

#### `GET /api/projects/{projectId}/handoff-briefs/{handoffId}/download`

Streams the Markdown as a file download with the filename `{project-name}-handoff-v{n}.md` where `v{n}` is the brief's sequential number within its source spec version.

#### `GET /api/projects/{projectId}/handoff-briefs/{handoffId}/agent-prompt`

Returns *only* the copyable agent prompt section as plain Markdown text. This is a separate endpoint because the agent prompt is the most-copied artifact, and a one-click "Copy agent prompt" action in the UI hits this endpoint directly. Server-side extraction (parse the brief's Markdown, find the agent prompt section) is more reliable than client-side parsing of the rendered brief.

### The Handoff Brief Surface in the Editor

The spec panel from spec 06 becomes a unified "Spec and handoff" panel after this spec. The two artifacts are related and should not live in separate UI surfaces.

#### Layout changes to the spec panel

The header changes from "Spec versions" to "Spec versions and handoff briefs." The version list gains a per-version expand affordance: clicking a small chevron next to a spec version reveals the handoff briefs generated from that version, nested under it. The unselected default shows only the spec versions.

A spec version with no handoff briefs shows a small "Generate handoff brief" button when expanded. A spec version with handoff briefs shows them as nested cards beneath it, each with the scope label, generation date, and a "Generate another handoff brief" button at the bottom of the nested list.

When a handoff brief is selected, the preview region below the list shows the rendered Markdown of the brief. Like the spec preview, it has a raw/rendered toggle and a "Copy to clipboard" action.

A second prominent button appears in the handoff brief preview: "Copy agent prompt." This action hits the dedicated endpoint and copies *only* the agent prompt section. This is the action the persona will use most. Making it one click, separate from copying the whole brief, is the design's most important UI choice.

#### Generation flow

1. User clicks "Generate handoff brief" on a spec version.
2. The scope configuration dialog opens. Default scope: lifecycle = new + planned, includeAdjacentContext = true, includeAiGenerated = true, strictMode = false.
3. The dialog shows a live scope summary as the user changes options ("This will include 14 components and 22 connections; 5 components will be marked out of scope.").
4. On confirm, generation queues. The spec panel shows the handoff brief slot in a "Generating" state nested under the source spec version.
5. Section-by-section progress is visible in the same style as spec 06's spec generation.
6. On completion, the new handoff brief appears in the nested list, auto-selected and rendered.
7. On failure, the slot shows the failure with a retry affordance.

#### Multi-collaborator visibility

When a collaborator generates a handoff brief, other collaborators see it appear in the panel in real time via Liveblocks events. The conversation also gets a system message: "Handoff brief generated by {user} for spec version {n}, scope: {scope label}."

### Connection to Prior Specs

This spec is more interconnected with prior work than any other. It depends on every prior spec functioning correctly. Explicitly:

**Spec 01 onboarding.** The system goal from the interview is referenced in the brief's scope and agent prompt sections. The interview's critical flows become the basis for acceptance checks.

**Spec 02 templates and metadata schema.** The metadata schema is exhaustively read by every section. Edge metadata becomes the contracts section verbatim. Template-supplied components carry their metadata into the brief.

**Spec 03 AI design generation.** Generated subgraphs are scope-selectable. The generator's `sourceReasoning` on nodes and edges flows into the agent prompt's context paragraphs.

**Spec 04 conversation.** The cursor mechanism freezes the conversation state at the source spec's generation time. Conversation messages relevant to the in-scope components contribute to acceptance checks and known traps.

**Spec 05 metadata editing.** The user's edits to metadata, including verified-confidence transitions, are what makes the brief substantive. Without spec 05, the brief reflects only AI-original metadata.

**Spec 06 spec generation.** The handoff brief consumes a spec version as its primary input. The `SpecGenerationContext` provides the frozen world the brief is generated against.

**Spec 07 decisions, risks, assumptions, open questions.** All four entity types contribute to specific sections. Risks become "do not silently resolve" warnings. Decisions referenced in the brief explain why components exist as they do. Open questions become items the agent should surface back. Assumptions become explicit assumptions in the brief.

**Spec 08 review items.** Resolved review items contribute to known traps (dismissed items with `resolutionType: wont_address` explain what the team chose not to do and why). Open suggestion-level items appear as "consider during implementation" notes.

If any of these dependencies are thin, the brief is correspondingly thin. The investment in prior specs is what enables this final artifact to be substantive.

### UI Language

* The handoff brief preview uses the same Markdown renderer as the spec preview from spec 06.
* The copyable agent prompt section is rendered with a distinct visual treatment: a slightly elevated background (using existing card tokens), a code-block-style monospace font, and a prominent "Copy agent prompt" button in the section header. This treatment signals "this is the thing you came for."
* The scope configuration dialog uses the existing dialog primitive with three regions: scope type selection (radio group), scope-type-specific options below, and the live scope summary at the bottom.
* Handoff brief cards in the nested list use smaller, denser styling than spec version cards, reinforcing the parent-child relationship visually.
* Lucide icons: `FileText` continues for spec versions, `Bot` for handoff briefs (signaling agent-target), `Copy` for copy actions.
* The "Copy agent prompt" button uses the primary accent fill — it's the most important action in the entire handoff brief surface.
* Section progress during generation uses the same vertical list pattern as spec 06.

### Copy

| Surface                                         | Copy                                                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel header                                    | Spec versions and handoff briefs                                                                                                                                                  |
| Generate handoff brief button (on spec version) | Generate handoff brief                                                                                                                                                            |
| Generate another handoff brief button           | Generate another handoff brief                                                                                                                                                    |
| Empty handoff briefs state (per spec version)   | No handoff briefs yet. Generate one when this spec is ready for implementation.                                                                                                   |
| Scope configuration dialog title                | Configure handoff scope                                                                                                                                                           |
| Scope configuration dialog subtitle             | Pick what the implementation pass should cover. Out-of-scope components can still be included as context.                                                                         |
| Scope type: full                                | Full design                                                                                                                                                                       |
| Scope type: lifecycle                           | By lifecycle status                                                                                                                                                               |
| Scope type: subgraph                            | By subgraph (template or AI-generated)                                                                                                                                            |
| Scope type: custom                              | Custom selection                                                                                                                                                                  |
| Lifecycle scope helper                          | Implement components with the selected lifecycle status. New and Planned are common defaults.                                                                                     |
| Subgraph scope helper                           | Implement components from specific subgraphs. Useful for delegating a single feature's implementation.                                                                            |
| Custom scope helper                             | Pick components directly on the canvas. Click confirm when selection is complete.                                                                                                 |
| Include adjacent context toggle label           | Include adjacent components as context                                                                                                                                            |
| Include adjacent context helper                 | Components outside scope but connected to in-scope components will be described in the brief as context.                                                                          |
| Include AI-generated toggle label               | Include AI-generated components                                                                                                                                                   |
| Include AI-generated helper                     | Uncheck to exclude components from AI generation subgraphs that haven't been reviewed.                                                                                            |
| Strict mode toggle label                        | Strict mode (exclude low-confidence components)                                                                                                                                   |
| Strict mode helper                              | Excludes components with confidence: low. Produces a smaller, more rigorous brief.                                                                                                |
| Scope summary format                            | {n} components and {n} connections in scope. {n} adjacent context. {n} excluded.                                                                                                  |
| Generate confirm button                         | Generate handoff brief                                                                                                                                                            |
| Handoff generation in progress                  | Generating handoff brief for spec version {n}                                                                                                                                     |
| Section progress: copyable agent prompt         | Composing agent prompt                                                                                                                                                            |
| Generation complete                             | Handoff brief ready                                                                                                                                                               |
| Handoff brief preview header                    | {scope label} · Generated from spec version {n}                                                                                                                                  |
| Copy whole brief button                         | Copy as Markdown                                                                                                                                                                  |
| Copy agent prompt button                        | Copy agent prompt                                                                                                                                                                 |
| Copy agent prompt success toast                 | Agent prompt copied. Paste it into Claude Code, Cursor, or your coding agent.                                                                                                     |
| Download handoff brief action                   | Download                                                                                                                                                                          |
| Conversation message on completion              | Handoff brief generated by {user} for spec version {n}, scope: {scope label}.                                                                                                     |
| Agent prompt section header (in rendered brief) | Copyable agent prompt                                                                                                                                                             |
| Agent prompt section preamble                   | Copy the block below and paste it into your coding agent. It contains everything the agent needs to implement the in-scope components consistently with this architecture.        |
| Risks-and-known-unknowns section preamble       | The following items are deliberately not resolved in this design. Coding agents implementing this code should surface these back to the team rather than picking a path silently. |
| Known traps section preamble                    | Choices the team has already considered and rejected, or known mistakes implied by the design.                                                                                    |

The "Copy agent prompt" toast copy is deliberate. It names the agents explicitly. This is one of the few places in the product where the persona document's "give coding agents the architecture they need" promise is delivered in user-facing copy. The toast is the moment the user realizes the brief produced exactly what they came for.

The agent prompt section preamble is also deliberate. It tells the user *how* to use the prompt, in a single sentence. The persona is technical enough to know what a coding agent is; they need a one-line direction, not a tutorial.

### Error Handling

* Spec version not found (extremely rare, would indicate database integrity issue): the user sees "Source spec version no longer available" with a retry that re-selects the spec version.
* Canvas snapshot fetch failure: the brief is marked failed with a retry option. The Postgres row is preserved for debugging.
* Section validation failures: per spec 06's pattern, single-section failures produce a partial brief. The status badge shows "Partial."
* Copyable agent prompt section failure (the most critical single section): the brief is still produced, but with a placeholder for the agent prompt section noting "Agent prompt generation failed. Retry generation to produce it." This is one of the few cases where a partial brief should probably be regenerated rather than used — the copy reflects this.
* Scope configuration with zero in-scope components: the API rejects with "Scope must include at least one component." The dialog surfaces this inline.
* Concurrent handoff generation for the same spec version: allowed. Multiple briefs from the same spec version with different scopes are valid and useful.
* Project access lost mid-generation: same handling as spec 06 — the task completes, the brief is recorded, the user without access cannot view it.
* Blob fetch failure during view: same handling as spec 06 — placeholder message with retry.

### Scope Limits

* No agent-specific prompt variants. Per-agent tuning (Cursor-specific frontmatter, Claude Code MCP markers, etc.) is post-launch.
* No direct agent execution from Arqitect. The brief produces a prompt; the user takes it elsewhere.
* No handoff brief editing. Like specs, briefs are generated and immutable.
* No automatic regeneration when the source spec changes. Briefs are explicit user actions.
* No iteration loops where agent output flows back into Arqitect.
* No multi-language prompt generation. English only.
* No fine-grained scope options beyond the four configured types. Custom selection covers the long tail.
* No prompt analytics (how often each section gets used by agents, etc.). Out of scope until the product has scale.
* No external delivery integration (post the prompt to a GitHub PR comment, etc.).
* No prompt size optimization tooling. The LLM is responsible for fitting in a reasonable token budget; if the prompt is too long, the user trims the brief themselves before copying.

### Architecture Alignment Check

| Architecture invariant                                                              | This spec                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1. Request handlers do not run AI work                                              | Brief generation runs as a Trigger.dev task; API endpoints handle queueing only.           |
| 2. Metadata and large artifacts in separate layers                                  | `HandoffBrief`in Postgres; Markdown content in Blob; consistent with spec 06's pattern.  |
| 3. Auth and ownership at every mutation boundary                                    | All endpoints validate project access.                                                     |
| 6. Canvas snapshot is source of truth for visual structure and metadata             | Generation reads from the same frozen canvas snapshot as the source spec version.          |
| 8. Generated Markdown artifacts are immutable once written                          | Handoff briefs are immutable; regeneration produces new artifacts.                         |
| 10. Spec records reference canvas snapshot, decision log state, conversation cursor | Handoff briefs inherit the source spec's frozen context; reproducibility is preserved.     |
| 11. Canvas snapshots are append-only                                                | No new snapshots are created by handoff generation — it reads the source spec's snapshot. |
| 12. Generation reads from captured snapshot, not live room                          | Same pattern; the handoff brief is reproducible from the spec version + scope config.      |

### Persona Alignment Check

| Persona need                                                  | This spec                                                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Implementation-ready artifact for coding agents               | The handoff brief is exactly this artifact; the copyable agent prompt is its core payload.                                            |
| Cleaner specs than humans write, for coding agents            | The brief's sections are agent-tuned: compact architecture summary, structured contracts, explicit traps.                             |
| Coding-agent handoff briefs                                   | Named exactly in the product spec; delivered here.                                                                                    |
| AI-first builders' workflow                                   | The "Copy agent prompt" one-click action is the moment the workflow reaches its terminus.                                             |
| The reasoning trail survives the handoff                      | Risks become "do not silently resolve" warnings; decisions become context paragraphs; open questions appear as items to surface back. |
| Differentiation against Miro, Lucidchart, Eraser              | None of those produce a structured coding-agent handoff. This is the depth of the loop in concrete form.                              |
| Single shared canvas, single generated spec, less translation | The brief is downstream of the spec; the canvas is its ultimate source. Single source of truth.                                       |
| Architecture-to-implementation loop closes                    | The artifact that closes the loop. The product overview's success moment ends here.                                                   |

### Definition of Done

* `HandoffBrief` Prisma model exists, is migrated, and indexed.
* The `trigger/generate-handoff.ts` Trigger.dev task is implemented with the full lifecycle.
* All 10 sections have section-specific prompts and Zod schemas, including the copyable agent prompt section's specialized schema.
* The pre-flight check endpoint returns the scope preview.
* The generation endpoint creates a brief record, queues the task, and returns the run and brief IDs.
* The brief generation task reads from the source spec version's frozen canvas snapshot and decision log state.
* The scope configuration dialog implements the four scope types, the three cross-cutting toggles, and the live scope summary.
* Custom scope selection works via canvas selection while the dialog is open.
* The spec panel from spec 06 is restructured into a unified "Spec versions and handoff briefs" panel with nested handoff briefs under their source spec versions.
* The handoff brief preview renders correctly with the agent prompt section visually distinguished.
* The "Copy agent prompt" action copies only the agent prompt section via the dedicated endpoint.
* The download endpoint streams the brief with the correct filename including the brief's sequential number within its source spec.
* Section progress during generation is visible in the panel.
* Liveblocks events update the panel across all collaborators when a brief completes.
* Conversation messages are posted on brief completion via spec 04.
* Partial generation handling: single-section failures produce a `status: "partial"` brief with the failed sections listed.
* The agent prompt section failure case is handled with the appropriate placeholder.
* TypeScript and build pass.
* No regression in any prior spec.
