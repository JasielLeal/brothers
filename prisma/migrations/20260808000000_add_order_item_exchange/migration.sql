CREATE TABLE "OrderItemExchange" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "oldProductId" TEXT,
    "oldProductName" TEXT NOT NULL,
    "oldQuantity" INTEGER NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "oldSize" TEXT,
    "oldColor" TEXT,
    "newProductId" TEXT,
    "newProductName" TEXT NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "newSize" TEXT,
    "newColor" TEXT,
    "priceDifference" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItemExchange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderItemExchange_orderId_idx" ON "OrderItemExchange"("orderId");

ALTER TABLE "OrderItemExchange" ADD CONSTRAINT "OrderItemExchange_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
