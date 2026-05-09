-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CLICK', 'PAYME', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "GeneralAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PROVISIONING',
    "frontendPort" INTEGER NOT NULL,
    "backendPort" INTEGER NOT NULL,
    "dbPort" INTEGER NOT NULL,
    "dbName" TEXT NOT NULL,
    "dbUser" TEXT NOT NULL,
    "dbPassword" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "monthlyPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "provisionedAt" TIMESTAMP(3),
    "serverPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT,
    "paymentUrl" TEXT,
    "gatewayData" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerMetric" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cpuPercent" DOUBLE PRECISION NOT NULL,
    "memoryMb" DOUBLE PRECISION NOT NULL,
    "diskMb" DOUBLE PRECISION NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT true,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneralAdmin_email_key" ON "GeneralAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_frontendPort_key" ON "Company"("frontendPort");

-- CreateIndex
CREATE UNIQUE INDEX "Company_backendPort_key" ON "Company"("backendPort");

-- CreateIndex
CREATE UNIQUE INDEX "Company_dbPort_key" ON "Company"("dbPort");

-- CreateIndex
CREATE UNIQUE INDEX "Company_dbName_key" ON "Company"("dbName");

-- CreateIndex
CREATE UNIQUE INDEX "Company_dbUser_key" ON "Company"("dbUser");

-- CreateIndex
CREATE INDEX "ServerMetric_companyId_recordedAt_idx" ON "ServerMetric"("companyId", "recordedAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerMetric" ADD CONSTRAINT "ServerMetric_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
