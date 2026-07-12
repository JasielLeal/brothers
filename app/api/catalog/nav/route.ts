import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET() {
  try {
    // Fetch categories + their associated brands/types without loading full product rows
    const [categories, brands, types] = await Promise.all([
      prisma.category.findMany({
        where: { showInNav: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
        take: 8,
      }),
      prisma.brand.findMany({
        where: { products: { some: { isActive: true } } },
        select: {
          id: true,
          name: true,
          slug: true,
          products: { where: { isActive: true }, select: { categoryId: true } },
        },
      }),
      prisma.productType.findMany({
        where: { products: { some: { isActive: true } } },
        select: {
          id: true,
          name: true,
          slug: true,
          products: { where: { isActive: true }, select: { categoryId: true } },
        },
      }),
    ])

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      brands: brands
        .filter((b) => b.products.some((p) => p.categoryId === cat.id))
        .map(({ id, name, slug }) => ({ id, name, slug })),
      types: types
        .filter((t) => t.products.some((p) => p.categoryId === cat.id))
        .map(({ id, name, slug }) => ({ id, name, slug })),
    }))

    return ok(result)
  } catch (e) {
    return internalError(e)
  }
}
