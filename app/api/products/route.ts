import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, created, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

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
  weight: z.number().positive().optional().nullable(),
  length: z.number().positive().optional().nullable(),
  width: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
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

  // Monta SQL com unaccent usando prepared statements (seguro contra SQL injection)
  const termList = Array.from(terms)
  const conditions = termList.map((t) => {
    const pattern = `%${t}%`
    return Prisma.sql`(
      unaccent(lower(p.name))        ILIKE unaccent(lower(${pattern})) OR
      unaccent(lower(p.description)) ILIKE unaccent(lower(${pattern})) OR
      unaccent(lower(b.name))        ILIKE unaccent(lower(${pattern})) OR
      unaccent(lower(c.name))        ILIKE unaccent(lower(${pattern})) OR
      unaccent(lower(t.name))        ILIKE unaccent(lower(${pattern}))
    )`
  })

  const rows = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`
      SELECT DISTINCT p.id
      FROM "Product" p
      LEFT JOIN "Brand"       b ON b.id = p."brandId"
      LEFT JOIN "Category"    c ON c.id = p."categoryId"
      LEFT JOIN "ProductType" t ON t.id = p."typeId"
      WHERE ${Prisma.join(conditions, ' OR ')}
    `
  )

  return rows.map((r) => r.id)
}

// Fields excluded from public API responses to protect business data
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
  // costPrice, marginPercent, supplierId, supplier intentionally excluded
} as const

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const isAdmin = !!session?.user

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
      // Non-admins can never see inactive products — enforce isActive:true
      ...(isAdmin ? isActive != null && { isActive: isActive === 'true' } : { isActive: true }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    }

    // Admins get full data; public gets sanitized select
    const adminInclude = {
      category: true,
      brand: true,
      type: true,
      supplier: { select: { id: true, name: true } },
    } as const

    const [data, total] = await Promise.all([
      isAdmin
        ? prisma.product.findMany({
            where,
            include: adminInclude,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          })
        : prisma.product.findMany({
            where,
            select: publicSelect,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
      prisma.product.count({ where }),
    ])

    let suggestedProducts: typeof data = []
    if (total === 0 && search.trim()) {
      suggestedProducts = isAdmin
        ? await prisma.product.findMany({
            where: { isActive: true },
            include: adminInclude,
            orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
            take: 8,
          })
        : await prisma.product.findMany({
            where: { isActive: true },
            select: publicSelect,
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
  // EAN-13: prefix 789 (Brazil) + 9 random digits + check digit
  // Uses crypto.randomUUID() entropy to avoid timestamp collisions in serverless
  const prefix = '789'
  const uuid = crypto.randomUUID().replace(/-/g, '')
  // Take 9 hex chars, convert to digits 0-9 via modulo
  const body = Array.from({ length: 9 }, (_, i) => parseInt(uuid[i], 16) % 10).join('')
  const digits = prefix + body
  const check =
    (10 -
      (digits.split('').reduce((sum, d, i) => sum + Number(d) * (i % 2 === 0 ? 1 : 3), 0) % 10)) %
    10
  return digits + check
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

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
