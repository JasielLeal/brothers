import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET() {
  try {
    const [types, stockByType] = await Promise.all([
      prisma.productType.findMany({
        select: { id: true, name: true, slug: true, lowStockThreshold: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.groupBy({
        by: ['typeId'],
        where: { isActive: true, typeId: { not: null } },
        _sum: { stock: true },
      }),
    ])

    const stockMap = new Map(stockByType.map((s) => [s.typeId, s._sum.stock ?? 0]))

    const result = types.map((type) => {
      const totalStock = stockMap.get(type.id) ?? 0
      const isLow = type.lowStockThreshold != null && totalStock <= type.lowStockThreshold
      return {
        id: type.id,
        name: type.name,
        slug: type.slug,
        totalStock,
        lowStockThreshold: type.lowStockThreshold,
        isLow,
      }
    })

    return ok(result)
  } catch (e) {
    return internalError(e)
  }
}
