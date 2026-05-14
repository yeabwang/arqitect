-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "prisma_postgres";

-- AlterTable
ALTER TABLE "ProjectCollaborator" ALTER COLUMN "email" TYPE CITEXT;
