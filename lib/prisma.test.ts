import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createPgPoolConfig,
  hasRequiredPrismaDelegates,
  isPrismaTransientConnectionError,
  isRetryablePrismaReadOperation,
  retryPrismaRead,
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
        pendingGeneration: {},
      }),
      true
    );
  });
});

describe("createPgPoolConfig", () => {
  it("serializes Prisma Postgres direct connections", () => {
    const config = createPgPoolConfig(
      "postgres://user:pass@db.prisma.io:5432/mydb?sslmode=verify-full"
    );

    assert.equal(
      config.connectionString,
      "postgres://user:pass@db.prisma.io:5432/mydb?sslmode=verify-full"
    );
    assert.equal(config.max, 1);
    assert.equal(config.connectionTimeoutMillis, 10_000);
    assert.equal(config.idleTimeoutMillis, 5_000);
  });

  it("keeps ordinary Postgres URLs on pg defaults", () => {
    const config = createPgPoolConfig("postgres://localhost/template1");

    assert.equal(config.connectionString, "postgres://localhost/template1");
    assert.equal(config.max, undefined);
  });
});

describe("Prisma read retry policy", () => {
  it("retries transient read connection failures", async () => {
    let attempts = 0;
    const result = await retryPrismaRead(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("Connection terminated unexpectedly");
        }
        return "ok";
      },
      async () => {}
    );

    assert.equal(result, "ok");
    assert.equal(attempts, 3);
  });

  it("does not retry non-transient read failures", async () => {
    let attempts = 0;

    await assert.rejects(
      retryPrismaRead(
        async () => {
          attempts += 1;
          throw new Error("Table does not exist");
        },
        async () => {}
      ),
      /Table does not exist/
    );

    assert.equal(attempts, 1);
  });

  it("retries only read operations", () => {
    assert.equal(isRetryablePrismaReadOperation("findMany"), true);
    assert.equal(isRetryablePrismaReadOperation("count"), true);
    assert.equal(isRetryablePrismaReadOperation("create"), false);
    assert.equal(isRetryablePrismaReadOperation("update"), false);
  });

  it("recognizes transient Prisma connection errors", () => {
    assert.equal(
      isPrismaTransientConnectionError(
        new Error("Connection terminated unexpectedly")
      ),
      true
    );
    assert.equal(
      isPrismaTransientConnectionError({
        message: "Connection terminated unexpectedly",
      }),
      true
    );
    assert.equal(
      isPrismaTransientConnectionError({
        message: "Connection terminated due to connection timeout",
        cause: new Error("Connection terminated unexpectedly"),
      }),
      true
    );
    assert.equal(isPrismaTransientConnectionError(new Error("P2021")), false);
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
