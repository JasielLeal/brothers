-- Existing barcodes were generated as plain prefix+sequence with no real EAN-13
-- check digit, so JsBarcode's checksum validation rejects them and silently
-- breaks the tag preview/print flow. Rebuild each barcode from its underlying
-- sequence number using the new prefix(7) + sequence(5) + check-digit(1) layout.
-- The unique constraints are dropped for the duration of the rewrite because
-- intermediate rows can transiently collide with not-yet-updated rows even
-- though the final set of barcodes is unique.

DROP INDEX "ProductVariant_barcode_key";

WITH rebuilt AS (
  SELECT
    id,
    '7891234' || LPAD((CAST(SUBSTRING(barcode FROM 8) AS INT))::text, 5, '0') AS payload
  FROM "ProductVariant"
  WHERE barcode ~ '^[0-9]{13}$'
)
UPDATE "ProductVariant" pv
SET barcode = rebuilt.payload || (
  (10 - (
    (
      SELECT SUM(CAST(SUBSTRING(rebuilt.payload FROM gs FOR 1) AS INT) * CASE WHEN (gs - 1) % 2 = 0 THEN 1 ELSE 3 END)
      FROM generate_series(1, 12) AS gs
    ) % 10
  )) % 10
)::text
FROM rebuilt
WHERE pv.id = rebuilt.id;

CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "ProductVariant"("barcode");
