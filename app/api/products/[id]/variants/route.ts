import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { nextBarcode } from '@/lib/barcode'
import { ok, created, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

const sizeStockSchema = z.object({
  size: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XGG']),
  stock: z.number().int().min(0),
})

const createSchema = z.object({
  colorName: z.string().min(1),
  colorHex: z.string().optional().nullable(),
  images: z.array(z.string().min(1)).min(1, 'Adicione pelo menos uma imagem'),
  sizes: z.array(sizeStockSchema),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      include: { sizes: { orderBy: { size: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
    return ok(variants)
  } catch (e) {
    return internalError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id: productId } = await params
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { colorName, colorHex, images, sizes } = parsed.data

    const barcode = await nextBarcode()

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        colorName,
        colorHex: colorHex ?? null,
        images,
        barcode,
        sizes: {
          create: SIZES.map((s) => {
            const found = sizes.find((sz) => sz.size === s)
            return { size: s, stock: found?.stock ?? 0 }
          }).filter((s) => s.stock > 0),
        },
      },
      include: { sizes: true },
    })

    return created(variant)
  } catch (e) {
    return internalError(e)
  }
}
