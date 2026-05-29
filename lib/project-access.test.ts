import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasProjectAccess, resolveProjectIdentity } from "./project-access";

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
          displayName: "Owner",
          avatarUrl: null,
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
          displayName: "Collaborator",
          avatarUrl: null,
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
          displayName: "Other",
          avatarUrl: null,
        }
      ),
      false
    );
  });
});

describe("resolveProjectIdentity", () => {
  it("uses session claims when Clerk user fetch data is unavailable", () => {
    assert.deepEqual(
      resolveProjectIdentity({
        userId: "user_123",
        sessionClaims: {
          email: "architect@example.com",
          first_name: "Ada",
          last_name: "Lovelace",
        },
      }),
      {
        userId: "user_123",
        primaryEmail: "architect@example.com",
        displayName: "Ada Lovelace",
        avatarUrl: null,
      }
    );
  });

  it("prefers fetched Clerk user data when it is available", () => {
    assert.deepEqual(
      resolveProjectIdentity({
        userId: "user_123",
        sessionClaims: {
          email: "claims@example.com",
          name: "Claims Name",
        },
        user: {
          firstName: "Fetched",
          imageUrl: "https://img.example/avatar.png",
          primaryEmailAddress: { emailAddress: "fetched@example.com" },
        },
      }),
      {
        userId: "user_123",
        primaryEmail: "fetched@example.com",
        displayName: "Fetched",
        avatarUrl: "https://img.example/avatar.png",
      }
    );
  });
});
