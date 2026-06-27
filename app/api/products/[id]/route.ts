import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, unauthorized, notFound, conflict, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().nullable().optional(),
  brandId: z.string().nullable().optional(),
  typeId: z.string().nullable().optional(),
  costPrice: z.number().positive().nullable().optional(),
  marginPercent: z.number().min(0).nullable().optional(),
  supplierId: z.string().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  length: z.number().positive().nullable().optional(),
  width: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  images: z.array(z.string().min(1)).min(1).optional(),
  categoryId: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

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
  // barcode, costPrice, marginPercent, supplierId intentionally excluded
} as const

const adminInclude = {
  category: true,
  brand: true,
  type: true,
  supplier: { select: { id: true, name: true } },
} as const

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const isAdmin = !!session?.user
    const { id } = await params
    const bySlug = req.nextUrl.searchParams.get('by') === 'slug'

    const product = isAdmin
      ? await prisma.product.findUnique({
          where: bySlug ? { slug: id } : { id },
          include: adminInclude,
        })
      : await prisma.product.findUnique({
          where: bySlug ? { slug: id } : { id },
          select: publicSelect,
        })

    if (!product) return notFound('Produto não encontrado')
    return ok(product)
  } catch (e) {
    return internalError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: adminInclude,
    })
    return ok(product)
  } catch (e) {
    return internalError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    // Guard: prevent deleting products that appear in orders
    const orderCount = await prisma.orderItem.count({ where: { productId: id } })
    if (orderCount > 0) {
      return conflict(
        `Este produto está vinculado a ${orderCount} pedido(s) e não pode ser excluído. Desative-o em vez de excluir.`
      )
    }

    await prisma.product.delete({ where: { id } })
    return ok({ success: true })
  } catch (e) {
    return internalError(e)
  }
}
