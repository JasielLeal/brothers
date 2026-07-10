import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const limitParam = Number(req.nextUrl.searchParams.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 6

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        originalPrice: { not: null },
      },
      orderBy: { stock: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        stock: true,
        images: true,
      },
    })

    return ok(products)
  } catch (e) {
    return internalError(e)
  }
}
