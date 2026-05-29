
# Spec 07 — Decisions, Risks, and the Complete Reasoning Trail

This is the seventh of nine specs. Spec 02 created `Assumption` and `OpenQuestion` as first-class Postgres entities. Spec 04 added the conversation → entity promotion flow for both. Spec 06 generated specs that include both, with placeholder sections for the two entity types that did not yet exist: decisions and risks. This spec completes the four-entity model the product spec promised.

### Strategic Intent

The product spec was specific that decisions, assumptions, risks, and open questions are four distinct first-class objects with different fields, not a single bucket of project annotations. The persona document was even clearer about why: "Architecture is not only the final diagram. It is also the reasoning." A team that ends up with the right diagram but cannot reconstruct why it looks that way has not produced a maintainable design — they have produced a snapshot that will erode the moment context shifts.

Three product promises converge in this spec:

**The reasoning trail.** A future engineer asking "why does the payment service own retry logic instead of the order service" should find that question in the project's open questions, the discussion in the conversation, the chosen approach in the decisions, and the residual risk (if any) in the risks. The four entities are the bones of that trail.

**Spec generation completeness.** Spec 06 generated 14 of 16 canonical sections. The Decisions and Rationale section was stubbed; the Risks and Tradeoffs section was sparse. After this spec, both populate from real data, and the spec output is no longer "almost the full thing" — it is the full thing.

**Architecture Decision Record practice.** The persona document explicitly aligned with ADR practice: "decisions made, alternatives rejected, assumptions, constraints, unresolved questions, reviewers, timestamps." The product spec's decision model carries this through. This spec is where the schema and UI become real. Engineering leads and architects (the primary persona) recognize the pattern; technical founders learn it by using the product.

There is a subtler intent in this spec's structure: it is the spec that makes the conversation feel like architecture work, not chat. Before this spec, a user discussing tradeoffs in the conversation surface has nowhere durable to land the outcome. They can promote a message into an open question (spec 04) or an assumption (spec 04). They cannot record a decision or a risk. The result is that conversations end without a structured outcome, and the canvas stays disconnected from the discussion. This spec closes that gap by making every kind of architecture conclusion expressible as a persistent entity tied to the design.

### What This Spec Delivers

A complete first-class entity model for architecture reasoning:

* `Decision` and `Risk` Prisma models with the field shapes specified in the product spec and architecture context — `Decision` carrying options considered, rationale, alternatives rejected, and status; `Risk` carrying severity, likelihood, and status.
* The promotion flow from spec 04 extended to support decisions and risks alongside assumptions and open questions.
* A unified "Architecture entities" panel in the editor that surfaces all four entity types in one place, with filtering, linking to canvas elements, and inline editing.
* The conversation surface gains the ability to convert any discussion thread into a decision, with the full thread captured as the decision's deliberation trail.
* Spec generation reads the new entities and populates the previously-stubbed Decisions and Rationale section and the previously-sparse Risks and Tradeoffs section.
* The architecture context's Invariant 13 gating extends to risks with `severity: blocker` and `status: open`, matching the same gate that applies to blocker review items.
* A small but important UI affordance: each entity displays its provenance (source conversation message, source canvas element, source AI task), so the reasoning is always traceable back to where it originated.

What this spec does *not* deliver:

