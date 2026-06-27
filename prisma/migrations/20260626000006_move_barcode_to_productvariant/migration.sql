-- Move barcode from VariantSizeStock to ProductVariant (barcode is per color, not per size)
DROP INDEX IF EXISTS "VariantSizeStock_barcode_key";
ALTER TABLE "VariantSizeStock" DROP COLUMN IF EXISTS "barcode";

ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_barcode_key" ON "ProductVariant"("barcode");
