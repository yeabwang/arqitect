-- CreateEnum
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TYPE "ProjectInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DENIED');

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_projectId_email_key" ON "ProjectInvitation"("projectId", "email");

-- CreateIndex
CREATE INDEX "ProjectInvitation_email_status_idx" ON "ProjectInvitation"("email", "status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_status_createdAt_idx" ON "ProjectInvitation"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectInvitation_invitedById_status_idx" ON "ProjectInvitation"("invitedById", "status");

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
