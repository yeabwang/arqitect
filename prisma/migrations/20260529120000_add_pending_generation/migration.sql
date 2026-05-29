-- CreateTable
CREATE TABLE "PendingGeneration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "rawPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingGeneration_projectId_key" ON "PendingGeneration"("projectId");

-- CreateIndex
CREATE INDEX "PendingGeneration_expiresAt_idx" ON "PendingGeneration"("expiresAt");

-- AddForeignKey
ALTER TABLE "PendingGeneration" ADD CONSTRAINT "PendingGeneration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
