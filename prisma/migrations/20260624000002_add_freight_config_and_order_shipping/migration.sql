-- CreateTable: FreightConfig
CREATE TABLE "FreightConfig" (
    "id"            TEXT NOT NULL,
    "originCep"     TEXT NOT NULL,
    "apiToken"      TEXT NOT NULL,
    "defaultWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "defaultHeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "defaultWidth"  DOUBLE PRECISION NOT NULL DEFAULT 15,
    "defaultLength" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "freeAbove"     DOUBLE PRECISION,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreightConfig_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Order — add shipping fields
ALTER TABLE "Order"
    ADD COLUMN "shippingService" TEXT,
    ADD COLUMN "shippingCost"    DOUBLE PRECISION NOT NULL DEFAULT 0;
