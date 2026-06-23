import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 4)))

    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    })

    if (topItems.length === 0) {
      const fallback = await prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: { category: true, brand: true, type: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return ok(fallback)
    }

    const productIds = topItems.map((i) => i.productId)

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { category: true, brand: true, type: true },
    })

    // preserve order from groupBy
    const ordered = productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean)

    return ok(ordered)
  } catch (e) {
    return internalError(e)
  }
}
