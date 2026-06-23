import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        products: {
          where: { isActive: true },
          select: {
            brand: { select: { id: true, name: true, slug: true } },
            type: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    const result = categories.map((cat) => {
      const brandsMap = new Map<string, { id: string; name: string; slug: string }>()
      const typesMap = new Map<string, { id: string; name: string; slug: string }>()

      for (const p of cat.products) {
        if (p.brand) brandsMap.set(p.brand.id, p.brand)
        if (p.type) typesMap.set(p.type.id, p.type)
      }

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        brands: Array.from(brandsMap.values()),
        types: Array.from(typesMap.values()),
      }
    })

    return ok(result)
  } catch (e) {
    return internalError(e)
  }
}
