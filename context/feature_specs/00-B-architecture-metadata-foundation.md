
## Spec 02 — Templates as Architecture Starters

This is the second of nine specs. Spec 01 established the start-design dialog and three entry paths; the template path currently hands off to the existing template modal, which loads static canvas snapshots. This spec replaces that with structured architecture templates that start a discussion, not a drawing.

### Strategic Intent

The persona document was specific about templates: they should "include assumptions and open questions where useful so users start with an architecture discussion, not only a drawing." The product spec carried this forward, committing to templates as bundles of canvas + assumptions + open questions + suggested clarifying questions. The architecture context made this concrete: template catalog metadata in code, structured imports that materialize Postgres entities at import time.

The current implementation treats templates as static canvas JSON. That is the generic-whiteboard failure mode in miniature. Miro has templates. Lucidchart has templates. FigJam has templates. If Arqitect's templates are also "here are some pre-drawn boxes," there is no differentiation. The differentiation is that an Arqitect template carries the architectural reasoning that should already be present when a team starts from a known pattern — the assumptions baked into the pattern, the open questions every team using it has to answer, and the clarifying questions the AI should ask the moment the template lands.

This spec also establishes the canvas metadata contract in practice for the first time. Spec 05 will build the editing UI, but templates need to ship with v1 metadata populated, which means the schema must exist in code now. This spec defines and enforces it.

### What This Spec Delivers

A template system where:

* Each template is a code-defined structured bundle with canvas, metadata, assumptions, open questions, and clarifying questions.
* Importing a template materializes its assumptions and open questions as Postgres entities tied to the project.
* Imported templates are visually labeled on the canvas as a subgraph and can be inspected or removed as a unit.
* The canvas v1 metadata schema is defined in TypeScript and validated on every node and edge — user-created or template-supplied.
* A small launch library covers the patterns the persona document called out: SaaS app, AI app, event-driven backend, monolith migration, internal tool, data pipeline.
* Template selection is browsable, searchable by persona fit, and previewable before import.
* The template path from spec 01 lands the user in the template browser, not a single-modal picker.

What this spec does *not* deliver:

* AI generation. Spec 03.
* Conversation. Spec 04.
* Metadata editing UI. Spec 05. (The schema is enforced; the UI is minimal here — templates ship pre-populated and read-only metadata is acceptable as a stopgap.)
* Spec generation. Spec 06.
* Decisions, risks, review items as first-class objects. Specs 07 and 08. (Assumptions and open questions need to exist for templates to materialize into them — this spec creates the minimum schema for those two, with the broader decisions/risks model arriving in spec 07.)

### User Story

> As an architect or technical founder starting a new design, when I pick "Use template," I want to browse known architecture patterns, see what each one assumes and what questions it forces me to answer, and import the one that matches my situation — so that I start from a real architectural conversation, not a generic diagram with rectangles I have to label.

### Canvas Metadata Schema (v1, Code-Enforced)

The architecture context defined this schema as a contract. This spec is where it becomes code. It lives in `lib/canvas/metadata-schema.ts` as a Zod schema and corresponding TypeScript types.

typescript

```typescript
// lib/canvas/metadata-schema.ts

exportconstNodeComponentType= z.enum([
"service","datastore","queue","cache",
"client","external","job","gateway","other"
]);

exportconstPersistenceRole= z.enum([
"system_of_record","cache","derived","ephemeral","none"
]);

exportconstLifecycleStatus= z.enum([
"existing","new","deprecated","planned"
]);

exportconstConfidence= z.enum(["high","medium","low"]);

exportconstNodeMetadataV1= z.object({
  componentType:NodeComponentType.optional(),
  responsibility: z.string().max(500).optional(),
  owner: z.string().max(120).optional(),
  runtime: z.string().max(120).optional(),
  persistenceRole:PersistenceRole.optional(),
  securityBoundary: z.string().max(120).optional(),
  externalDependency: z.boolean().optional(),
  lifecycleStatus:LifecycleStatus.optional(),
  confidence:Confidence.optional(),
  notes: z.string().max(1000).optional(),
});

exportconstProtocol= z.enum([
"http","grpc","message_bus","database","file","other"
]);

exportconstInteractionMode= z.enum([
"sync","async","batch","streaming"
]);

exportconstFailureBehavior= z.enum([
"retry","dead_letter","fail_open","fail_closed","undefined"
]);

exportconstSecuritySensitivity= z.enum([
"public","internal","sensitive","regulated"
]);

exportconstEdgeMetadataV1= z.object({
  protocol:Protocol.optional(),
  interactionMode:InteractionMode.optional(),
  dataExchanged: z.string().max(500).optional(),
  producerRole: z.string().max(120).optional(),
  consumerRole: z.string().max(120).optional(),
  failureBehavior:FailureBehavior.optional(),
  securitySensitivity:SecuritySensitivity.optional(),
  confidence:Confidence.optional(),
  notes: z.string().max(1000).optional(),
});
```

