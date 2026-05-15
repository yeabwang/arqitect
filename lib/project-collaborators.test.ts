import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canActOnInvitation,
  formatCollaborators,
  formatInvitations,
  isInvitationForEmail,
  isValidCollaboratorEmail,
  normalizeCollaboratorEmail,
} from "./project-collaborators";

describe("normalizeCollaboratorEmail", () => {
  it("trims and lowercases emails", () => {
    assert.equal(
      normalizeCollaboratorEmail("  Partner@Example.COM  "),
      "partner@example.com"
    );
  });
});

describe("isValidCollaboratorEmail", () => {
  it("accepts a basic email and rejects malformed input", () => {
    assert.equal(isValidCollaboratorEmail("person@example.com"), true);
    assert.equal(isValidCollaboratorEmail("not-an-email"), false);
  });
});

describe("formatCollaborators", () => {
  it("enriches matching collaborator emails and falls back to email only", () => {
    const collaborators = formatCollaborators(
      [
        {
          id: "collab_1",
          email: "alice@example.com",
          createdAt: new Date("2026-05-15T00:00:00.000Z"),
        },
        {
          id: "collab_2",
          email: "unknown@example.com",
          createdAt: new Date("2026-05-15T00:01:00.000Z"),
        },
      ],
      [
        {
          fullName: "Alice Lovelace",
          imageUrl: "https://img.example.com/alice.png",
          emailAddresses: [{ emailAddress: "ALICE@example.com" }],
        },
      ]
    );

    assert.deepEqual(collaborators, [
      {
        id: "collab_1",
        email: "alice@example.com",
        createdAt: "2026-05-15T00:00:00.000Z",
        displayName: "Alice Lovelace",
        avatarUrl: "https://img.example.com/alice.png",
      },
      {
        id: "collab_2",
        email: "unknown@example.com",
        createdAt: "2026-05-15T00:01:00.000Z",
        displayName: null,
        avatarUrl: null,
      },
    ]);
  });
});

describe("canActOnInvitation", () => {
  it("allows only the invited email to act on pending invitations", () => {
    assert.equal(
      canActOnInvitation(
        { email: "invited@example.com", status: "PENDING" },
        "INVITED@example.com"
      ),
      true
    );
    assert.equal(
      canActOnInvitation(
        { email: "invited@example.com", status: "DENIED" },
        "invited@example.com"
      ),
      false
    );
    assert.equal(
      canActOnInvitation(
        { email: "invited@example.com", status: "PENDING" },
        "other@example.com"
      ),
      false
    );
  });
});

describe("isInvitationForEmail", () => {
  it("matches invitations to the invited email regardless of status", () => {
    assert.equal(
      isInvitationForEmail(
        { email: "invited@example.com" },
        "INVITED@example.com"
      ),
      true
    );
    assert.equal(
      isInvitationForEmail({ email: "invited@example.com" }, null),
      false
    );
    assert.equal(
      isInvitationForEmail(
        { email: "invited@example.com" },
        "other@example.com"
      ),
      false
    );
  });
});

describe("formatInvitations", () => {
  it("includes inviter identity when Clerk enrichment is available", () => {
    const invitations = formatInvitations(
      [
        {
          id: "invite_1",
          email: "pending@example.com",
          invitedById: "user_inviter",
          status: "PENDING",
          createdAt: new Date("2026-05-15T00:00:00.000Z"),
        },
      ],
      [
        {
          id: "user_inviter",
          fullName: "Casey Owner",
          imageUrl: "https://img.example.com/casey.png",
          emailAddresses: [{ emailAddress: "casey@example.com" }],
        },
      ]
    );

    assert.deepEqual(invitations, [
      {
        id: "invite_1",
        email: "pending@example.com",
        invitedById: "user_inviter",
        inviterName: "Casey Owner",
        inviterAvatarUrl: "https://img.example.com/casey.png",
        status: "PENDING",
        createdAt: "2026-05-15T00:00:00.000Z",
      },
    ]);
  });
});
