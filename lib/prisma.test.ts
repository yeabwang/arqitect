import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasRequiredPrismaDelegates,
  resolvePrismaDatabaseUrl,
} from "./prisma";

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
        taskRun: {},
        projectSpec: {},
      }),
      true
    );
  });
});

describe("resolvePrismaDatabaseUrl", () => {
  it("prefers the local development database URL over DATABASE_URL", () => {
    assert.equal(
      resolvePrismaDatabaseUrl(
        {
          NODE_ENV: "development",
          DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net",
        },
        () => "postgres://localhost/template1"
      ),
      "postgres://localhost/template1"
    );
  });

  it("prefers DIRECT_DATABASE_URL in development when it is set", () => {
    assert.equal(
      resolvePrismaDatabaseUrl(
        {
          NODE_ENV: "development",
          DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net",
          DIRECT_DATABASE_URL: "postgres://localhost/direct",
        },
        () => "postgres://localhost/local"
      ),
      "postgres://localhost/direct"
    );
  });

  it("uses DATABASE_URL in production", () => {
    assert.equal(
      resolvePrismaDatabaseUrl(
        {
          NODE_ENV: "production",
          DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net",
          DIRECT_DATABASE_URL: "postgres://localhost/direct",
        },
        () => "postgres://localhost/local"
      ),
      "prisma+postgres://accelerate.prisma-data.net"
    );
  });
});
