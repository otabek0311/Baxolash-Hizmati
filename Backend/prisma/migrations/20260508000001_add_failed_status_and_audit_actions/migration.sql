-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'FAILED';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'FAILED_LOGIN';

-- CreateIndex
CREATE INDEX "AuditLog_documentId_idx" ON "AuditLog"("documentId");
