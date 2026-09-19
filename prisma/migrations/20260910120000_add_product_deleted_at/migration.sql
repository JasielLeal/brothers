-- Soft delete for Product: keep the row (order history, referential integrity)
-- and just stamp deletedAt instead of a hard DELETE.
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
