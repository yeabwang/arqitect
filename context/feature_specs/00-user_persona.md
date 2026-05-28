# 00 - User Persona and Customer Needs

Research date: 2026-05-28

## Purpose

Arqitect is for technical teams who need to turn unclear system ideas into architecture that people and AI agents can actually build from.

The platform should not compete as a generic whiteboard. It should compete as a focused system design workspace where a team can discuss a system, let an AI co-architect structure the design, refine it on a shared canvas, and export a development-ready Markdown spec.

The core product promise:

> Describe the system. Design it with your team and AI. Leave with a canvas and a spec ready for engineers or coding agents.

## Current Product Thesis

Arqitect sits between planning and implementation:

- Before Arqitect, architecture work is scattered across chat threads, ad hoc diagrams, whiteboards, Notion docs, issue comments, and meeting notes.
- During Arqitect, the team uses one shared canvas to align on components, data flow, risks, open questions, and implementation boundaries.
- After Arqitect, the team exports a Markdown spec that preserves the decisions and can be handed to engineers, reviewers, or coding agents.

The strongest wedge is not "AI diagramming." Miro, Lucidchart, FigJam, Whimsical, Excalidraw, and Eraser all have some version of AI-assisted diagram creation.

The stronger wedge is:

- architecture-specific collaboration,
- AI-assisted critique and refinement,
- persistent design history,
- spec generation from the actual canvas and conversation,
- handoff to development and coding agents.

## Target Customer Summary

Arqitect's best early customers are engineering-heavy teams that design software systems often enough to feel the pain of stale diagrams and weak handoffs.

They are not looking for a prettier drawing tool. They are trying to reduce ambiguity before code is written.

Primary customers:

- Engineering leads planning features, migrations, and service boundaries.
- Staff engineers or architects responsible for technical direction.
- Technical founders who need to turn product ideas into implementable systems.
- Product engineering squads aligning product, backend, frontend, infra, and AI agent work.

Secondary customers:

- Consultants and agencies producing architecture deliverables for clients.
- Developer platform teams documenting internal systems.
- AI-first builders who want a clean spec before delegating work to coding agents.

Anti-personas:

- Teams that only need free-form brainstorming with sticky notes.
- Designers who primarily need visual moodboards, wireframes, or product design critique.
- Enterprise process analysts who need deep BPMN/UML governance more than implementation handoff.
- Users who only need a one-off static diagram and do not care about collaboration, decisions, or generated specs.

## Primary Persona: Engineering Lead

### Profile

The engineering lead owns delivery for a team or feature area. They need to coordinate technical decisions across engineers, product, and sometimes leadership. They usually know the system well, but their biggest problem is making the implicit architecture explicit before implementation starts.

Typical titles:

- Engineering Manager with hands-on technical ownership.
- Tech Lead.
- Staff Engineer.
- Lead Backend Engineer.
- Platform Lead.

### Situation

They are preparing a new initiative, such as:

- splitting a monolith,
- designing a new checkout flow,
- adding an event pipeline,
- replacing a vendor,
- introducing an AI feature,
- scaling a system that has become fragile,
- handing implementation to multiple engineers or coding agents.

### Jobs To Be Done

When I am planning a system change, I want to quickly turn the team conversation into a shared architecture design, so that everyone understands what we are building before implementation begins.

When I am handing work to engineers or agents, I want a precise technical spec generated from the agreed design, so that the implementer can start without reconstructing context from Slack, docs, and meetings.

When I am reviewing a design, I want the AI to surface missing pieces, risks, ambiguous ownership, and unclear data flows, so that we catch expensive mistakes early.

### Current Workarounds

- Sketch in Miro, Excalidraw, FigJam, or draw.io.
- Write a design doc in Notion, Google Docs, Linear, GitHub, or Markdown.
- Discuss tradeoffs in Slack or meetings.
- Paste context into ChatGPT or Claude for review.
- Manually rewrite the output into tickets, specs, or implementation plans.

### Pain Points