All node and edge writes — from template import, user editing, or AI generation — pass through this schema. Invalid metadata is rejected at the write boundary, not silently coerced. Fields are optional individually, but the schema shape itself is fixed.

This is the foundation the product spec called the foundation of non-shallow AI output and non-generic specs. Locking it down now prevents it from drifting into free-text annotations later.

### Template Data Model

Templates are defined in code under `lib/templates/`. Each template is a TypeScript module exporting a typed bundle:

typescript

```typescript
// lib/templates/types.ts

exporttypeTemplate={
  id:string;// stable slug, e.g. "saas-app-multi-tenant"
  name:string;// display name
  category:TemplateCategory;// see below
  bestFitPersona:PersonaTag[];// see below
  shortDescription:string;// one line, shown in browser cards
  longDescription:string;// shown in preview, 2-4 sentences
  whenToUse:string;// shown in preview, situational fit
  whenNotToUse:string;// shown in preview, anti-fit
  canvas:TemplateCanvas;// nodes and edges with v1 metadata
  assumptions:TemplateAssumption[];// seed assumptions
  openQuestions:TemplateOpenQuestion[];// seed open questions
  clarifyingQuestions:string[];// AI posts these as conversation messages after import
};

exporttypeTemplateCategory=
|"application"// SaaS app, AI app, internal tool
|"backend"// event-driven, microservices, monolith
|"data"// pipelines, warehouses, lakehouses
|"migration"// monolith-to-services, vendor replacement
|"infrastructure";// CI/CD, serverless platform

exporttypePersonaTag=
|"engineering_lead"
|"architect"
|"technical_founder"
|"product_squad";

exporttypeTemplateCanvas={
  nodes:TemplateNode[];
  edges:TemplateEdge[];
};

exporttypeTemplateNode={
  id:string;
  label:string;
  position:{ x:number; y:number};
  metadata:NodeMetadataV1;// validated against the schema
};

exporttypeTemplateEdge={
  id:string;
  source:string;// template node id
  target:string;// template node id
  label?:string;
  metadata:EdgeMetadataV1;
};

exporttypeTemplateAssumption={
  title:string;
  description:string;
  confidence:"high"|"medium"|"low";
  linkedNodeIds?:string[];// template node ids; remapped at import
  linkedEdgeIds?:string[];
};

exporttypeTemplateOpenQuestion={
  title:string;
  description:string;
  linkedNodeIds?:string[];
  linkedEdgeIds?:string[];
};
```

A template registry in `lib/templates/registry.ts` exports `getTemplate(id)`, `listTemplates()`, and filtering helpers. Templates are validated on module load — a malformed template fails CI, not production.

### Launch Template Library

Six templates ship at launch. The persona document called these out as priority patterns, and the product spec confirmed the list. Each is a real architectural pattern with non-trivial assumptions and open questions, not a stub.

| ID                        | Name                                       | Category    | Best-fit persona                    |
| ------------------------- | ------------------------------------------ | ----------- | ----------------------------------- |
| `saas-app-multi-tenant` | Multi-tenant SaaS application              | application | engineering_lead, technical_founder |
| `ai-app-rag`            | AI app with retrieval-augmented generation | application | technical_founder, engineering_lead |
| `event-driven-backend`  | Event-driven backend with queues           | backend     | engineering_lead, architect         |
| `monolith-migration`    | Monolith-to-services migration             | migration   | architect, engineering_lead         |
| `internal-tool`         | Internal tool with auth and audit          | application | product_squad, engineering_lead     |
| `data-pipeline`         | Batch + streaming data pipeline            | data        | engineering_lead, architect         |

