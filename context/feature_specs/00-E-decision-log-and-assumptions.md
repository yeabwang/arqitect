
## Spec 05 — Canvas Metadata Editing UI

This is the fifth of nine specs. Spec 02 defined the canvas v1 metadata schema as a code-enforced contract. Spec 03 populated metadata during AI generation. Templates ship with metadata pre-filled. Until now, that metadata has been read-only from the user's perspective — it lives on the canvas, gets included in AI context, but cannot be edited or added by humans. This spec closes that gap.

### Strategic Intent

The persona document was specific about why metadata matters: it is the foundation that makes AI reasoning non-shallow and specs non-generic. The product spec reinforced this and committed to v1 fields being available at launch. Spec 02 made the schema real in code. But until users can actually edit metadata themselves, three product promises remain partially unmet:

1. **"Structured component and relationship semantics"** is in the persona document's top customer needs list. If users cannot add `componentType: "datastore"` to a node they created, or fix the `interactionMode` the AI guessed wrong on, the structured semantics are AI-only annotations rather than a shared working surface.
2. **"Architecture-focused node and edge metadata"** is a Should Have in the product spec's persona-derived requirements. It cannot be a Should Have until the editing UI exists.
3. **Spec generation (spec 06) needs metadata to be human-validated.** If the AI populated `confidence: "low"` and the user has since verified the field, only the editing UI can mark it `confidence: "high"`. Without that path, low-confidence flags accumulate forever and the spec output is increasingly cluttered with caveats the user has actually resolved.

This spec also addresses a UI tension the prior specs created. The canvas currently shows nodes and edges as simple labeled shapes. Metadata is invisible unless surfaced by spec 03's low-confidence indicators. After spec 05, metadata becomes a normal property of canvas elements — editable, visible at the right level of detail, and persistent through Liveblocks like any other canvas property.

There is also a subtler intent: this spec is where Arqitect either stays on the "system design workspace" side of the line or drifts into "form-filled diagramming tool" territory. The risk is real. If editing metadata requires filling in ten fields per node before the user can move on, the editing surface becomes friction the persona will resent. The design has to make metadata feel like progressive refinement, not data entry homework. Concretely: nothing is required, low-confidence is acceptable, and the UI surfaces the most important fields first while the rest are reachable but not in the way.

### What This Spec Delivers

A canvas metadata editing surface where:

* Selecting any node or edge opens an inspector showing its v1 metadata, with enum fields rendered as dropdowns, free-text fields as text inputs, and confidence as a small but visible control.
* All edits persist through the same Liveblocks-and-snapshot path as positions, labels, and connections.
* Edits are validated against the spec 02 Zod schema at the write boundary. Invalid values are rejected before reaching the canvas.
* Visual indicators on the canvas reflect metadata: persistence role icons on datastores, security boundary grouping, confidence markers, sync/async edge styling.
* A bulk metadata editor lets the user assign owner, lifecycle status, or security boundary across multiple selected elements.
* Quick-fill actions handle common cases: marking a generation subgraph's confidence as user-verified after review, inheriting owner from one node to its connected components.
* Metadata-driven canvas views from the architecture context (engineering, executive, implementation) are wired up using the now-editable metadata.
* The inspector links to the conversation surface so a discussion about a component is one click from its metadata.

What this spec does *not* deliver:

* v2 metadata fields (scaling concern, cost sensitivity, compliance tags, latency sensitivity, throughput, idempotency). Those are post-launch per the architecture.
* Spec generation reading the edited metadata. That is spec 06's responsibility.
* Decisions or risks attached to metadata fields. Spec 07.
* AI review of metadata gaps. Spec 08.
* Custom metadata schemas. The schema is fixed at v1; user-defined fields are not in scope.
* Bulk import of metadata from external sources.

### User Story

> As an engineering lead reviewing an AI-generated architecture with my team, when I see that the AI marked our auth service as a low-confidence "service" without specifying the runtime or owner, I want to fix that in three clicks — set runtime to "Node + Fargate", set owner to "Platform team", bump confidence to high — and have those edits propagate to my collaborators immediately. I don't want a separate metadata management page or a modal that pulls me away from the canvas.

