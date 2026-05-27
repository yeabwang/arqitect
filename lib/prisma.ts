import { PrismaClient } from "@/app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import type { Pool } from "pg";

let cachedPool: Pool | undefined;
let cachedClient: Promise<PrismaClient> | undefined;

const globalForPrisma = globalThis as unknown as {
  prisma: Promise<PrismaClient> | undefined;
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

async function disconnectPrismaClient(client: PrismaClient): Promise<void> {
  await client.$disconnect().catch(() => {
    // Best-effort cleanup for stale dev clients after schema regeneration.
  });
}

async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate()
    ) as unknown as PrismaClient;
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");

  if (!cachedPool) {
    cachedPool = new Pool({ connectionString: url });
  }
  const adapter = new PrismaPg(cachedPool);

  return new PrismaClient({ adapter });
}

async function createCompatiblePrismaClient(): Promise<PrismaClient> {
  const client = await createPrismaClient();

  if (!hasRequiredPrismaDelegates(client)) {
    await disconnectPrismaClient(client);
    throw new Error(
      "Generated Prisma client is missing required project delegates. Run `npx prisma generate` and restart the dev server."
    );
  }

  return client;
}

async function getCompatibleCachedClient(
  cached: Promise<PrismaClient>,
  replaceCached: (next: Promise<PrismaClient> | undefined) => void
): Promise<PrismaClient> {
  const client = await cached;

  if (hasRequiredPrismaDelegates(client)) {
    return client;
  }

  await disconnectPrismaClient(client);
  const next = createCompatiblePrismaClient().catch((err) => {
    replaceCached(undefined);
    throw err;
  });
  replaceCached(next);
  return next;
}

export default function getPrisma(): Promise<PrismaClient> {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createCompatiblePrismaClient().catch((err) => {
        globalForPrisma.prisma = undefined;
        throw err;
      });
    }
    return getCompatibleCachedClient(globalForPrisma.prisma, (next) => {
      globalForPrisma.prisma = next;
    });
  }

  if (!cachedClient) {
    cachedClient = createCompatiblePrismaClient().catch((err) => {
      cachedClient = undefined;
      throw err;
    });
  }
  return getCompatibleCachedClient(cachedClient, (next) => {
    cachedClient = next;
  });
}
