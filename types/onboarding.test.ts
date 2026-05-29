import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INTERVIEW_FIELDS,
  INTERVIEW_FIELD_META,
  PROMPT_STEPS,
} from "./onboarding";

describe("PROMPT_STEPS", () => {
  it("covers every interview field exactly once", () => {
    const grouped = PROMPT_STEPS.flatMap((step) => step.fields);
    assert.deepEqual([...grouped].sort(), [...INTERVIEW_FIELDS].sort());
    assert.equal(grouped.length, INTERVIEW_FIELDS.length);
    assert.equal(new Set(grouped).size, grouped.length);
  });

  it("puts the required systemGoal in the first step", () => {
    assert.equal(PROMPT_STEPS[0]!.fields[0], "systemGoal");
    assert.equal(INTERVIEW_FIELD_META.systemGoal.required, true);
  });

  it("references only known fields", () => {
    for (const step of PROMPT_STEPS) {
      for (const field of step.fields) {
        assert.ok(INTERVIEW_FIELD_META[field], `unknown field ${field}`);
      }
    }
  });
});
