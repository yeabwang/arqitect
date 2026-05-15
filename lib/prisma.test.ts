import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasRequiredPrismaDelegates } from "./prisma";

describe("hasRequiredPrismaDelegates", () => {
  it("rejects stale clients that do not expose the invitation delegate", () => {
    assert.equal(
      hasRequiredPrismaDelegates({
        project: {},
        projectCollaborator: {},
      }),
      false
    );
  });

  it("accepts clients with all project access delegates", () => {
    assert.equal(
      hasRequiredPrismaDelegates({
        project: {},
        projectCollaborator: {},
        projectInvitation: {},
      }),
      true
    );
  });
});