### The Inspector

The inspector is a right-side panel that opens when a node or edge is selected. It replaces nothing — the existing AI sidebar from spec 04 remains on the right, but the inspector takes priority when a canvas element is selected. The two surfaces stack: inspector on top when selection exists, conversation behind it; deselecting closes the inspector and reveals the conversation.

This stacking choice is deliberate. The persona's editing flow is: select → inspect → edit → discuss → select something else. The conversation should always be accessible, but the inspector should dominate visual attention when an element is selected.

#### Layout

The inspector is fixed-width (320px on desktop), scrollable, with three sections from top to bottom:

**1. Header.** The element's label as an inline-editable text field, and the element type (node or edge) as a muted-foreground label. For nodes, a small icon reflects the `componentType` once set (database icon for datastores, server icon for services, queue icon for queues, etc.). For edges, the icon reflects `interactionMode` (arrow for sync, dashed arrow for async, double arrow for streaming, batch icon for batch).

**2. Primary fields.** The fields most important for the persona's success moment, displayed always-expanded:

* For nodes: `componentType`, `responsibility`, `owner`, `confidence`.
* For edges: `protocol`, `interactionMode`, `dataExchanged`, `confidence`.

These four-per-element are the fields the persona document treated as essential context. Responsibility is text; the rest are dropdowns or short inputs. Confidence sits at the bottom of the primary section as a small three-state pill (`Low` / `Medium` / `High`), not a separate concept buried elsewhere.

**3. Additional fields.** A collapsible section labeled "More architecture details." Default collapsed. Expanding it reveals the remaining v1 fields:

* For nodes: `runtime`, `persistenceRole`, `securityBoundary`, `externalDependency`, `lifecycleStatus`, `notes`.
* For edges: `producerRole`, `consumerRole`, `failureBehavior`, `securitySensitivity`, `notes`.

The collapsed-by-default design is the answer to the friction risk. A user who only wants to set component type and owner sees four fields and can move on. A user doing a thorough review expands the section. Neither is penalized.

**4. Footer.** Three actions:

* `Discuss this component` (or `Discuss this connection`) — switches to the conversation surface scoped to this element, using the targeting flow from spec 04.
* `View origin` — if the element came from a template or AI generation, this jumps to the relevant subgraph or shows the generation summary message. If it was user-created, this action is hidden.
* A small overflow menu: `Reset metadata`, `Copy metadata`, `Paste metadata`.

#### Field rendering

| Field type | UI                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Enum       | shadcn Select with the enum values from the spec 02 schema. Empty option labeled "Not set" is always available at the top. |
| String     | shadcn Input with character counter when the limit is approaching (within 50 characters of max).                           |
| Boolean    | shadcn Switch (`externalDependency`).                                                                                    |
| Confidence | Three-state pill: Low / Medium / High. Visually distinct from the dropdown style — it's a frequently-touched control.     |
| Notes      | shadcn Textarea, auto-growing, with a 1000-character counter.                                                              |

Enums show human-readable labels with the machine value in parens for the technical audience: `System of record (system_of_record)`. The internal value is what writes to the schema; the label is what the user sees in the dropdown. This is more text than a typical product would tolerate, but the persona is technical enough that the explicit values build trust ("the spec really is structured, and here's the shape").

#### Inline editing on the canvas

The element label is also editable inline on the canvas via double-click, as it already is. The inspector and inline editing stay synchronized through Liveblocks. There is no other inline metadata editing — every other field is reached through the inspector. This keeps the canvas itself uncluttered.

### Bulk Metadata Editor

A common workflow the persona document points to: an architect reviews a generated subgraph, agrees that all the services in it belong to the same team, and wants to set `owner: "Platform team"` on all of them at once. Single-element editing makes this ten clicks. The bulk editor makes it three.

#### Invocation

When two or more elements are selected, a "Bulk edit" action appears in the canvas toolbar. Clicking it opens a modal with the same field rendering as the inspector, but with these differences:

