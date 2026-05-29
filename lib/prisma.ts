import { existsSync, readFileSync } from "node:fs";

import { PrismaClient } from "@/app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { parse as parseDotenv } from "dotenv";
import type { Pool } from "pg";

interface CachedPool {
  url: string;
  pool: Pool;
}

interface CachedPrismaClient {
  url: string;
  client: Promise<PrismaClient>;
}

interface PrismaEnvironment {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  DIRECT_DATABASE_URL?: string;
}

type LocalDatabaseUrlReader = () => string | undefined;

let cachedPool: CachedPool | undefined;
let cachedClient: CachedPrismaClient | undefined;

const globalForPrisma = globalThis as unknown as {
  prisma: CachedPrismaClient | undefined;
};

const REQUIRED_PRISMA_DELEGATES = [
  "project",
  "projectCollaborator",
  "projectInvitation",
  "taskRun",
  "projectSpec",
] as const;

export function hasRequiredPrismaDelegates(
  client: unknown
): client is PrismaClient {
  if (!client || typeof client !== "object") {
    return false;
  }

  const delegateMap = client as Record<string, unknown>;

  return REQUIRED_PRISMA_DELEGATES.every(
    (delegate) => delegate in delegateMap && Boolean(delegateMap[delegate])
  );
}

function readLocalDatabaseUrl(): string | undefined {
  if (!existsSync(".env.local")) {
    return undefined;
  }

  const parsed = parseDotenv(readFileSync(".env.local"));
  return parsed.DIRECT_DATABASE_URL || parsed.DATABASE_URL;
}

export function resolvePrismaDatabaseUrl(
  env: PrismaEnvironment = process.env,
  readLocalUrl: LocalDatabaseUrlReader = readLocalDatabaseUrl
): string {
  const isProduction = env.NODE_ENV === "production";
  const url = isProduction
    ? env.DATABASE_URL
    : env.DIRECT_DATABASE_URL || readLocalUrl() || env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return url;
}

async function disconnectPrismaClient(client: PrismaClient): Promise<void> {
  await client.$disconnect().catch(() => {
    // Best-effort cleanup for stale dev clients after schema regeneration.
  });
}

async function createPrismaClient(url: string): Promise<PrismaClient> {
  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate()
    ) as unknown as PrismaClient;
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");

  if (!cachedPool || cachedPool.url !== url) {
    if (cachedPool) {
      await cachedPool.pool.end().catch(() => {
        // Best-effort cleanup when the local database URL changes in dev.
      });
    }
    cachedPool = { url, pool: new Pool({ connectionString: url }) };
  }
  const adapter = new PrismaPg(cachedPool.pool);

  return new PrismaClient({ adapter });
}

async function createCompatiblePrismaClient(
  url: string
): Promise<PrismaClient> {
  const client = await createPrismaClient(url);

  if (!hasRequiredPrismaDelegates(client)) {
    await disconnectPrismaClient(client);
    throw new Error(
      "Generated Prisma client is missing required project delegates. Run `npx prisma generate` and restart the dev server."
    );
  }

  return client;
}

function createCachedPrismaClient(
  url: string,
  replaceCached: (next: CachedPrismaClient | undefined) => void
): CachedPrismaClient {
  const entry: CachedPrismaClient = {
    url,
    client: createCompatiblePrismaClient(url).catch((err) => {
      replaceCached(undefined);
      throw err;
    }),
  };

  return entry;
}

async function getCompatibleCachedClient(
  cached: CachedPrismaClient,
  url: string,
  replaceCached: (next: CachedPrismaClient | undefined) => void
): Promise<PrismaClient> {
  if (cached.url !== url) {
    const previousClient = await cached.client.catch(() => undefined);
    if (previousClient) {
      await disconnectPrismaClient(previousClient);
    }

    const next = createCachedPrismaClient(url, replaceCached);
    replaceCached(next);
    return next.client;
  }

  const client = await cached.client;

  if (hasRequiredPrismaDelegates(client)) {
    return client;
  }

  await disconnectPrismaClient(client);
  const next = createCachedPrismaClient(url, replaceCached);
  replaceCached(next);
  return next.client;
}

export default function getPrisma(): Promise<PrismaClient> {
  const url = resolvePrismaDatabaseUrl();

  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createCachedPrismaClient(url, (next) => {
        globalForPrisma.prisma = next;
      });
    }
    return getCompatibleCachedClient(globalForPrisma.prisma, url, (next) => {
      globalForPrisma.prisma = next;
    });
  }

  if (!cachedClient) {
    cachedClient = createCachedPrismaClient(url, (next) => {
      cachedClient = next;
    });
  }
  return getCompatibleCachedClient(cachedClient, url, (next) => {
    cachedClient = next;
  });
}
