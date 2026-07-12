import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET() {
  try {
    const [categories, stockByCategory] = await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true, slug: true, lowStockThreshold: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.groupBy({
        by: ['categoryId'],
        where: { isActive: true },
        _sum: { stock: true },
      }),
    ])

    const stockMap = new Map(stockByCategory.map((s) => [s.categoryId, s._sum.stock ?? 0]))

    const result = categories.map((cat) => {
      const totalStock = stockMap.get(cat.id) ?? 0
      const isLow = cat.lowStockThreshold != null && totalStock <= cat.lowStockThreshold
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        totalStock,
        lowStockThreshold: cat.lowStockThreshold,
        isLow,
      }
    })

    return ok(result)
  } catch (e) {
    return internalError(e)
  }
}