* Only fields applicable to all selected element types are shown. If the selection is mixed nodes and edges, only fields common to both are shown (which is none — so the selector forces a single type at a time). If the selection is all nodes, all node fields are shown. Same for edges.
* Each field has three states: `Don't change`, `Set to value`, `Clear`. Default is `Don't change`.
* The modal shows the count of selected elements and the field values currently distributed across them: for example, "owner: 3 elements have 'Platform team', 2 have 'Payments team', 1 is not set." This is essential — bulk operations without visibility into the current state are dangerous.
* Applying writes the changes through a single batched Liveblocks mutation.

#### Use cases the bulk editor supports

* Assigning owner across an imported template's nodes.
* Setting `lifecycleStatus: "existing"` on a brought-in template that represents the current system.
* Marking the entire generation subgraph's confidence as `high` after the user reviews it.
* Setting `securityBoundary` on a group of nodes that share the same trust zone.
* Setting `interactionMode: "async"` on all edges into a queue.

The bulk editor does not support metadata transformations (e.g., "increment confidence by one"). All bulk operations are set-or-clear.

### Canvas Visual Indicators

Metadata is most useful when the user can see it without opening the inspector. Spec 03 introduced one visual indicator: the low-confidence marker on AI-generated nodes and edges. This spec extends the visual language.

#### Node indicators

| Metadata field                           | Visual treatment                                                                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `componentType`                        | Component icon in the node's top-left corner. Standard lucide icons mapped per type.                                                                        |
| `persistenceRole = "system_of_record"` | Small "SoR" badge in the bottom-right. This is the persistence role users care about most; others get no badge.                                             |
| `externalDependency = true`            | Dashed border on the node, instead of solid.                                                                                                                |
| `confidence = "low"`                   | Existing low-confidence marker from spec 03.                                                                                                                |
| `lifecycleStatus = "planned"`          | Reduced opacity (around 0.7) — visually present but clearly not implemented.                                                                               |
| `lifecycleStatus = "deprecated"`       | Strikethrough on the label.                                                                                                                                 |
| `securityBoundary`                     | When multiple nodes share a `securityBoundary`value, an optional grouping outline can be enabled from the view controls. Off by default; see views below. |

#### Edge indicators

