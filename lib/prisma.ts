import { existsSync, readFileSync } from "node:fs";

import { PrismaClient } from "@/app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { parse as parseDotenv } from "dotenv";
import type { PoolConfig } from "pg";

interface CachedPrismaClient {
  url: string;
  cacheKey: string;
  client: Promise<PrismaClient>;
}

interface PrismaEnvironment {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  DIRECT_DATABASE_URL?: string;
}

type LocalDatabaseUrlReader = () => string | undefined;

let cachedClient: CachedPrismaClient | undefined;

const PRISMA_POSTGRES_HOST_SUFFIX = "db.prisma.io";
const PRISMA_POSTGRES_POOL_MAX = 1;
const POSTGRES_CONNECTION_TIMEOUT_MS = 10_000;
const POSTGRES_IDLE_TIMEOUT_MS = 5_000;
const PRISMA_READ_RETRY_ATTEMPTS = 3;
const PRISMA_READ_RETRY_BASE_DELAY_MS = 150;

const RETRYABLE_PRISMA_READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

const globalForPrisma = globalThis as unknown as {
  prisma: CachedPrismaClient | undefined;
};

const REQUIRED_PRISMA_DELEGATES = [
  "project",
  "projectCollaborator",
  "projectInvitation",
  "taskRun",
  "projectSpec",
  "pendingGeneration",
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

function isPrismaPostgresDirectUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname === PRISMA_POSTGRES_HOST_SUFFIX ||
      hostname.endsWith(`.${PRISMA_POSTGRES_HOST_SUFFIX}`)
    );
  } catch {
    return false;
  }
}

export function createPgPoolConfig(url: string): PoolConfig {
  const config: PoolConfig = {
    connectionString: url,
    connectionTimeoutMillis: POSTGRES_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: POSTGRES_IDLE_TIMEOUT_MS,
  };

  if (isPrismaPostgresDirectUrl(url)) {
    // Prisma Postgres direct endpoints terminate extra concurrent direct
    // connections; serialize Prisma reads through a single pg pool slot.
    config.max = PRISMA_POSTGRES_POOL_MAX;
  }

  return config;
}

export function isRetryablePrismaReadOperation(operation: string): boolean {
  return RETRYABLE_PRISMA_READ_OPERATIONS.has(operation);
}

export function isPrismaTransientConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = (error as { message?: unknown }).message;
  const isTransientMessage =
    typeof message === "string" &&
    (message.includes("Connection terminated unexpectedly") ||
      message.includes("Connection terminated due to connection timeout") ||
      message.includes("Connection closed"));

  if (isTransientMessage) {
    return true;
  }

  return isPrismaTransientConnectionError(
    (error as { cause?: unknown }).cause
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryPrismaRead<T>(
  query: () => Promise<T>,
  wait: (ms: number) => Promise<void> = delay
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < PRISMA_READ_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await query();
    } catch (error) {
      lastError = error;
      if (
        !isPrismaTransientConnectionError(error) ||
        attempt === PRISMA_READ_RETRY_ATTEMPTS - 1
      ) {
        throw error;
      }

      await wait(PRISMA_READ_RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}

function createPrismaCacheKey(url: string): string {
  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return `${url}|accelerate`;
  }

  const config = createPgPoolConfig(url);
  return [
    url,
    "pg-adapter=owned-config",
    `pg-read-retry=${PRISMA_READ_RETRY_ATTEMPTS}`,
    `pg-max=${config.max ?? "default"}`,
    `pg-connection-timeout=${config.connectionTimeoutMillis ?? "default"}`,
    `pg-idle-timeout=${config.idleTimeoutMillis ?? "default"}`,
  ].join("|");
}

async function disconnectPrismaClient(client: PrismaClient): Promise<void> {
  await client.$disconnect().catch(() => {
    // Best-effort cleanup for stale dev clients after schema regeneration.
  });
}

async function createDirectPrismaClient(url: string): Promise<PrismaClient> {
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const adapter = new PrismaPg(createPgPoolConfig(url));

  return new PrismaClient({ adapter });
}

function prismaDelegateName(model: string): string {
  return `${model.charAt(0).toLowerCase()}${model.slice(1)}`;
}

async function executeModelRead(
  client: PrismaClient,
  model: string,
  operation: string,
  args: unknown
): Promise<unknown> {
  const delegate = (client as unknown as Record<string, unknown>)[
    prismaDelegateName(model)
  ];

  if (!delegate || typeof delegate !== "object") {
    throw new Error(`Unknown Prisma model: ${model}`);
  }

  const operationFn = (delegate as Record<string, unknown>)[operation];
  if (typeof operationFn !== "function") {
    throw new Error(`Unknown Prisma read operation: ${model}.${operation}`);
  }

  return (operationFn as (this: unknown, args: unknown) => Promise<unknown>).call(
    delegate,
    args
  );
}

async function executeReadWithFreshClient(
  url: string,
  model: string,
  operation: string,
  args: unknown
): Promise<unknown> {
  const client = await createDirectPrismaClient(url);
  try {
    return await executeModelRead(client, model, operation, args);
  } finally {
    await disconnectPrismaClient(client);
  }
}

async function createPrismaClient(url: string): Promise<PrismaClient> {
  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate()
    ) as unknown as PrismaClient;
  }

  const client = await createDirectPrismaClient(url);

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!isRetryablePrismaReadOperation(String(operation))) {
            return query(args);
          }

          try {
            return await query(args);
          } catch (error) {
            if (!isPrismaTransientConnectionError(error)) {
              throw error;
            }

            return retryPrismaRead(() =>
              executeReadWithFreshClient(
                url,
                String(model),
                String(operation),
                args
              )
            );
          }
        },
      },
    },
  }) as unknown as PrismaClient;
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
    cacheKey: createPrismaCacheKey(url),
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
  if (cached.url !== url || cached.cacheKey !== createPrismaCacheKey(url)) {
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
