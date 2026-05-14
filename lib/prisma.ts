import { PrismaClient } from "@/app/generated/prisma/client";
import type { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: Promise<PrismaClient> | undefined;
};

let cachedPool: Pool | undefined;

async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (url.startsWith("prisma+postgres://")) {
    // @ts-expect-error - Prisma v7 types require adapter, but prisma+postgres:// works without one
    return new PrismaClient();
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");

  if (!cachedPool) {
    cachedPool = new Pool({ connectionString: url });
  }
  const adapter = new PrismaPg(cachedPool);

  return new PrismaClient({ adapter });
}

export default function getPrisma(): Promise<PrismaClient> {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient().catch((err) => {
        globalForPrisma.prisma = undefined;
        throw err;
      });
    }
    return globalForPrisma.prisma;
  }

  return createPrismaClient();
}
