-- AlterTable
ALTER TABLE "VariantSizeStock" ADD COLUMN "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VariantSizeStock_barcode_key" ON "VariantSizeStock"("barcode");
