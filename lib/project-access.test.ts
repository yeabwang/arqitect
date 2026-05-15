import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasProjectAccess } from "./project-access";

describe("hasProjectAccess", () => {
  it("allows project owners", () => {
    assert.equal(
      hasProjectAccess(
        {
          ownerId: "user_owner",
          collaborators: [],
        },
        {
          userId: "user_owner",
          primaryEmail: "owner@example.com",
        }
      ),
      true
    );
  });

  it("allows collaborators by primary email", () => {
    assert.equal(
      hasProjectAccess(
        {
          ownerId: "user_owner",
          collaborators: [{ email: "collab@example.com" }],
        },
        {
          userId: "user_collab",
          primaryEmail: "COLLAB@example.com",
        }
      ),
      true
    );
  });

  it("denies users who are neither owner nor collaborator", () => {
    assert.equal(
      hasProjectAccess(
        {
          ownerId: "user_owner",
          collaborators: [{ email: "collab@example.com" }],
        },
        {
          userId: "user_other",
          primaryEmail: "other@example.com",
        }
      ),
      false
    );
  });
});