Each template carries between 5 and 12 nodes, between 6 and 18 edges, between 3 and 8 assumptions, between 4 and 10 open questions, and between 3 and 6 clarifying questions for the AI to post on import. These numbers are floors and ceilings, not targets — they exist to prevent stub templates and bloated templates.

An illustrative example of what an open question looks like for the `event-driven-backend` template:

> **Open question: How are message ordering guarantees enforced?**
> The template assumes per-partition ordering via a partitioned message bus. Most teams discover during implementation that they actually need stronger guarantees (global ordering for audit, exactly-once for billing) or weaker ones (out-of-order processing for analytics). This needs to be decided before producer and consumer code is written.
> Linked to: `event-bus` node, `producer-to-bus` edge, `bus-to-consumer` edge.

And a clarifying question the AI posts after import:

> "This template uses a single shared event bus. Will all your events flow through it, or do you need topic isolation between domains? If you have hard isolation requirements (compliance, blast radius), I can suggest a bounded-context layout instead."

These are not features of the spec — they are what makes templates worth shipping. The implementation team should treat the content quality of these six templates as a launch blocker, not a stretch goal. Generic templates would actively damage positioning.

### Template Import Flow

#### 1. Entry

The template path from spec 01 navigates to `/editor/[roomId]?start=template`. The editor reads `start=template` and opens the template browser instead of immediately dropping the user on the canvas.

Existing users can also access the browser via a "Import template" action in the editor toolbar.

#### 2. Browser UI

The browser is a full-screen dialog (not a sidebar) with three regions:

* **Left rail:** filters by category and best-fit persona. No search box at launch — six templates do not need search. The filter is a list of toggles, not a dropdown.
* **Center:** template cards in a two-column grid. Each card shows name, short description, category tag, and persona tags. Cards are not images — there are no template thumbnails. The card is text, with a small lucide icon matching the category.
* **Right rail:** preview of the selected template, including long description, when-to-use, when-not-to-use, a count of nodes/edges/assumptions/open questions, and a primary "Import this template" button.

The browser does not render the canvas itself in the preview. Rendering a miniature React Flow canvas in the preview pane would be expensive, fragile, and would push users toward visual evaluation when the actual signal is the assumptions and open questions. The preview is text-first by design. A "What you get" expandable section lists the node labels grouped by component type.

This is a deliberate UI choice. It signals from the first interaction that templates are architectural starting points, not pretty pictures.

#### 3. Import action

On import:

1. The client calls `POST /api/projects/{projectId}/templates/import` with the template ID.
2. The server validates project ownership.
3. The server loads the template via `getTemplate(id)`.
4. The server materializes the template:
   * Node and edge IDs are remapped from template IDs to fresh canvas IDs.
   * Linked IDs in assumptions and open questions are remapped to the new canvas IDs.
   * Nodes and edges are written into the Liveblocks room via the server client. They carry a `templateOrigin: { templateId, importedAt, subgraphId }` field on each node and edge so the import is identifiable as a subgraph.
   * Assumptions are written as `Assumption` rows in Postgres, tied to the project, with `source: "template"`.
   * Open questions are written as `OpenQuestion` rows in Postgres, tied to the project, with `source: "template"` and `status: "open"`.
   * Clarifying questions are queued as conversation messages tied to the project, marked as system-source with `awaitingDelivery: true`. (Spec 04 will deliver them through the conversation system. Until then, they sit in the queue, visible in the AI sidebar as a static list — see "Stopgap conversation handling" below.)
5. The server returns the import result with the subgraph ID.
6. The client closes the browser. A toast indicates the import succeeded and shows a "Remove this template" affordance for 30 seconds.

Imports are additive. A user can import multiple templates into the same canvas. Each gets its own subgraph ID and labeled visual grouping.

#### 4. Subgraph labeling

Imported templates are visually grouped on the canvas:

* All nodes from an import share a subtle accent color border (token-driven, not hard-coded).
* A non-interactive group label sits above the subgraph: `Imported: Multi-tenant SaaS application`. The label uses muted-foreground tokens.
* The group label has a small overflow menu with: `Remove subgraph`, `Detach from template` (removes the `templateOrigin` marker, keeping nodes and edges as user-owned), and `View template's open questions`.

Removing a subgraph deletes its nodes and edges from the canvas. The associated assumptions and open questions remain in Postgres unless the user explicitly removes them — they represent decisions and uncertainties the team may want to keep tracking even if the template structure was replaced.

