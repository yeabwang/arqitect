![1780061637603](image/current-issues/1780061637603.png)

![1780062101767](image/current-issues/1780062101767.png)


![1780062306575](image/current-issues/1780062306575.png)


![1780062840504](image/current-issues/1780062840504.png)

You are improving the dashboard and onboarding/create-flow experience The current implementation feels like a demo. It needs to feel like a polished, modern, production-ready product for serious keyboard-friendly builders allowing them to use some keybord tabs for navigation and sleecting.

Use the existing project context before making decisions:

* `<span>context/arc-context</span>`
* `<span>context/project-overview</span>`
* `<span>context/ui-guide</span>`
* `<span>context/user-persona</span>`
* `<span>context/feature_specs/00-A-onboarding-success-path.md</span>`

The copy, UX, and UI language must match the product vision in those files. Do not invent generic SaaS wording. The product should feel like an intelligent architecture workspace, not a basic form builder.

## 1. Dashboard improvements

On the dashboard, remove the current large “add/create design” style sections shown in the screenshot. We already have “Add design” in the left navigation, so repeating it in the dashboard is unnecessary.

Replace those sections with important analytics/numbers that are actually useful to the user.

Also improve dashboard performance. The dashboard and create-flow pages currently feel slow and appear to rerender on every run, taking around 3 to 4 seconds. Optimize rendering, data loading, memoization, and unnecessary client-side work. These pages should feel instant.

## 2. Logo consistency

The logo is currently inconsistent across the product.

Make the logo everywhere visually consistent with the main product logo. Audit all dashboard, navigation, onboarding, create-flow, and template pages. Replace inconsistent icons or temporary logo marks with the correct shared logo component.

There should be one source of truth for the logo, not separate duplicated versions.

## 3. `<span>/dashboard/new</span>` messaging and page structure

The messaging on `<span>http://localhost:3000/dashboard/new</span>` is off.

Use the arc context, project overview, UI guide, and onboarding success path to rewrite the language. It should sound like a real product helping the user turn an idea into an implementable architecture, not like a generic demo wizard.

Remove unnecessary “Back to start” messaging/buttons when there is already an X close button in the top-right. Avoid duplicate navigation controls.

The design and language across the three create pages need to be improved. The idea is good, but the current execution feels unfinished. Make the pages modern, clean, confident, and production-ready.

## 4. Improve the guided onboarding flow

The current fixed form feels cheap and too rigid. Remove the “confidence” UI from the onboarding screen. It does not add value and makes the product feel like a demo.

Also reduce unnecessary buttons such as back, continue, and draft buttons where they create confusion. The flow should be focused, calm, and obvious.

Refer to:

`<span>context/feature_specs/00-A-onboarding-success-path.md</span>`

Use the questions and onboarding goals from that file, but group them in a smarter, more intuitive way. The design structure looks correct but it also seems demo and need serious work.

The onboarding should feel like a modern personalized conversation with a senior architect, not a normal chatbot and not a static form.

Suggested direction:

* Step 1: The user gives the arc/project a name.
* Step 2: The user explains what they are trying to build in free text.
* Step 3: A structured onboarding agent reads the user’s answer, uses the onboarding guide and product context, and asks smart personalized follow-up questions.
* The agent should behave like a senior engineer/architect who listens carefully, understands what the user wants, asks only relevant questions, and helps them clarify the system faster.
* The experience should help the user “vibe their way” through the architecture discovery process without feeling blocked by a long form.
* By the end of onboarding, the user should have a solid initial arc.
* The final step should generate a clear technical summary of the conversation, rephrased into implementable architecture language.
* After the user approves the summary, take them to the canvas.
* Pass the approved summary and detailed onboarding context to the architect agent so it can start designing the system.

This should not feel like a generic chatbot experience keep the design idea we currently have and research and come up with better way to design it render the agent response. It should feel structured, premium, and purpose-built.

## 5. Template flow redesign

The current template screen idea is good, but the flow needs to scale because we will eventually have many designs/templates.

Change the template flow into two separate steps:

### Step 1: Name the arc/project

The user first gives the design/arc/project a name. Keep this screen focused and minimal.

### Step 2: Choose a template

After clicking next, show a searchable and filterable template/design list.

The template list should be organized in a modern, tech-first way so users can quickly find what they need. It should support many templates, not just a few cards.

Improve the design cards. They should feel premium and useful, not like placeholder demo cards.

Each template card should ideally communicate:

* What the template is for
* Best-fit use case
* Architecture complexity
* Suggested stack or system type
* Relevant tags
* Short practical description
* Clear action to start from that template

The page appearance should follow the same visual direction as the improved dashboard and onboarding pages.

## 6. Keyboard-first experience

Our customers are keyboard-first builders. Refer to the user persona.

Keyboard behavior must be excellent:

* Pressing Enter should move the user to the next step when appropriate.
* In multiline text inputs, Shift + Enter should create a new line.
* Arrow keys should work naturally for navigating selectable options, templates, and steps.
* The user should be able to move through the create flow quickly without relying on the mouse.
* Focus states must be visible, modern, and polished.
* Avoid trapping focus or creating confusing tab orders.

## 7. General design direction

Across the dashboard and create/onboarding/template pages:

* Make the UI modern, clean, and high-quality.
* Avoid demo-like cards, placeholder language, generic SaaS copy, and excessive buttons.
* Reduce visual clutter.
* Make actions obvious.
* Use consistent spacing, typography, icons, and layout.
* Make the experience feel fast, serious, and ready for real users.
* Follow the product’s existing UI guide instead of creating a separate visual style.
* Treat performance as part of the product experience, not an afterthought.

## 8. Implementation expectations

Before coding, inspect the relevant existing components, routes, shared layout, navigation, logo component, and context files.

Then implement the changes cleanly:

* Reuse shared components where possible.
* Create reusable components for analytics cards, onboarding conversation UI, template search/filter UI, and keyboard navigation behavior.
* Remove unused or duplicated UI.
* Avoid adding unnecessary dependencies.
* Keep the implementation consistent with the existing architecture.
* Optimize rerenders and loading behavior.
* Make sure the pages are responsive and polished.
* Test the flow manually from dashboard to new arc creation to canvas handoff.

The final result should feel like a real architecture product for serious builders, not a prototype demo.