* Review items as a unified primitive for human comments and AI findings. Spec 08. The review item primitive exists from spec 04 in a basic form; spec 08 adds severity, AI-source unification, and the full gating system. This spec uses the review item primitive as-is and treats spec 08's expansion as a separate concern.
* AI-generated decisions or AI-generated risks. AI surfaces these only through the review item primitive (spec 08). The decision and risk entities in this spec are user-created or template-supplied.
* ADR-style standalone document export. The product spec listed ADR document generation as a Could Have ("Decisions and rationale will be added when the decision tracking feature ships" is what spec 06's placeholder says, and that resolution happens here — but as a section of the main spec, not a separate ADR file). Standalone ADRs are out of scope for v1.
* Decision dependency graphs (decision X supersedes decision Y). The `status: superseded` field exists, but the UI for managing supersession is minimal in v1: a textual "supersedes" reference, not a graph.

### User Story

> As a staff engineer reviewing a system design with my team, when we agree that the payment service should own retry logic instead of the order service, I want to capture that decision — with the options we considered, the alternatives we rejected, and the reasoning — right next to the components it affects. When I look at this design six months from now, or when a new engineer joins the team, the decision and its context should be one click from the canvas.

### The Decision Entity

prisma

```prisma
model Decision {
  id                String    @id @default(cuid())
  projectId         String
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  title             String    // Short, declarative. "Payment service owns retry logic."
  context           String    // What problem or question motivated this decision.
  decision          String    // The chosen approach, stated in present tense.
  rationale         String    // Why this approach was chosen.
  optionsConsidered Json      // Array of { title, description, prosAndCons } objects
  alternativesRejected Json   // Array of { option, reason } objects — the alternatives we explicitly rejected

  status            String    @default("proposed")
  // "proposed" | "accepted" | "superseded"

  supersededBy      String?   // Decision.id of the decision that supersedes this one
  supersedes        Decision? @relation("DecisionSupersession", fields: [supersededBy], references: [id], onDelete: SetNull)
  supersededByDecisions Decision[] @relation("DecisionSupersession")

  source            String    // "user" | "template" | "conversation"
  sourceMessageId   String?   // ConversationMessage.id if promoted from conversation
  sourceMessage     ConversationMessage? @relation(fields: [sourceMessageId], references: [id], onDelete: SetNull)

  linkedNodeIds     String[]  // Soft references
  linkedEdgeIds     String[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdBy         String    // Clerk user ID
  acceptedAt        DateTime?
  acceptedBy        String?   // Clerk user ID

  @@index([projectId, createdAt])
  @@index([projectId, status])
}
```

Several field choices deserve specific justification.

**`optionsConsidered` and `alternativesRejected` are separate fields.** A naïve schema would conflate them — "options considered" being the full list and "the chosen one" being the decision. The product spec separated them deliberately. The reason: when reviewing a design six months later, the most valuable information is often not what was chosen but what was explicitly rejected and why. "We rejected event sourcing because the team's existing observability tooling doesn't support replay" is the kind of context that prevents the next team from re-litigating the same debate. Keeping rejected alternatives as a structured field, not buried in rationale prose, makes them surface in the generated spec as a list rather than getting lost.

**`optionsConsidered` is JSON, not a relational table.** Options are not entities of their own — they exist only within the context of the decision that considered them. Modeling them relationally would create dead-end rows after every decision. JSON keeps them encapsulated with the decision and matches how they will be displayed and edited.

**`status` has three values, not two.** A `proposed` decision is one the team is leaning toward but has not committed to. An `accepted` decision is one the team has committed to. A `superseded` decision is one that was accepted but later replaced. The persona document treated decisions as having lifecycles, not as binary recorded/not-recorded events. The three-state model supports this.

**`supersededBy` is a soft self-reference.** Decisions can be superseded by later decisions on the same project, but the supersession is a soft pointer — deleting the superseding decision sets the field to null on the superseded one, returning it to a kind of orphaned-accepted state. The user can then resupersede or leave it.

**`acceptedAt` and `acceptedBy` are separate from `createdAt` and `createdBy`.** A decision can be proposed by one person and accepted by another, and the gap between proposal and acceptance can be days. Tracking both is useful both for the reasoning trail and for the activity feed.

**Soft references on `linkedNodeIds` and `linkedEdgeIds`.** Same pattern as the other entities. A node can be deleted; the decision about that node stays, marked with "target removed" in the UI.

### The Risk Entity

prisma

```prisma
model Risk {
  id                String    @id @default(cuid())
  projectId         String
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  title             String
  description       String

  severity          String    // "info" | "suggestion" | "blocker"
  likelihood        String    // "low" | "medium" | "high"

  status            String    @default("open")
  // "open" | "mitigated" | "accepted" | "resolved"

  mitigation        String?   // Set when status = "mitigated". How the risk is being mitigated.
  acceptanceReason  String?   // Set when status = "accepted". Why the team chose to accept the risk.

  source            String    // "user" | "template" | "conversation"
  sourceMessageId   String?
  sourceMessage     ConversationMessage? @relation(fields: [sourceMessageId], references: [id], onDelete: SetNull)

  linkedNodeIds     String[]
  linkedEdgeIds     String[]
  linkedDecisionId  String?   // A risk can be tied to a specific decision (e.g., "this decision creates risk X")
  linkedDecision    Decision? @relation(fields: [linkedDecisionId], references: [id], onDelete: SetNull)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdBy         String
  resolvedAt        DateTime?
  resolvedBy        String?

  @@index([projectId, createdAt])
  @@index([projectId, status])
  @@index([projectId, severity])
}
```

The risk schema follows similar patterns to the decision schema, with a few risk-specific choices.

**Severity values mirror the review item primitive.** The architecture context committed to `info | suggestion | blocker` for review items in spec 08. Risks use the same vocabulary because the gating system treats them the same way: a `blocker` severity risk with `open` status gates spec generation, just as a blocker review item does. Aligning the vocabularies keeps the gating logic simple and the UI legible.

**`likelihood` is separate from `severity`.** Severity is "how bad if it happens." Likelihood is "how often." A low-likelihood, high-severity risk (a major outage that rarely occurs) is treated differently from a high-likelihood, low-severity risk (a frequent minor annoyance). The persona is technical enough to want both axes; collapsing them into a single risk-score field would lose information.

**Four-state status with mitigation and acceptance reasons.** A risk that's `mitigated` means the team has put something in place; the `mitigation` field records what. A risk that's `accepted` means the team has explicitly chosen to live with it; the `acceptanceReason` records the deliberation. A risk that's `resolved` means the underlying condition has been removed. The distinction matters in the generated spec: a mitigated risk produces a different paragraph than an accepted one.

**`linkedDecisionId` is a proper relational link, not a soft reference.** Decisions and risks have a tight coupling. "This decision introduces this risk" is a common pattern: choosing one approach over another doesn't make the rejected approach's risks vanish — it creates the chosen approach's risks. Modeling this as a relational link enables the spec generation to render the connection explicitly: "Decision X (Payment service owns retry logic) introduces Risk Y (Retry storms during downstream outages)."

### The Architecture Entities Panel

The four entities have lived in two places: assumptions and open questions have been silent Postgres rows since spec 02, surfacing only in the spec output. The conversation surface (spec 04) has had a "promote to..." action. There has been no dedicated place to see all four entity types, browse them, edit them, or understand their relationships.

This spec introduces the Architecture Entities panel: a new surface in the editor that exposes the four entities directly.

#### Layout

The panel is reached from the editor's left-side navigation (alongside the canvas itself, the spec panel from spec 06, and the conversation), not the right-side inspector area. It is a destination surface, not a context surface — the user opens it when they want to think about the design's reasoning, not when they want to think about a specific component.

The panel has three regions:

**1. Header and filters.** A header with the project name. Below it, a filter bar with toggles for the four entity types (Decisions, Assumptions, Risks, Open Questions), source (User, Template, AI, Conversation), and status (per entity type). By default, all four entity types are visible.

**2. Entity list.** Entities listed in a unified feed, ordered by `updatedAt` descending. Each entity is a card showing its title, type badge, status badge, source badge, linked canvas elements (chips), and a short snippet of the body content. Selecting an entity opens its detail view in the third region.

**3. Entity detail.** The selected entity is shown in full, with all fields editable inline. Editing is per-field — the user clicks a field, edits it, and saves. There is no "Edit mode" toggle. The detail also shows the entity's history (created, edited, status changes), its linked canvas elements (clickable, panning to the element), its source message (if promoted from conversation), and any related entities (a decision's linked risks, a risk's linked decision).

#### Why a unified panel instead of four separate ones

The persona document and product spec both treated the four entities as a family — different shapes but related purposes. Architects switch among them while reasoning about the same problem: "this open question implies an assumption, which we need to either validate or convert into a decision, and the chosen decision introduces a risk we should track." Forcing the architect to navigate between four separate UI areas would make this fluid reasoning awkward. A unified panel makes the family relationship visible and supports the cross-entity workflow.

#### Creation flows

Each entity type has a "New {entity}" action in the panel's header. The form for each is appropriately shaped:

* **New decision.** Fields: title, context, decision (the chosen approach), rationale, options considered (a repeatable subform), alternatives rejected (a repeatable subform), linked canvas elements (multi-select from canvas), status (defaults to proposed).
* **New assumption.** Same as spec 02 introduced: title, description, confidence, linked elements, status.
* **New risk.** Fields: title, description, severity, likelihood, status (defaults to open), linked canvas elements, linked decision (optional dropdown of project's decisions).
* **New open question.** Same as spec 02 introduced: title, description, linked elements, status.

The decision creation form is the most complex of the four. The options-considered and alternatives-rejected subforms are repeatable but lightweight — each row is a single-line title plus a multi-line description, with an "Add option" / "Add rejected alternative" button. The form does not require options to be filled in; a decision with no options-considered is valid (a unilateral decision is still a decision worth recording).

#### Conversation as the primary creation path

The form-based creation flows above are the explicit path. But the more common path, by design, is promotion from conversation. The spec 04 mechanism is extended in this spec to support all four entity types.

The "Promote to..." action on a conversation message now offers four options instead of two:

* Promote to open question
* Promote to assumption
* Promote to decision
* Promote to risk

The first two work as spec 04 specified. The two new ones:

**Promote to decision.** Opens the decision creation form, with the message content pre-filled in the `context` field and the title derived from the first sentence. The user fills in `decision` and `rationale` (typically a 30-second exercise — they've already discussed it in the conversation). If the message is part of a thread, the user can opt to attach the entire thread as the decision's deliberation trail — the thread messages are linked to the decision via `sourceMessageId` on the decision itself, plus a set of "deliberation messages" recorded in a Json field. This last detail captures the multi-message back-and-forth that produced the decision, not just the one message that articulated it.

**Promote to risk.** Opens the risk creation form, pre-filled similarly. The user picks severity and likelihood. The conversation message becomes the risk's `sourceMessage`.

The promotion flow is the workflow the persona will use most. A team discusses a tradeoff in the conversation, agrees on the chosen approach, and one collaborator promotes the relevant message into a decision. The conversation thread remains; the decision is now a structured entity with the conversation as its trail.

#### Editing and status changes

In-place editing on the detail view writes back through the API. Status changes (proposing → accepting a decision, opening → mitigating a risk) post a system message into the conversation, per the same pattern spec 05 used for canvas metadata verification. The conversation becomes the activity log; the panel is the current state.

A decision moving to `accepted` status sets `acceptedAt` and `acceptedBy`. The UI prompts the user with "Mark this decision as accepted?" with a brief confirmation, then writes the change.

A risk moving to `mitigated` requires a `mitigation` text. A risk moving to `accepted` requires an `acceptanceReason`. Forms enforce this.

#### Inline display on the canvas

A subtle but important UI choice: each entity's linked canvas elements show a small indicator on the canvas itself. A node linked to a decision shows a small "D" badge in the upper-right; a node linked to a risk shows an "R" badge; multiple linked entities show a count. Clicking the badge opens the inspector (from spec 05) with a new "Reasoning" tab that lists the entities linked to that element with quick-jump links to the entities panel.

This indicator makes the canvas a navigation surface for reasoning, not just a structural surface. An architect reviewing the design sees not only what is built but also where the team has recorded thinking.

The badges are visible in engineering view (from spec 05). They are suppressed in executive view (less detail) and visible in implementation view (where reasoning is most relevant). This integration with spec 05's view modes is intentional — the four entity types are part of the design surface, not adjacent to it.

### Connection to Spec 06

Spec 06 left two sections in placeholder or sparse states: Decisions and Rationale (placeholder), Risks and Tradeoffs (sparse). This spec fills them in by extending the spec generation context.

The `SpecGenerationContext` from spec 06 already captured `decisionLogState` as a Json field with assumptions and open questions. This spec adds decisions and risks to that Json structure:

typescript

```typescript
// Extended from spec 06
exporttypeSpecGenerationContext={
// ... existing fields
  decisionLogState:{
    decisions:DecisionSnapshot[];// new
assumptions:AssumptionSnapshot[];
    risks:RiskSnapshot[];// new
openQuestions:OpenQuestionSnapshot[];
};
};

exporttypeDecisionSnapshot={
  id:string;
  title:string;
  context:string;
  decision:string;
  rationale:string;
  optionsConsidered:Array<{ title:string; description:string; prosAndCons?:string}>;
  alternativesRejected:Array<{ option:string; reason:string}>;
  status:"proposed"|"accepted"|"superseded";
  supersededBy?:string;
  source:string;
  linkedNodeIds:string[];
  linkedEdgeIds:string[];
  acceptedAt?:string;
};

exporttypeRiskSnapshot={
  id:string;
  title:string;
  description:string;
  severity:"info"|"suggestion"|"blocker";
  likelihood:"low"|"medium"|"high";
  status:"open"|"mitigated"|"accepted"|"resolved";
  mitigation?:string;
  acceptanceReason?:string;
  source:string;
  linkedNodeIds:string[];
  linkedEdgeIds:string[];
  linkedDecisionId?:string;
};
```

The generation task from spec 06 (`trigger/generate-spec.ts`) already loops over sections. This spec adds the section input builders for the two newly-populated sections.

#### Decisions and Rationale section

Input: all `Decision` rows from the context, grouped by status (Accepted first, then Proposed, then Superseded). The section is generated section-by-section as spec 06 specified, with a section-specific prompt:

> Generate the "Decisions and Rationale" section from the structured decisions below. For each decision, produce a subsection with:
>
> * The title as the subsection header
> * The context as a one-paragraph problem statement
> * The decision as a stated approach in present tense, formatted as a clear declaration
> * The rationale as supporting prose
> * Options considered as a list, with each option's pros and cons
> * Alternatives rejected as a list, with each rejection's reason
> * The status as a small inline label
>
> Do not invent decisions. Do not add commentary beyond what the rationale field contains. Format consistently across decisions.

The resulting section is structured and information-dense, matching ADR practice. A team can use the section directly as their decision record, or extract individual decisions into separate ADR files if they want.

#### Risks and Tradeoffs section

Input: all `Risk` rows from the context, grouped by severity (Blocker first, then Suggestion, then Info), with status sub-grouping (Open first, then Mitigated, then Accepted, then Resolved). The section-specific prompt:

> Generate the "Risks and Tradeoffs" section from the structured risks below. For each risk:
>
> * The title and severity-likelihood as a header line (e.g., "Retry storms during downstream outages [Blocker, High likelihood]")
> * The description as a paragraph
> * If the risk has a linked decision, note that explicitly ("This risk is introduced by the decision: {decision title}.")
> * If status is "mitigated", include the mitigation text
> * If status is "accepted", include the acceptance reason
> * If status is "open", flag it as outstanding
>
> Open blocker risks should be visually emphasized in the output Markdown.
> Do not invent risks beyond what is in the input. Do not soften severity language.

The section's output is now substantive: real risks, with real status, real mitigations, and real links to the decisions that produced them.

#### Gating, extended

Spec 06's gating checked for open blocker review items and non-intentional open questions. This spec extends the gate to include open blocker risks. The `/spec-versions/check` endpoint's `gatingItems` response gains an `openBlockerRisks` field; the confirmation dialog adds the section.

The reason for extending the gate to risks is consistency: if a blocker review item flagging "no observability on this critical path" gates the spec, a blocker risk titled "No observability on critical path" should gate it for the same reason. The two primitives are similar enough in product semantics that having one gate and not the other would be incoherent.

### API Surface

#### `GET /api/projects/{projectId}/architecture-entities`

Unified read endpoint for the entities panel. Returns all four entity types in a single response, with optional type and status filters. Pagination by `updatedAt` cursor. The response is a flat list with discriminator fields, not four nested arrays — the entities panel renders them in a single feed.

#### `POST /api/projects/{projectId}/decisions`

Creates a decision. Body: the field shape from the Prisma schema, with status defaulting to `proposed`. Validates that `optionsConsidered` and `alternativesRejected` are well-formed JSON arrays. Returns the created decision.

#### `PATCH /api/projects/{projectId}/decisions/{decisionId}`

Edits a decision. Any field can be updated. Status transitions to `accepted` set `acceptedAt` and `acceptedBy`. Transitions to `superseded` require `supersededBy` to be set.

#### `POST /api/projects/{projectId}/risks`

Creates a risk. Validates severity, likelihood, status enums. Returns the created risk.

#### `PATCH /api/projects/{projectId}/risks/{riskId}`

Edits a risk. Status transitions to `mitigated` require `mitigation` text; transitions to `accepted` require `acceptanceReason` text.

#### `POST /api/projects/{projectId}/conversation/promote` (extended from spec 04)

The existing promotion endpoint from spec 04 is extended. Body now supports `entityType: "decision"` and `entityType: "risk"`. The handler:

1. Validates project access.
2. Validates the source message exists and is not deleted.
3. Constructs the new entity, with `sourceMessageId` pointing to the message and `source: "conversation"`.
4. For decisions promoted from a threaded message, the handler also captures the parent message and reply chain into the decision's `deliberation messages` Json field.
5. Returns the created entity.

The decision's `deliberation messages` field is a Json array of `{ messageId, content, authorType, createdAt }` snapshots — a frozen record of the thread that produced the decision. This means deleting conversation messages later does not erase the decision's deliberation trail. The trail is captured at promotion time and stored on the decision itself.

This is a deliberate redundancy. Conversation messages are durable, but they are also deletable (soft-deleted, but still). Decisions reference their source messages via `sourceMessageId`, but the supporting trail is also snapshotted. The persona document was unambiguous that the reasoning trail must survive — even when individual messages are removed for any reason.

#### DELETE endpoints

Each entity type has a delete endpoint that soft-deletes (sets a `deleted` flag, preserves the row). Soft deletion lets spec generation continue to reference historical entities without resurfacing them in the current state. Hard deletion is not supported in v1 — the reasoning trail is preserved.

### Schema Additions

The two new models above (`Decision`, `Risk`) plus a small addition to existing models for the supersession and decision-risk linkage:

prisma

```prisma
// Added to Decision:
deliberationMessages Json?     // Snapshotted thread at promotion time

// Added to ConversationMessage:
promotedToDecisionId  String?
promotedToRiskId      String?
// (existing: promotedToOpenQuestionId, promotedToAssumptionId)
```

The `promotedTo` fields on `ConversationMessage` allow the conversation UI to indicate when a message has been promoted to an entity. Spec 04 left this minimal; this spec completes it for all four entity types. A small badge appears on the conversation message: "Promoted to decision: {decision title}." Clicking it opens the entity in the panel.

### UI Language

* The entities panel uses card primitives consistent with the spec panel from spec 06 — same dark theme, same visual density, same iconography style.
* Type badges use distinct colors but all from the existing token system: decisions use the primary accent, assumptions a muted accent, risks a warning accent (subtle, not red), open questions a neutral accent.
* Status badges are pill-shaped, smaller than type badges. Accepted decisions are filled; proposed are outlined. Mitigated risks are filled with a small check; open risks are outlined.
* Lucide icons: `GitBranch` for decisions (the branching metaphor matches decision-making), `Lightbulb` for assumptions, `AlertTriangle` for risks (subtle, not alarming), `HelpCircle` for open questions.
* The promote-to-decision and promote-to-risk dialogs use the same dialog primitive as promote-to-open-question, with the appropriate fields swapped.
* The canvas reasoning badges (D, R, etc.) on linked elements are small, muted-foreground, in the upper-right of the node. They become accent-colored on hover.
* The decision creation form's options-considered and alternatives-rejected subforms use a compact "Add row" pattern, with each row collapsible after creation so a decision with five considered options doesn't dominate the form visually.
* The decisions section in the rendered spec output uses h3 subsections per decision, with status as a small inline label and the alternatives-rejected list using the standard Markdown unordered list format. The output is plain Markdown that renders well in any Markdown viewer.

### Copy

| Surface                                     | Copy                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Architecture entities panel header          | Architecture entities                                                                                                    |
| Panel empty state                           | No entities recorded yet. Capture decisions and risks as you design, or promote them from the conversation.              |
| New decision button                         | New decision                                                                                                             |
| New risk button                             | New risk                                                                                                                 |
| New assumption button                       | New assumption                                                                                                           |
| New open question button                    | New open question                                                                                                        |
| Decision form: title placeholder            | A short, declarative title. E.g., "Payment service owns retry logic."                                                    |
| Decision form: context label                | Context                                                                                                                  |
| Decision form: context helper               | What problem or question motivated this decision?                                                                        |
| Decision form: decision label               | Decision                                                                                                                 |
| Decision form: decision helper              | The chosen approach. State it in present tense.                                                                          |
| Decision form: rationale label              | Rationale                                                                                                                |
| Decision form: rationale helper             | Why this approach was chosen.                                                                                            |
| Decision form: options considered label     | Options considered                                                                                                       |
| Decision form: options considered helper    | The full set of approaches the team weighed. Optional, but valuable for future readers.                                  |
| Decision form: alternatives rejected label  | Alternatives explicitly rejected                                                                                         |
| Decision form: alternatives rejected helper | Approaches the team considered and explicitly chose not to take, with reasons.                                           |
| Decision form: status label                 | Status                                                                                                                   |
| Decision status: proposed                   | Proposed                                                                                                                 |
| Decision status: accepted                   | Accepted                                                                                                                 |
| Decision status: superseded                 | Superseded                                                                                                               |
| Risk form: severity helper                  | How bad if this risk materializes?                                                                                       |
| Risk form: likelihood helper                | How likely is this to occur?                                                                                             |
| Risk form: mitigation field label           | Mitigation                                                                                                               |
| Risk form: mitigation helper                | How is this risk being mitigated?                                                                                        |
| Risk form: acceptance reason label          | Acceptance reason                                                                                                        |
| Risk form: acceptance reason helper         | Why is the team choosing to accept this risk rather than mitigate it?                                                    |
| Risk form: linked decision label            | Linked decision (optional)                                                                                               |
| Risk form: linked decision helper           | If this risk is introduced by a specific decision, link it.                                                              |
| Promote-to-decision dialog title            | Capture as a decision                                                                                                    |
| Promote-to-decision explanation             | Decisions record the chosen approach, the alternatives considered, and the reasoning. They appear in the generated spec. |
| Promote-to-decision thread option           | Include the conversation thread as the deliberation trail                                                                |
| Promote-to-risk dialog title                | Capture as a risk                                                                                                        |
| Promote-to-risk explanation                 | Risks track what could go wrong. Mitigated and accepted risks appear in the generated spec with their context.           |
| Canvas badge tooltip (single entity)        | {entity type}: {entity title}                                                                                            |
| Canvas badge tooltip (multiple entities)    | {n} entities linked to this {component / connection}                                                                     |
| Inspector reasoning tab label               | Reasoning                                                                                                                |
| Inspector reasoning empty                   | No entities linked to this element yet.                                                                                  |
| Status change confirmation: accept decision | Mark this decision as accepted? The team should agree on this before proceeding.                                         |
| Status change confirmation: mitigate risk   | Mark this risk as mitigated. Briefly describe how:                                                                       |
| Status change confirmation: accept risk     | Mark this risk as accepted. The team takes ownership of the risk; briefly note why:                                      |
| Spec section header: Decisions              | Decisions and rationale                                                                                                  |
| Spec section header: Risks                  | Risks and tradeoffs                                                                                                      |
| Spec section: decision subsection header    | Decision: {title}                                                                                                        |
| Spec section: risk subsection header        | Risk: {title} [{severity}, {likelihood} likelihood]                                                                      |
| Spec section: linked decision in risk       | This risk is introduced by the decision: {decision title}                                                                |
| Promotion success toast                     | Captured as a {entity type}. View it in the architecture entities panel.                                                 |
| Gating dialog: open blocker risks           | Open blocker risks: {count}                                                                                              |

The "include the conversation thread as the deliberation trail" option is the most important new copy. It's the moment where the user understands that the conversation isn't just chat — it's becoming part of the design's history. The copy treats this as a normal capture flow, not a special feature, because the persona expects this kind of structure.

### Error Handling

* Decision creation with invalid `optionsConsidered` JSON: inline validation, schema-driven error.
* Risk status transition to `mitigated` without a mitigation text: form validation prevents submission.
* Risk status transition to `accepted` without an acceptance reason: same.
* Decision supersession pointing to a non-existent decision: validation rejects.
* Decision supersession creating a cycle: validation rejects with a specific error ("This would create a cycle of supersedence").
* Promotion from a deleted conversation message: returns 404 with a clear error.
* Linked canvas element deleted between promotion and entity load: the entity displays normally, with the linked element chip showing "Target removed." No error.
* Concurrent edits to the same entity: last-write-wins, consistent with spec 05's pattern.
* Bulk filter operations returning large result sets: the entities endpoint paginates. The UI shows "Load more" rather than infinite scroll.

### Scope Limits

* No AI-generated decisions or risks. AI surfaces these only through the review item primitive in spec 08, where the user can promote a review item into a decision or risk if they choose.
* No decision approval workflow beyond status changes. A decision moving to `accepted` does not require approval from a specific role.
* No decision templates (e.g., "Architecture Decision Record template"). The form is the template; the rendered spec section is the output.
* No risk severity calculation or scoring. The user picks severity and likelihood; the system does not compute a composite score.
* No decision/risk export as separate files. Both appear in the main generated spec.
* No relationships between decisions other than supersession. "Decision A depends on Decision B" is not modeled.
* No external integrations: no GitHub PR-bound decision references, no Notion sync of decisions, no Linear issue linkage.
* No version history for entities beyond `createdAt`/`updatedAt`. Edits replace content.
* No bulk editing or bulk status changes on entities. The unified panel is for individual entity work.

### Architecture Alignment Check

| Architecture invariant                                                               | This spec                                                                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 2. Metadata and large artifacts in separate layers                                   | Decisions and risks are Postgres entities; the deliberation trail is a Json field on the decision, sized to fit. |
| 3. Auth and ownership at every mutation boundary                                     | All entity endpoints validate project access.                                                                    |
| 9. Conversation, decisions, etc. are durable Postgres entities                       | Decisions and risks are first-class Postgres entities, matching the architecture context's requirement.          |
| 10. Spec records reference decision log state                                        | The `decisionLogState`Json on `SpecGenerationContext`now includes decisions and risks.                       |
| 13. Spec generation gated on blocker review items and non-intentional open questions | Gating extended to blocker risks in `open`status.                                                              |
| 14. Soft references handled gracefully                                               | `linkedNodeIds`and `linkedEdgeIds`are string arrays; deleted targets render as "Target removed."             |

### Persona Alignment Check

| Persona need                                        | This spec                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Architecture is the reasoning, not just the diagram | Decisions, risks, assumptions, and open questions are first-class. The unified panel exposes them all. |
| ADR-style decision capture                          | The decision schema and section output match ADR practice.                                             |
| Risk and tradeoff review                            | Risks have severity, likelihood, status, mitigation, and acceptance reasons.                           |
| Decisions preserved in the generated spec           | The Decisions and Rationale section is now populated from real entities.                               |
| Risks preserved in the generated spec               | The Risks and Tradeoffs section is now populated from real entities.                                   |
| Conversation as the input to structured outcomes    | Promotion from conversation supports decisions and risks, with thread capture for decisions.           |
| Linkage between canvas elements and reasoning       | Canvas reasoning badges; inspector reasoning tab; entities link to nodes and edges.                    |
| Future engineers can reconstruct why                | Deliberation trails are captured at promotion time; entities survive conversation message deletion.    |

### Definition of Done

* `Decision` and `Risk` Prisma models exist, are migrated, and indexed.
* `ConversationMessage` gains `promotedToDecisionId` and `promotedToRiskId` fields.
* The Architecture Entities panel renders in the editor, accessible from the left navigation, with the three regions (header/filters, entity list, entity detail).
* All four entity types appear in the unified list with type, status, and source badges.
* The list filters by type, source, and status, with sensible defaults.
* Individual entity detail views render correctly for all four types, with inline field editing.
* Decision creation form includes options-considered and alternatives-rejected subforms with add/remove rows.
* Risk creation form enforces required fields per status transition.
* Promotion from conversation works for all four entity types.
* Promotion-to-decision supports the "include thread as deliberation trail" option, snapshotting the parent message and replies into the decision.
* Canvas reasoning badges render on nodes and edges linked to one or more entities.
* The inspector's "Reasoning" tab from spec 05 displays linked entities with quick-jump links.
* Status changes post system messages to the conversation, per the spec 05 pattern.
* The `SpecGenerationContext` from spec 06 includes decisions and risks in `decisionLogState`.
* The spec generation task (`trigger/generate-spec.ts`) generates the Decisions and Rationale section from real entities.
* The spec generation task generates the Risks and Tradeoffs section from real entities, with linked decisions noted.
* The spec generation gate extends to open blocker risks, with the confirmation dialog showing them.
* Deleting a conversation message that produced a decision does not affect the decision's deliberation trail (which is snapshotted).
* TypeScript and build pass.
* No regression in any prior spec.
