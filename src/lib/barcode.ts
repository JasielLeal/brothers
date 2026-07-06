import { prisma } from '@/lib/db'

const BARCODE_PREFIX = '7891234'
const BARCODE_PAD = 5

/**
 * EAN-13 check digit: https://en.wikipedia.org/wiki/International_Article_Number#Calculation_of_checksum_digit
 */
function ean13CheckDigit(digits12: string): number {
  const sum = digits12
    .split('')
    .reduce((acc, d, idx) => acc + Number(d) * (idx % 2 === 0 ? 1 : 3), 0)
  return (10 - (sum % 10)) % 10
}

function buildBarcode(sequence: number): string {
  const digits12 = `${BARCODE_PREFIX}${String(sequence).padStart(BARCODE_PAD, '0')}`
  return `${digits12}${ean13CheckDigit(digits12)}`
}

/**
 * Atomically generates the next sequential EAN-13 barcode (with a valid check digit)
 * using a DB sequence. Requires migration 20260626000009_barcode_sequence to be applied.
 */
export async function nextBarcode(): Promise<string> {
  try {
    const [row] = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('barcode_seq')`
    return buildBarcode(Number(row.nextval))
  } catch {
    // Fallback when sequence migration hasn't been applied yet
    const counter = await prisma.productVariant.count()
    return buildBarcode(counter + 1)
  }
}
