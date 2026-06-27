import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

const publicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  originalPrice: true,
  images: true,
  stock: true,
  rating: true,
  reviewsCount: true,
  isActive: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  brandId: true,
  typeId: true,
  category: true,
  brand: true,
  type: true,
  // costPrice, marginPercent, supplierId intentionally excluded
} as const

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
        select: publicSelect,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return ok(fallback)
    }

    const productIds = topItems.map((i) => i.productId).filter((id): id is string => id != null)

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: publicSelect,
    })

    // preserve order from groupBy
    const ordered = productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean)

    return ok(ordered)
  } catch (e) {
    return internalError(e)
  }
}
