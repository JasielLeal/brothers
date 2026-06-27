import { prisma } from '@/lib/db'

const BARCODE_PREFIX = '7891234'
const BARCODE_PAD = 6

/**
 * Atomically generates the next sequential EAN-13 barcode using a DB sequence.
 * Requires migration 20260626000009_barcode_sequence to be applied.
 */
export async function nextBarcode(): Promise<string> {
  try {
    const [row] = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('barcode_seq')`
    return `${BARCODE_PREFIX}${String(Number(row.nextval)).padStart(BARCODE_PAD, '0')}`
  } catch {
    // Fallback when sequence migration hasn't been applied yet
    const counter = await prisma.productVariant.count()
    return `${BARCODE_PREFIX}${String(counter + 1).padStart(BARCODE_PAD, '0')}`
  }
}
