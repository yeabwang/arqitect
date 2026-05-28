# 00-D - Implementation-Ready Spec Generation

Upgrade generated Markdown specs from concise architecture summaries into implementation-ready handoff documents grounded in the canvas, chat context, metadata, and AI review findings.

## Product Intent

Arqitect's researched value is the handoff: the team should leave with a spec that engineers or coding agents can implement from. The current spec generator is useful but too close to a summary. This feature makes the generated artifact deeper, more structured, and closer to a senior engineering design document.

This unit focuses on generation quality and retrieval/display of the generated Markdown. It does not add version history, decision logs, agent packs, issue creation, or external exports.

## Current State

- `POST /api/ai/spec` triggers `generate-spec`.
- `trigger/generate-spec.ts` generates Markdown using canvas nodes, edges, and chat history.
- Generated specs are saved to Vercel Blob and recorded in Prisma `ProjectSpec`.
- Users can list, preview, and download specs from the AI sidebar Specs tab.
- The prompt currently includes overview, components, data flow, architectural notes, and open questions.

## User Story

As a tech lead, I want Arqitect to generate a practical technical spec from the canvas, so that an engineer can understand goals, components, contracts, failure modes, implementation phases, risks, and open questions without reconstructing the design discussion.

## Implementation

1. Expand the spec generation input summary.

   Update `trigger/generate-spec.ts` helpers so the user prompt includes:

   - node labels,
   - node shapes,
   - node semantic metadata from `00-B` when present,
   - edge endpoints,
   - edge labels,
   - edge semantic metadata from `00-B` when present,
   - recent chat history,
   - review findings if they are available in the chat feed or passed by the client.

   Do not add new persistence just to store generation context.

2. Improve the system prompt.

   The generated Markdown should include sections in this order:

   - `# <System Name>`
   - `## Overview`
   - `## Goals`
   - `## Non-Goals`
   - `## Users and Critical Flows`
   - `## Architecture Summary`
   - `## Components and Responsibilities`
   - `## Data Flow and Interactions`
   - `## Data Model and Persistence`
   - `## API, Event, and Integration Contracts`
   - `## Runtime and Deployment Assumptions`
   - `## Security and Access Boundaries`
   - `## Failure Modes and Resilience`
   - `## Observability`
   - `## Implementation Plan`
   - `## Risks and Tradeoffs`
   - `## Open Questions`

   The model may omit a section only if there is no defensible content. It should not invent fake details to fill a section.

3. Add grounding rules.

   The prompt should explicitly require:

   - do not invent components not present in the canvas,
   - do not invent edges not present in the canvas,
   - infer responsibly from labels, metadata, and chat,
   - mark assumptions clearly,
   - preserve unresolved questions,
   - prefer concrete implementation language over generic filler,
   - keep output as GitHub-flavored Markdown only.

4. Add a coding-agent handoff teaser section only if needed.

   Do not implement full coding-agent handoff packs in this unit. That belongs to `00-F`.

   If the generated spec includes implementation phases, they should be suitable for later extraction into agent tasks.

5. Improve filename/display metadata without changing storage architecture.

   If `ProjectSpec` currently only stores `filePath` and `createdAt`, keep that model unless a very small model change is clearly required.

   If adding `title` or `kind` is needed for a clean UI, it must be done as a narrow Prisma migration:

   - `title String?`
   - `kind String @default("technical-spec")`

   Do not store Markdown content in Prisma.

   Prefer avoiding schema changes if the current UI can derive a simple display name from createdAt/id.

6. Specs tab UI.

   Keep the existing Specs tab.

   Improve visible metadata only if available:

   - generated date,
   - short title,
   - section count or "Technical spec",
   - download action.

   Do not redesign the full sidebar.

7. Preview modal.

   Ensure the Markdown preview remains readable for longer specs:

   - scrollable body,
   - compact typography,
   - code blocks and tables remain usable,
   - download action remains visible.

8. Tests.

   Add focused tests for:

   - spec prompt includes required section names,
   - metadata fields are included in the summarized prompt when present,
   - empty metadata does not break generation,
   - route/task schemas still validate existing minimal payloads.

## Quality Bar

The spec should feel like it came from a senior engineer preparing implementation, not a generic AI summary.

It should:

- identify what is known,
- identify what is assumed,
- identify what is still open,
- explain component responsibilities,
- make implementation phases visible,
- call out failure and security concerns when evidence exists,
- avoid pretending certainty where the canvas is incomplete.

## Data Flow

1. User triggers spec generation from the Specs tab.
2. Client sends current nodes, edges, and chat history.
3. API authenticates and verifies project access from room ID.
4. API triggers `generate-spec` and records run ownership.
5. Trigger task builds a richer grounded prompt.
6. AI returns Markdown.
7. Task stores Markdown in Vercel Blob and metadata in Prisma.
8. Specs tab lists the new spec.
9. User previews or downloads the spec.

## Error Handling

- Empty canvas should return a useful error or a minimal spec with clear open questions, not a confident fake architecture.
- Empty AI output should remain a task error.
- Blob upload failure should fail the run and not leave a misleading completed status.
- Preview fetch failures should show a non-blocking error in the modal.
- Download failures should preserve the existing secure route behavior.

## Scope Limits

- Do not add versioned spec history beyond existing multiple records.
- Do not create review workflows.
- Do not create coding-agent handoff packs.
- Do not create Linear/GitHub export.
- Do not store spec Markdown in Prisma.
- Do not change auth or Blob access rules.

## Dependencies

- Existing spec generation backend.
- Existing ProjectSpec persistence.
- Existing Specs tab UI.
- Optional semantic metadata from `00-B`.
- Optional review messages from `00-C`.

## Check When Done

- Generated specs use the expanded implementation-ready structure.
- Metadata, labels, edges, and chat context are reflected when available.
- The model is explicitly constrained against inventing canvas components.
- Specs remain stored in Vercel Blob with Prisma metadata only.
- Specs tab can preview and download longer specs.
- TypeScript and build pass.