| Metadata field                        | Visual treatment                                                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interactionMode = "sync"`          | Solid arrow.                                                                                                                                              |
| `interactionMode = "async"`         | Dashed arrow.                                                                                                                                             |
| `interactionMode = "streaming"`     | Double-line arrow.                                                                                                                                        |
| `interactionMode = "batch"`         | Solid arrow with a small clock icon overlay.                                                                                                              |
| `failureBehavior = "dead_letter"`   | A small DLQ marker near the edge midpoint.                                                                                                                |
| `securitySensitivity = "regulated"` | Edge rendered in a distinct accent color.                                                                                                                 |
| `confidence = "low"`                | Existing low-confidence marker from spec 03 (dashed when paired with low confidence; the spec 03 marker is added on top of the interaction mode styling). |

This is a deliberate decision: the canvas reads architecture-meaningfully at a glance. A dashed line means async, not "this connection is uncertain." A dashed border means external system, not "this node is in draft." The visual language commits to architectural semantics, which is what the persona expects.

Conflicts (e.g., `interactionMode: "async"` produces dashed, and the user wants `confidence: "low"` which also wants dashed) are resolved by layering: interaction mode owns the line style, confidence adds a small marker icon at the edge midpoint.

### Metadata-Driven Views

The architecture context committed to three views derived from the canvas: engineering (full detail), executive (high-level only), and implementation (grouped by lifecycle and risk). These are read-only filter modes — they do not edit the canvas or persist separately. This spec wires them up using the now-editable metadata.

#### View switcher

A view switcher in the canvas toolbar with three modes:

* **Engineering** (default): every node and edge visible, every visual indicator on, inspector available.
* **Executive** : nodes with `componentType: "external"` hidden, edges with `securitySensitivity: "public"` simplified, indicators reduced. Inspector is read-only in this view. Useful for sharing with non-technical stakeholders.
* **Implementation** : nodes grouped visually by `lifecycleStatus` (`existing` on the left, `new` in the middle, `planned` on the right, `deprecated` faded). Edges colored by `failureBehavior` and `securitySensitivity` for risk visibility. Inspector available.

The grouping in the implementation view is rendered as a soft background partition — not a physical re-layout. The user's existing positions are preserved; the implementation view adds background bands behind them based on lifecycle. Switching views does not move nodes.

A small "View" indicator in the toolbar reminds the user when they are not in engineering view — it is easy to forget that nodes are hidden.

#### Why filters, not separate canvases

Storing three separate canvases would create three sources of truth, drift between them, and require synchronization logic. The architecture context's commitment to "derived client-side from canvas metadata" is the cheaper, more honest design. The user never has to keep three canvases consistent; they edit one.

### Synchronization and Persistence

Metadata edits flow through the same path as label, position, and connection edits.

1. User changes a field in the inspector.
2. The inspector's local component state updates immediately (optimistic).
3. The change is dispatched to the React Flow + Liveblocks layer as a node or edge update with the metadata diff.
4. Liveblocks broadcasts the change to all room participants. The participants' inspectors update.
5. The change is included in the next snapshot per the architecture's cadence rules.
6. The Zod schema from spec 02 validates the metadata at the write boundary in the server-side handlers that accept canvas mutations.

Validation runs both client-side (before optimistic update) and server-side (before persistence). The client-side validation prevents the user from typing an invalid value into a free-text field that has a length constraint. The server-side validation is the source of truth — invalid mutations are rejected and the client receives an error.

#### Conflict resolution

Two collaborators editing the same field on the same element simultaneously: last-write-wins, with the older write logged in `TaskRun` if it lost. This matches the existing canvas conflict resolution and is acceptable for v1. Architects working on the same component at the same second is rare; if it happens, the conversation surface (spec 04) is the place to coordinate.

Two collaborators editing different fields on the same element simultaneously: both writes succeed. The element's metadata reflects both changes.

### Quick-Fill Actions

The inspector overflow menu and the canvas context menu offer a small set of quick-fill actions for common patterns. Each is a structured operation, not free-form editing.

#### Verify confidence

When an element has `confidence: "low"` from AI generation, the inspector shows a prominent "Mark as verified" button next to the confidence pill. Clicking it sets confidence to `high` and posts a conversation message (spec 04) noting the verification: `{user} marked {component} as verified.` This builds a trail of which AI-suggested elements have been reviewed.

#### Inherit owner from connection

A node's context menu offers "Inherit owner from connected components." This sets the node's owner to the most common owner among its connected nodes. If there is no majority, the action is disabled with a tooltip explaining why. This handles the common case where a new node is added to an existing team's subgraph.

#### Apply template metadata pattern

A subgraph that originated from a template can be reset to the template's default metadata via the subgraph's overflow menu (the subgraph label menu from spec 02). This is useful when the user has edited the metadata significantly and wants to start over. It does not delete the nodes — only resets metadata to template defaults.

#### Reset metadata

The inspector's overflow menu offers "Reset metadata." This clears all metadata fields on the element, returning it to the bare label + position state. A confirmation dialog warns that the action cannot be undone. Spec 04's conversation gets a system event recording the reset.

These quick-fill actions are deliberately limited. The persona is technical enough to fill in fields directly; the actions exist to reduce friction for predictable patterns, not to substitute for editing.

### API Surface

The canvas metadata travels through the existing Liveblocks mutation path, so most of the work is in client UI and Liveblocks update payloads, not new HTTP endpoints. Two endpoints support the actions that need server logic:

#### `POST /api/projects/{projectId}/canvas/bulk-metadata`

Bulk metadata update. Body: `{ elementType: "node" | "edge", elementIds: string[], changes: { [field]: value | null } }`. The handler validates project access, validates each field's value against the schema, applies the change to each element via the Liveblocks server client in a single mutation, and triggers a snapshot. Returns the count of elements updated.

This endpoint exists because client-side bulk operations would require either multiple roundtrips or a complex client-side mutation batch. Server-side bulk is simpler and benefits from atomic validation: if any field value is invalid, the whole bulk fails.

#### `POST /api/projects/{projectId}/canvas/elements/{elementId}/verify`

Marks an element's confidence as `high` and posts the verification message to the conversation. Body: `{ elementType: "node" | "edge" }`. The handler validates access, updates the element's confidence, writes a conversation message via the spec 04 system, and returns success.

This endpoint is separate from generic metadata update because it has a side effect (the conversation message) that other metadata edits do not.

### Schema Additions

This spec adds no new Prisma models. The metadata lives in the canvas snapshot, which is Blob-stored. The v1 schema from spec 02 is the only schema involved.

Two small additions to existing places:

* `ConversationMessage.messageType` gains a `metadata_verification` variant, used by the verify action.
* `TaskRun.type` gains a `bulk_metadata` variant for traceable bulk operations, used by the bulk endpoint.

Neither requires migration; both are string field values.

### UI Language

* The inspector uses the same dark theme tokens as the rest of the editor. Field labels in muted-foreground, values in foreground, focused fields in accent.
* The confidence pill is the only field that uses an accent fill on selection; all other fields use border-only focus rings. The pill is the field users will touch most.
* Component type icons use lucide: `Server` for service, `Database` for datastore, `Layers3` for queue, `Zap` for cache, `Monitor` for client, `ExternalLink` for external, `PlayCircle` for job, `Network` for gateway, `Box` for other.
* Bulk editor uses a full-screen dialog (not a side panel) because it's a focused operation that benefits from the user's full attention.
* The "Mark as verified" button uses an accent fill — it's the action the persona will take most often during review.
* Edge visual indicators (dashed, double, accent color) are intentionally not configurable. The interaction-mode-owns-line-style mapping is a product opinion, not a user preference.

### Copy

| Surface                              | Copy                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| Inspector header (node, no type set) | Component                                                            |
| Inspector header (node, type set)    | {Component type human label} · {Element label}                      |
| Inspector header (edge)              | Connection · {source label} → {target label}                       |
| Primary fields section label         | Architecture                                                         |
| Collapsed additional section label   | More architecture details                                            |
| "Not set" enum option                | Not set                                                              |
| Confidence pill tooltip              | How confident is this metadata? Low values are flagged in the spec.  |
| Mark as verified button              | Mark as verified                                                     |
| Mark as verified confirmation toast  | Confidence set to high. The conversation records your verification.  |
| Discuss this component action        | Discuss this component                                               |
| Discuss this connection action       | Discuss this connection                                              |
| View origin (template)               | From template: {template name}                                       |
| View origin (AI generation)          | Generated by Arqitect                                                |
| Bulk edit toolbar action             | Bulk edit ({count})                                                  |
| Bulk edit modal title                | Edit {count} {nodes                                                  |
| Bulk edit field state: Don't change  | Don't change                                                         |
| Bulk edit field state: Set to value  | Set                                                                  |
| Bulk edit field state: Clear         | Clear                                                                |
| Bulk edit field current state format | {n} have "{value}", {n} not set                                      |
| Inherit owner action                 | Inherit owner from connected components                              |
| Inherit owner disabled tooltip       | No clear majority among connected components.                        |
| Reset metadata action                | Reset metadata                                                       |
| Reset metadata confirmation          | Clear all metadata on this {component                                |
| View switcher: Engineering           | Engineering                                                          |
| View switcher: Executive             | Executive                                                            |
| View switcher: Implementation        | Implementation                                                       |
| Non-engineering view banner          | Viewing in {view name} mode. Some elements are hidden or simplified. |

### Error Handling

* Field validation failure (client-side): inline error below the field; the optimistic update is rolled back.
* Server-side validation failure (rare, indicates client-side validation gap): the optimistic update is reverted, an error toast appears, and the field returns to its prior value.
* Liveblocks update failure: the same revert behavior. The user can retry by re-editing.
* Bulk edit partial failure: the bulk endpoint is atomic — either all changes apply or none. The user sees an error toast with the field and value that failed validation.
* Verification on an element whose confidence is not low: the button is disabled with a tooltip explaining it.
* Element deleted by another collaborator while the inspector is open: the inspector closes with a toast: "This component was removed."
* View mode active and a user attempts to edit (in executive view): the inspector is read-only; editing fields are disabled with a tooltip directing the user to engineering view.

### Scope Limits

* No v2 fields. The schema is v1 only.
* No custom fields or per-project schema extension.
* No metadata templates beyond the spec 02 template system (a node type does not auto-fill metadata; only a full template import does).
* No metadata-driven validation rules (e.g., "a service connected to a regulated datastore must have securitySensitivity set"). Spec 08's AI review will surface such issues; this spec does not enforce them.
* No metadata search or filter. The view switcher is the only filter dimension.
* No metadata change history beyond what the canvas snapshot chain preserves. Spec generation uses the latest metadata.
* No export of metadata as a standalone file. Metadata is part of the canvas snapshot and the generated spec.

### Architecture Alignment Check

| Architecture invariant                                                         | This spec                                                                                       |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 2. Metadata and large artifacts in separate layers                             | Metadata stays inside the canvas snapshot in Blob; Postgres holds no per-element metadata rows. |
| 3. Auth and ownership at every mutation boundary                               | All editing endpoints validate project access; bulk and verify endpoints do the same.           |
| 5. Canvas schema and v1 metadata contract consistent across user, template, AI | The schema is the only validation path for all sources, including user edits.                   |
| 6. Canvas snapshot is source of truth for visual structure and metadata        | Metadata edits flow through React Flow + Liveblocks and trigger snapshots per cadence.          |
| 7. AI clarify and review do not mutate the canvas                              | This spec does not touch AI write paths. User editing is independent of AI mutation rules.      |
| 11. Canvas snapshots are append-only                                           | Metadata edits trigger new snapshots; no in-place overwrites.                                   |
| The architecture context's three derived views                                 | Implemented as client-side filters over the canvas snapshot, no separate persistence.           |

### Persona Alignment Check

| Persona need                                    | This spec                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Structured component and relationship semantics | The inspector exposes the full v1 schema as a working editing surface.                                  |
| Human-editable shared canvas                    | All metadata edits propagate through Liveblocks, visible to collaborators in real time.                 |
| AI populates, humans verify                     | The verify action makes the review-the-AI workflow explicit and traceable in the conversation.          |
| Multiple views from the same design             | Engineering, executive, implementation views, all derived client-side from metadata.                    |
| Reach the success moment quickly                | Primary fields surface first; bulk editing handles common patterns in one operation.                    |
| Avoid drift between diagram and spec            | Metadata is the canvas; spec 06 will read directly from it.                                             |
| The product is not a generic whiteboard         | The visual language commits to architectural semantics: dashed for async, SoR badges, lifecycle fading. |

### Definition of Done

* The inspector renders for any selected node or edge with primary fields always visible and additional fields collapsible.
* All v1 fields from spec 02 are editable: nine fields per node, nine per edge.
* Edits propagate through Liveblocks in real time to all room participants.
* Server-side validation rejects invalid metadata before persistence.
* The bulk metadata editor handles 2+ selected elements with don't-change/set/clear semantics and atomic application.
* The verify action sets confidence to high and posts a conversation message via spec 04.
* The inherit owner and reset metadata actions work as specified.
* Canvas visual indicators reflect metadata: component type icons, SoR badges, dashed borders for external dependencies, lifecycle status opacity and strikethrough, edge styling by interaction mode, DLQ markers, regulated edge color.
* The view switcher offers engineering, executive, and implementation views with the specified filtering and grouping.
* The non-engineering view banner is visible when active.
* The inspector links to spec 04's conversation via "Discuss this" actions.
* Component view origin links route to the template subgraph or generation summary message.
* Multi-user editing of metadata works without data loss; conflicts resolve last-write-wins as specified.
* TypeScript and build pass.
* No regression in canvas editing, Liveblocks auth, template import, generation, or conversation.
