import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const uiFiles = [
  "../app/sign-in/[[...sign-in]]/page.tsx",
  "../app/sign-up/[[...sign-up]]/page.tsx",
  "../components/dashboard/continue-working.tsx",
  "../components/dashboard/design-thumbnail.tsx",
  "../components/dashboard/empty-dashboard.tsx",
  "../components/editor/ai-presence-layer.tsx",
  "../components/editor/ai-sidebar.tsx",
  "../components/editor/canvas-node.tsx",
  "../components/editor/presence-cursors.tsx",
  "../components/landing/landing-page.tsx",
  "../components/landing/system-tabs-transformation.tsx",
] as const;

const hardcodedColorPattern =
  /#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;

describe("design token hygiene", () => {
  it("keeps UI color literals in the global design system", () => {
    const offenders = uiFiles.flatMap((relativePath) => {
      const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
      return Array.from(source.matchAll(hardcodedColorPattern), (match) => {
        const line =
          source.slice(0, match.index).split(/\r?\n/).length;
        return `${relativePath}:${line} ${match[0]}`;
      });
    });

    assert.deepEqual(offenders, []);
  });
});
