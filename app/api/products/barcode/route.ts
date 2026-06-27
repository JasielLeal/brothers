import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, notFound, unauthorized, internalError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const code = req.nextUrl.searchParams.get('code')?.trim()
    if (!code) return badRequest('Informe o barcode')

    const variant = await prisma.productVariant.findUnique({
      where: { barcode: code },
      include: {
        product: {
          select: { id: true, name: true, price: true, stock: true, images: true },
        },
        sizes: { orderBy: { size: 'asc' } },
      },
    })

    if (!variant) return notFound('Barcode não encontrado')

    return ok({
      product: variant.product,
      color: variant.colorName,
      colorHex: variant.colorHex ?? null,
      image: variant.images[0] ?? null,
      sizes: variant.sizes,
    })
  } catch (e) {
    return internalError(e)
  }
}
