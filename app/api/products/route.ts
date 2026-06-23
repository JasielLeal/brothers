import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api-response'

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional().nullable(),
  brandId: z.string().optional().nullable(),
  typeId: z.string().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  marginPercent: z.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  images: z.array(z.string()).min(1),
  categoryId: z.string().min(1),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

function generateSlug(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-') +
    '-' +
    Date.now().toString(36)
  )
}

/* ── busca accent-insensitive via unaccent + variantes PT ─── */
async function getSearchIds(query: string): Promise<string[] | null> {
  const q = query.trim()
  if (!q) return null

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

  const base = norm(q)
  const words = base.split(/\s+/).filter(Boolean)
  const terms = new Set<string>([q, base])

  for (const w of words) {
    terms.add(w)
    if (w.endsWith('as') && w.length > 3) terms.add(w.slice(0, -1))
    if (w.endsWith('os') && w.length > 3) terms.add(w.slice(0, -1))
    if (w.endsWith('s') && w.length > 3) terms.add(w.slice(0, -1))
    if (!w.endsWith('s')) {
      terms.add(w + 's')
      terms.add(w + 'as')
    }
  }

  // Monta SQL com unaccent para cada termo
  const conditions = Array.from(terms)
    .map((t) => {
      const p = `%${t}%`
      return `(
      unaccent(lower(p.name))        ILIKE unaccent(lower('${p.replace(/'/g, "''")}')) OR
      unaccent(lower(p.description)) ILIKE unaccent(lower('${p.replace(/'/g, "''")}')) OR
      unaccent(lower(b.name))        ILIKE unaccent(lower('${p.replace(/'/g, "''")}')) OR
      unaccent(lower(c.name))        ILIKE unaccent(lower('${p.replace(/'/g, "''")}')) OR
      unaccent(lower(t.name))        ILIKE unaccent(lower('${p.replace(/'/g, "''")}'))
    )`
    })
    .join(' OR ')

  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(`
    SELECT DISTINCT p.id
    FROM "Product" p
    LEFT JOIN "Brand"       b ON b.id = p."brandId"
    LEFT JOIN "Category"    c ON c.id = p."categoryId"
    LEFT JOIN "ProductType" t ON t.id = p."typeId"
    WHERE ${conditions}
  `)

  return rows.map((r) => r.id)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const categoryId = searchParams.get('categoryId') ?? undefined
    const brandId = searchParams.get('brandId') ?? undefined
    const typeId = searchParams.get('typeId') ?? undefined
    const isFeatured = searchParams.get('isFeatured')
    const isActive = searchParams.get('isActive')
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 12)))

    const searchIds = search.trim() ? await getSearchIds(search) : null

    const where = {
      ...(searchIds !== null && { id: { in: searchIds } }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(typeId && { typeId }),
      ...(isFeatured != null && { isFeatured: isFeatured === 'true' }),
      ...(isActive != null && { isActive: isActive === 'true' }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    }

    const include = {
      category: true,
      brand: true,
      type: true,
      supplier: { select: { id: true, name: true } },
    } as const

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    // when search returns nothing, surface suggestions
    let suggestedProducts: typeof data = []
    if (total === 0 && search.trim()) {
      suggestedProducts = await prisma.product.findMany({
        where: { isActive: true },
        include,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      })
    }

    return ok({ data, total, page, limit, totalPages: Math.ceil(total / limit), suggestedProducts })
  } catch (e) {
    return internalError(e)
  }
}

function generateBarcode(): string {
  // EAN-13: prefix 789 (Brazil) + timestamp + random + check digit
  const prefix = '789'
  // use last 7 digits of timestamp + 2 random digits = 9 digits body
  const ts = Date.now().toString().slice(-7)
  const rnd = String(Math.floor(Math.random() * 100)).padStart(2, '0')
  const digits = prefix + ts + rnd
  const check =
    (10 -
      (digits.split('').reduce((sum, d, i) => sum + Number(d) * (i % 2 === 0 ? 1 : 3), 0) % 10)) %
    10
  return digits + check
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const product = await prisma.product.create({
      data: { ...parsed.data, slug: generateSlug(parsed.data.name), barcode: generateBarcode() },
      include: {
        category: true,
        brand: true,
        type: true,
        supplier: { select: { id: true, name: true } },
      },
    })
    return created(product)
  } catch (e) {
    return internalError(e)
  }
}
