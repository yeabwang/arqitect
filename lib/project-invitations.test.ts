import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatPendingProjectInvitations } from "./project-invitations";

describe("formatPendingProjectInvitations", () => {
  it("maps enriched invitation profiles to sidebar invitation data", () => {
    const result = formatPendingProjectInvitations(
      [
        {
          id: "invite_1",
          email: "person@example.com",
          invitedById: "user_owner",
          status: "PENDING",
          createdAt: new Date("2026-05-15T00:00:00.000Z"),
          project: { id: "project_1", name: "Project One" },
        },
      ],
      [
        {
          id: "invite_1",
          email: "person@example.com",
          invitedById: "user_owner",
          inviterName: "Owner User",
          inviterAvatarUrl: null,
          status: "PENDING",
          createdAt: "2026-05-15T00:00:00.000Z",
        },
      ]
    );

    assert.deepEqual(result, [
      {
        id: "invite_1",
        email: "person@example.com",
        invitedById: "user_owner",
        inviterName: "Owner User",
        inviterAvatarUrl: null,
        status: "PENDING",
        createdAt: "2026-05-15T00:00:00.000Z",
        projectId: "project_1",
        projectName: "Project One",
      },
    ]);
  });
});
