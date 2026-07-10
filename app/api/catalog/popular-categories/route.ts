import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const limitParam = Number(req.nextUrl.searchParams.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 6

    const grouped = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: limit,
    })

    const categoryIds = grouped.map((g) => g.categoryId)

    const [categories, sampleProducts] = await Promise.all([
      prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true },
      }),
      Promise.all(
        categoryIds.map((id) =>
          prisma.product.findFirst({
            where: { categoryId: id, isActive: true },
            orderBy: { createdAt: 'desc' },
            select: { images: true },
          })
        )
      ),
    ])

    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    const result = grouped
      .map((g, i) => {
        const cat = categoryMap.get(g.categoryId)
        if (!cat) return null
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: g._count._all,
          image: sampleProducts[i]?.images[0] ?? null,
        }
      })
      .filter((c) => c !== null)

    return ok(result)
  } catch (e) {
    return internalError(e)
  }
}