### Schema Additions

Two new tables, minimal in scope. The full decisions/risks model arrives in spec 07; this spec adds only what templates need to materialize into.

prisma

```prisma
model Assumption {
  id            String   @id @default(cuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title         String
  description   String
  confidence    String   // "high" | "medium" | "low"
  status        String   @default("active")  // "active" | "validated" | "invalidated"
  source        String   // "user" | "template" | "ai"
  templateId    String?  // when source = template
  linkedNodeIds String[] // soft references
  linkedEdgeIds String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  // Clerk user ID, null for system imports
}

model OpenQuestion {
  id            String   @id @default(cuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title         String
  description   String
  status        String   @default("open")  // "open" | "resolved" | "intentionally_open"
  source        String   // "user" | "template" | "ai"
  templateId    String?
  linkedNodeIds String[]
  linkedEdgeIds String[]
  resolution    String?  // text, set when resolved
  resolvedBy    String?  // Clerk user ID
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
}
```

Soft references via string arrays match the architecture context's rule that canvas element references are soft and must be handled gracefully when targets are deleted. Spec 07 will expand these models with additional fields as needed; the shapes here are forward-compatible.

### Stopgap Conversation Handling

The clarifying questions a template ships need to land somewhere. The full conversation system is spec 04. Until then:

* Clarifying questions are stored on the project as a `pendingClarifyingQuestions: string[]` field on the `Project` model.
* The AI sidebar reads this field and renders the questions as a static list under a "Questions to consider" header.
* The list is read-only at this stage. Spec 04 will migrate these into the conversation model and make them threaded, dismissable, and answerable.

This is a deliberate stopgap, called out as such, so the implementation team does not build a parallel conversation system that conflicts with spec 04.

### Dashboard and Spec 01 Integration

Spec 01 left the template quick action and the prompt-mode interview disconnected from real template content. With this spec:

* The dashboard's `Use template` quick action lands directly in the template browser instead of the start-design dialog. (For the user, this is two clicks saved. The dialog's template path is still available for users coming from `New design`.)
* The prompt-mode interview gains an optional final field: `Most similar pattern (optional)` with a dropdown of template IDs. If selected, the `PendingGeneration` payload carries the template hint, and spec 03's AI generation can use it to seed its output. This is forward-looking — it requires no changes in spec 03 except reading the field.

### UI Language

* Dark-only, consistent with the dashboard and editor.
* shadcn/ui Dialog (full-screen variant) for the browser, Card for template tiles, Badge for category and persona tags.
* Lucide icons for category: `Layers` (application), `Server` (backend), `Database` (data), `GitBranch` (migration), `Cloud` (infrastructure).
* Imported subgraph border uses an existing accent token at low opacity. The accent should be subtle enough that imported and user-created nodes feel like one canvas, distinct enough that the group is identifiable on inspection.
* Subgraph group label uses muted-foreground and a small `Package` icon.
* No template thumbnails. No marketing-style hero in the browser. The browser feels like a technical catalog.

### Copy

| Surface                          | Copy                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Template browser title           | Choose a starting pattern                                                                         |
| Template browser subtitle        | Each pattern is a real architectural starting point, with the assumptions and questions baked in. |
| Filter rail header               | Filter by                                                                                         |
| Preview empty state              | Select a pattern to see what it assumes and what it leaves open.                                  |
| Preview section: When to use     | When to use                                                                                       |
| Preview section: When not to use | When not to use                                                                                   |
| Preview counts label             | What's in the bundle                                                                              |
| Preview counts format            | `{n} components · {n} connections · {n} assumptions · {n} open questions`                    |
| Primary import button            | Import this pattern                                                                               |
| Import success toast             | Imported. Review the assumptions and open questions before changing the architecture.             |
| Subgraph remove confirm          | Remove this template's components from the canvas? Assumptions and open questions will be kept.   |
| Detach confirm                   | Detach from the template. The components stay; they become regular canvas elements you own.       |

The toast copy is deliberate. It directs the user to the assumptions and open questions, not to the canvas. That is the behavior the persona document called the success moment for templates.

### Error Handling

