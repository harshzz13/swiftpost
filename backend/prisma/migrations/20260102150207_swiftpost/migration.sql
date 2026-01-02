-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('WAITING', 'SERVING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CounterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "tokenNumber" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'WAITING',
    "queuePosition" INTEGER,
    "counterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counters" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "CounterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_tokenNumber_key" ON "tokens"("tokenNumber");

-- CreateIndex
CREATE UNIQUE INDEX "counters_number_key" ON "counters"("number");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