- The diagram and the spec drift apart.
- The team loses the reasoning behind decisions.
- Architecture review happens late or inconsistently.
- Static diagrams do not encode enough implementation detail.
- AI can help, but the context is fragmented and repeatedly pasted.
- Coding agents need cleaner specs than humans usually write.
- Follow-up work is hard to split because system boundaries are fuzzy.

### Clear Needs

- A fast first draft from natural language.
- A canvas that remains editable by humans.
- Collaboration with cursors, presence, comments, and decisions.
- AI that asks clarifying questions instead of only drawing boxes.
- Component and edge metadata that captures purpose, protocols, data ownership, constraints, and risk.
- A generated spec with implementation-ready sections.
- Open questions and assumptions preserved as first-class output.
- Downloadable Markdown that can live near code.

### Success Moment

The lead enters a messy prompt, reviews the AI-generated canvas with the team, fixes a few boundaries, asks the AI to identify risks, then exports a spec that an engineer or coding agent can implement from.

## Secondary Persona: Software Architect

### Profile

The architect cares about consistency, correctness, and long-term maintainability across systems. They need to document decisions, align teams, and reduce repeated architecture debates.

Typical titles:

- Software Architect.
- Solutions Architect.
- Principal Engineer.
- Enterprise Architect in smaller, software-focused orgs.
- Platform Architect.

### Jobs To Be Done

When teams propose a system design, I want a structured way to inspect the architecture, so that standards, constraints, and dependencies are visible.

When a decision is made, I want the rationale and alternatives captured, so that future teams understand why the system looks this way.

### Clear Needs

- C4-inspired views: context, container, component, deployment, and runtime flows where useful.
- Architecture decision records or decision summaries generated from the conversation.
- Risk and tradeoff review.
- Standards-aware templates for common patterns.
- Governance without forcing heavyweight modeling.
- Exportable artifacts that can be stored with the codebase.

### Success Moment

The architect can review a team's canvas, ask Arqitect to call out missing failure modes or ambiguous ownership, and leave with a spec plus decision trail.

## Secondary Persona: Technical Founder or CTO

### Profile

The founder or CTO needs to move from idea to build plan quickly. They may be technical, but they are context switching across product, hiring, customers, and implementation.

Typical titles:

- Technical Founder.
- CTO.
- Solo builder.
- Fractional CTO.
- AI-first product builder.

### Jobs To Be Done

When I have a product idea, I want to turn it into a credible technical architecture, so that I can estimate scope, explain it to collaborators, and start building.

When I use coding agents, I want to give them a strong implementation spec, so that they produce less throwaway code.

### Clear Needs

- Guided prompting for incomplete ideas.
- Simple templates for common SaaS, AI, workflow, marketplace, and internal tool architectures.
- Plain-English explanations of tradeoffs.
- Implementation phases, dependencies, and risks.
- Handoff-ready specs for human developers and AI coding agents.

### Success Moment

The founder starts with a vague product concept and ends with a practical architecture, open questions, and a spec that can become a development plan.

## Secondary Persona: Product Engineering Squad

### Profile

The squad needs shared understanding across product, design, frontend, backend, infra, and QA. They do not all need deep architecture notation, but they need to understand how the system works.

Typical titles:

- Product Manager.
- Full-stack Engineer.
- Backend Engineer.
- Frontend Engineer.
- Designer working close to engineering.
- QA or release owner.

### Jobs To Be Done

When the team is preparing a feature, we want a shared system view, so that product behavior, technical constraints, and implementation boundaries align.

When implementation starts, we want the architecture spec to be understandable by different functions, so that fewer assumptions are hidden in one person's head.

### Clear Needs

- Shared workspace with live collaboration.
- Multiple levels of detail for different audiences.
- Human-readable labels and explanations.
- Spec sections that map design choices to product behavior.
- Open questions visible before sprint planning.
- Export to Markdown, Linear/GitHub issues, or agent prompts in future versions.

### Success Moment

The team can look at one canvas and one generated spec before sprint planning and agree on what is in scope.

## Buyer and User Distinction

The first daily users are likely engineers and technical founders. The buyer, once teams are involved, is likely an engineering leader, CTO, or platform owner.

