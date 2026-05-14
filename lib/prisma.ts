import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: Promise<PrismaClient> | undefined;
};

async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;

  if (url?.startsWith("prisma+postgres://")) {
    // prisma+postgres:// handled natively by Prisma engine — no adapter needed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error - Prisma v7 types require adapter or accelerateUrl, but prisma+postgres:// works without either
    return new PrismaClient();
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export default function getPrisma(): Promise<PrismaClient> {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  return createPrismaClient();
}
