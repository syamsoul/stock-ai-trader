CREATE TABLE "SchedulerRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "analyzedCount" INTEGER NOT NULL DEFAULT 0,
    "approvedOrderCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SchedulerRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiRecommendation" (
    "id" TEXT NOT NULL,
    "schedulerRunId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiskDecision" (
    "id" TEXT NOT NULL,
    "schedulerRunId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "reasons" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperOrder" (
    "id" TEXT NOT NULL,
    "schedulerRunId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderType" TEXT NOT NULL,
    "limitPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "brokerOrderId" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperOrder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiRecommendation"
ADD CONSTRAINT "AiRecommendation_schedulerRunId_fkey"
FOREIGN KEY ("schedulerRunId")
REFERENCES "SchedulerRun"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RiskDecision"
ADD CONSTRAINT "RiskDecision_schedulerRunId_fkey"
FOREIGN KEY ("schedulerRunId")
REFERENCES "SchedulerRun"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "PaperOrder"
ADD CONSTRAINT "PaperOrder_schedulerRunId_fkey"
FOREIGN KEY ("schedulerRunId")
REFERENCES "SchedulerRun"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
