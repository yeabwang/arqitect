import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const componentSource = readFileSync(
  new URL("./system-tabs-transformation.tsx", import.meta.url),
  "utf8"
);
const landingPageSource = readFileSync(
  new URL("./landing-page.tsx", import.meta.url),
  "utf8"
);

describe("SystemTabsTransformation", () => {
  it("is wired into the landing page as a reusable component", () => {
    assert.match(componentSource, /export function SystemTabsTransformation/);
    assert.match(landingPageSource, /<SystemTabsTransformation \/>/);
  });

  it("defines the scroll-driven GSAP contract", () => {
    assert.match(componentSource, /useGSAP/);
    assert.match(componentSource, /ScrollTrigger/);
    assert.match(componentSource, /scrub:\s*true/);
    assert.match(componentSource, /pin:\s*true/);
    assert.match(componentSource, /end:\s*"\+=900"/);
  });

  it("includes the reduced-motion and visual state labels", () => {
    assert.match(componentSource, /prefers-reduced-motion:\s*reduce/);
    assert.match(componentSource, /WITHOUT ARQITECT/);
    assert.match(componentSource, /WITH ARQITECT/);
    assert.match(componentSource, /spec\.md · in sync/);
    assert.match(componentSource, /AI · 0 issues/);
  });

  it("exaggerates the without state with side and center screens", () => {
    assert.match(componentSource, /Slack/);
    assert.match(componentSource, /Terminal/);
    assert.match(componentSource, /Linear/);
  });
});