* Template not found (invalid ID in URL or registry mismatch): browser shows an inline empty state, "This template is no longer available," and offers the full list.
* Template validation failure on module load: CI fails. Production cannot ship a malformed template.
* Liveblocks room not ready when import is triggered: import waits up to 5 seconds, then returns a transient error and the toast offers retry.
* Postgres write succeeds but Liveblocks write fails: import is reversed (assumptions and open questions are deleted), and the user sees a retry toast. Templates are all-or-nothing.
* Postgres write fails after Liveblocks write succeeds: the canvas nodes are removed and the user sees a retry toast. Symmetric handling.

The two-store consistency problem is real and unavoidable here. The handling above is the practical answer: try one, then the other, with rollback on failure. Idempotency keys on the import endpoint prevent duplicate imports on retry.

### Scope Limits

* No template editor or user-submitted templates. Templates are code-defined.
* No template versioning. If a template changes, existing imports are unaffected; new imports use the new version.
* No template marketplace, sharing, or organizational template libraries.
* No diff between imported template and user-modified canvas.
* No AI-generated templates. AI generation is spec 03 and operates on prompts, not on the template surface.
* No regeneration of clarifying questions after import.
* No template-specific spec generation behavior. Spec 06 will use the assumptions and open questions like any other source.

### Architecture Alignment Check

| Architecture rule                                                              | This spec                                                                                                               |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Canvas metadata schema (v1) is a code contract                                 | Defined in `lib/canvas/metadata-schema.ts`, enforced at write boundary, applied to template and user data alike.      |
| Templates carry assumptions, open questions, clarifying questions              | Honored. Template bundles include all three. Assumptions and open questions materialize as Postgres rows on import.     |
| Canvas snapshot is source of truth for visual structure and node/edge metadata | Honored. Template import writes nodes and edges into the Liveblocks room and triggers a snapshot on completion.         |
| Canvas element references on assumptions/open questions are soft               | Honored.`linkedNodeIds`and `linkedEdgeIds`are string arrays with graceful handling.                                 |
| Templates do not require a separate database table                             | Honored. Templates live in code; the registry is in-memory at runtime.                                                  |
| Auth and ownership at every mutation boundary                                  | Honored. Import endpoint validates project ownership before any write.                                                  |
| AI clarify/review does not mutate the canvas                                   | Template clarifying questions are not AI clarify output; they are template-shipped messages. The boundary is preserved. |

### Persona Alignment Check

| Persona need                                                | This spec                                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Templates that start an architecture discussion             | Templates ship with assumptions, open questions, and clarifying questions. The toast routes users to them.        |
| Templates for common patterns: SaaS, AI, event-driven, etc. | Six launch templates cover the persona document's named patterns.                                                 |
| Architecture metadata captured in the canvas                | v1 schema is enforced; templates ship pre-populated metadata on every node and edge.                              |
| Reach the success moment quickly                            | Template browser is two clicks from the dashboard. Import is a single action.                                     |
| Differentiation against generic whiteboards                 | Text-first browser, assumption-and-question emphasis, no thumbnails — the surface itself reinforces positioning. |
| Open questions and assumptions preserved as output          | Assumptions and open questions are durable Postgres rows from the moment of import.                               |

### Definition of Done

* Canvas v1 metadata schema is defined in `lib/canvas/metadata-schema.ts` and enforced at every write boundary, including template imports, user edits, and any existing AI write path.
* Template registry exports six templates, each with full canvas, metadata, assumptions, open questions, and clarifying questions, validated on load.
* `Assumption` and `OpenQuestion` Prisma models exist, migrated, and accessible through the project API surface.
* Template browser is reachable from the dashboard quick action and from the editor toolbar.
* Template browser shows category and persona filters, a card grid, and a text-first preview pane.
* Importing a template writes nodes and edges into the Liveblocks room with template origin markers, writes assumptions and open questions to Postgres, and queues clarifying questions on the project.
* Imported subgraphs are visually labeled on the canvas and can be removed or detached as a unit.
* The AI sidebar renders pending clarifying questions as a static read-only list (stopgap for spec 04).
* The prompt-mode interview from spec 01 accepts an optional "most similar pattern" field and persists it on `PendingGeneration`.
* Import failures roll back atomically across Liveblocks and Postgres.
* Cascade deletes work: deleting a project deletes its assumptions and open questions.
* TypeScript and build pass; CI fails on malformed template modules.
* No regression in canvas editing, Liveblocks auth, or project creation.