Buying triggers:

- New product or feature architecture.
- Re-architecture or migration.
- Scaling incident that exposes undocumented system boundaries.
- Adoption of coding agents.
- Onboarding new engineers.
- Distributed team needing async architecture review.
- Documentation cleanup before enterprise sales, compliance, or customer handoff.

## Competitive Research

### Miro

Source: [Miro diagrams](https://miro.com/capabilities/diagrams/)

Observed strengths:

- Broad collaborative workspace.
- AI-powered diagramming.
- Strong templates and team workflow positioning.
- Large integration ecosystem.
- Recent positioning around translating specs into code with Claude Code, Cursor, GitHub Copilot, and MCP.

Implication for Arqitect:

Miro is broad and increasingly AI-aware. Arqitect should not claim "AI diagramming" as a defensible differentiator by itself. The distinction must be narrower and deeper: system architecture reasoning, structured canvas data, decision capture, and spec output built for implementation.

### Lucidchart

Source: [Lucid AI diagramming](https://www.lucidchart.com/pages/use-cases/diagram-with-AI)

Observed strengths:

- Mature diagramming controls.
- Conditional formatting, custom shape libraries, data and automation features.
- Enterprise collaboration and integrations.
- AI diagram creation, sharing, and summarization.

Implication for Arqitect:

Lucidchart wins where organizations need formal diagramming depth and enterprise controls. Arqitect should win where teams need to move from architecture discussion to buildable spec faster, with less ceremony.

### draw.io / diagrams.net

Sources: [draw.io features](https://www.drawio.com/features), [draw.io editor guide](https://www.drawio.com/doc/getting-started-editor)

Observed strengths:

- Free and open source.
- No account required.
- Security-first posture where users choose storage.
- Works online, offline, and across integrations.
- Real-time collaboration via supported storage providers.
- Deep shape libraries and familiar diagram editor patterns.

Implication for Arqitect:

draw.io is hard to beat on price, portability, and user control. Arqitect should not optimize for "more shapes." It should optimize for intelligence, collaboration context, and generated architecture artifacts.

### Excalidraw

Sources: [Excalidraw GitHub](https://github.com/excalidraw/excalidraw), [Excalidraw Plus](https://plus.excalidraw.com/)

Observed strengths:

- Extremely fast sketching.
- Hand-drawn visual style that feels informal and low-friction.
- Real-time collaboration.
- End-to-end encryption and local-first support in the open-source app.
- Good fit for quick explanation and early exploration.

Implication for Arqitect:

Excalidraw is excellent for fast visual thinking. Arqitect should preserve the low-friction feel while adding more structure after the initial sketch: component semantics, relationship metadata, decisions, risk review, and spec generation.

### Eraser

Sources: [What is Eraser?](https://docs.eraser.io/docs/what-is-eraser), [Eraser AI diagrams](https://docs.eraser.io/docs/ai-diagrams), [Eraser codebase diagrams](https://docs.eraser.io/docs/codebase-diagrams)

Observed strengths:

- Engineering-native docs and diagrams.
- Markdown and diagram-as-code.
- AI diagrams from natural language or code snippets.
- GitHub adjacency.
- CI integration that keeps diagrams updated from code changes.

Implication for Arqitect:

Eraser is the closest conceptual competitor. Arqitect should differentiate through real-time collaborative architecture canvases, AI as a design partner, and generated specs from the whole project conversation, not only diagram-as-code.

### Whimsical

Source: [Whimsical AI guide](https://whimsical.com/learn/get-started/ai)

Observed strengths:

- Prompt-based generation for flowcharts, mind maps, sticky notes, and sequence diagrams.
- Friendly ideation surface.
- Fast structured visuals from simple prompts.

Implication for Arqitect:

Whimsical is useful for lightweight thought organization. Arqitect should go deeper into software architecture artifacts, implementation constraints, and developer handoff.

### FigJam

Source: [FigJam](https://www.figma.com/figjam/)

Observed strengths:

- Broad team whiteboard.
- Strong templates for meetings, planning, and collaboration.
- AI features for templates, visuals, sorting, summarization, and action items.
- Positioning around visualizing what coding agents are building.

Implication for Arqitect:

FigJam reinforces that AI agents are becoming part of planning workflows. Arqitect should be explicit that it helps teams create the architecture and spec that guide those agents.

## Market Pattern

The market is moving in three directions at once:

- Generic whiteboards are adding AI and coding-agent narratives.
- Diagramming tools are adding AI diagram generation and summarization.
- Engineering-native tools are connecting docs, diagrams, code, and CI.

This means Arqitect needs a sharper point of view:

Arqitect is not where teams brainstorm everything. It is where teams design software systems well enough that the design can be reviewed, shared, and implemented.

## Differentiation Strategy

### 1. Own the architecture-to-implementation loop

The product should make this loop obvious:

1. Prompt the system.
2. AI drafts architecture on canvas.
3. Team edits and discusses.
4. AI critiques risks and asks clarifying questions.
5. Team resolves decisions.
6. Arqitect generates a Markdown spec.
7. Engineers or coding agents implement from that spec.

### 2. Treat the canvas as structured architecture data

Every node and edge should eventually carry more than visual attributes.

Recommended node metadata:

- component type,
- responsibility,
- owner,
- runtime,
- persistence role,
- external dependency,
- security boundary,
- scaling concern,
- lifecycle status.

Recommended edge metadata:

- protocol,
- sync or async,
- data exchanged,
- producer and consumer,
- failure behavior,
- latency sensitivity,
- security sensitivity,
- confidence level.

This gives the AI enough structure to produce better specs and reviews.

### 3. Make AI a co-architect, not a magic drawing button

The AI should:

- ask clarifying questions when the prompt is underspecified,
- propose architecture alternatives,
- explain tradeoffs,
- detect single points of failure,
- flag missing data stores, queues, auth boundaries, observability, and ownership,
- convert accepted decisions into spec sections,
- preserve unresolved questions.

### 4. Generate specs that are useful for implementation

The generated Markdown should be stronger than a generic summary.

Recommended spec sections:

- Overview.
- Goals and non-goals.
- User journeys or critical flows.
- Architecture diagram summary.
- Components and responsibilities.
- Data model and persistence.
- API, event, and integration contracts.
- Runtime and deployment assumptions.
- Security and access boundaries.
- Failure modes and resilience.
- Observability.
- Implementation phases.
- Open questions.
- Risks and tradeoffs.
- Coding-agent handoff brief.

### 5. Preserve decisions and assumptions

Architecture is not only the final diagram. It is also the reasoning.

Arqitect should capture:

- decisions made,
- alternatives rejected,
- assumptions,
- constraints,
- unresolved questions,
- reviewers,
- timestamps,
- AI suggestions accepted or dismissed.

This aligns with architecture decision record practice, where decision context helps future engineers understand why the system exists as it does. Google Cloud's ADR guidance emphasizes context, options, decisions, reasons, and storing Markdown near code.

Source: [Google Cloud ADR overview](https://docs.cloud.google.com/architecture/architecture-decision-records)

## Customer Needs Ranked

1. Fast architecture draft from natural language.
2. Human-editable shared canvas.
3. Real-time team collaboration.
4. AI critique and clarifying questions.
5. Structured component and relationship semantics.
6. Handoff-ready Markdown spec.
7. Open questions and assumptions preserved.
8. Templates for common system patterns.
9. Export paths to code, docs, and issue trackers.
10. Security and access controls for sensitive architecture.

## Product Requirements Derived From Personas

### Must Have

- Prompt-to-canvas generation.
- Shared real-time canvas.
- Manual node and edge editing.
- Starter architecture templates.
- Spec generation from current canvas and chat context.
- Persistent project workspace.
- Authenticated project ownership and collaboration.
- Downloadable Markdown spec.

### Should Have

- AI review mode for risks, assumptions, missing pieces, and tradeoffs.
- Guided questions before generation when prompts are vague.
- Architecture-focused node and edge metadata.
- Multiple views from the same design: executive summary, engineering architecture, implementation plan.
- Decision log generated from chat and canvas changes.
- Versioned spec history.
- Comments and review workflow.
- Import/export with common diagram formats where feasible.

### Could Have

- Coding-agent handoff packs.
- GitHub/Linear issue creation from spec sections.
- ADR generation.
- C4 view generation.
- Codebase ingestion to compare planned vs actual architecture.
- CI check for architecture drift.
- Organization-level architecture library.

### Should Not Prioritize Early

- General whiteboard features unrelated to system design.
- Deep visual design tooling.
- Heavy BPMN/UML governance.
- Complex enterprise admin before team usage is validated.
- A huge icon library as the main value proposition.

## Recommended Onboarding

The first-run flow should help users reach the success moment quickly:

1. Create a design.
2. Choose one path: blank canvas, starter template, or AI prompt.
3. If AI prompt is selected, ask for system goal, users, core flows, data stores, and constraints.
4. Generate the first canvas.
5. Show suggested review prompts: "Find risks", "Ask clarifying questions", "Generate spec".
6. Encourage the user to invite collaborators before finalizing.
7. Generate and download the Markdown spec.

The onboarding should avoid teaching every canvas tool first. The customer came for a buildable architecture, not a drawing tutorial.

## Recommended Landing Page Messaging

Current landing direction is strong: "Prompt -> canvas -> spec."

Sharper positioning:

- "Design software systems an AI can implement from."
- "Turn architecture conversations into developable specs."
- "One shared canvas. One generated spec. Less translation before code."
- "Not another whiteboard. A system design workspace for engineering teams."
- "Give coding agents the architecture they need before they write code."

Avoid:

- Generic "AI diagramming" claims.
- Over-broad collaboration language.
- Too much focus on visual polish.
- Claims that imply fully autonomous architecture correctness.

## Key Product Risks

### Risk: The product feels like a generic whiteboard

Mitigation:

- Make AI review, metadata, and spec generation central.
- Use architecture-specific templates and prompts.
- Show the spec output early in the product experience.

### Risk: AI output looks plausible but shallow

Mitigation:

- Require clarifying questions for underspecified prompts.
- Include assumptions, confidence, and open questions.
- Prefer reviewable suggestions over silent changes.

### Risk: Generated specs are too generic for implementation

Mitigation:

- Enrich canvas data with structured metadata.
- Include contracts, data flows, failure modes, and implementation phases.
- Add a coding-agent handoff section.

### Risk: Competitors add similar AI features

Mitigation:

- Build depth around system architecture workflows, not generic diagrams.
- Make the canvas and spec a synchronized source of truth.
- Capture decisions and collaboration history as proprietary context.

## Success Metrics

Early activation:

- User creates first design.
- User generates or imports first canvas.
- User edits at least one node or edge.
- User generates first spec.

Collaboration:

- User invites collaborator.
- More than one user edits a project.
- Comments or decisions are created in future review workflow.

Quality:

- User downloads or copies generated spec.
- User regenerates spec after canvas edits.
- User accepts AI review suggestions.
- User returns to continue an existing design.

Business signal:

- Teams use Arqitect before implementation planning.
- Specs are attached to tickets, pull requests, or agent sessions.
- Users create multiple designs per workspace.

## Open Questions

- Should Arqitect target coding-agent users explicitly on the first landing page, or keep that as a secondary proof point?
- Should the first spec format optimize for human engineering review, coding-agent handoff, or both?
- Which architecture templates matter most for launch: SaaS app, AI app, event-driven backend, marketplace, internal tool, data pipeline, or migration plan?
- Should Arqitect eventually import diagrams from Miro, Lucidchart, draw.io, or Excalidraw, or is export-only enough at first?
- How much architecture metadata should be visible in the initial UI before it feels too heavy?

## Product Principle

Arqitect should help teams leave the design phase with less ambiguity than they entered with.

Every product choice should support one of these outcomes:

- clearer architecture,
- fewer missed risks,
- stronger implementation handoff,
- better shared understanding,
- less diagram/spec drift.
