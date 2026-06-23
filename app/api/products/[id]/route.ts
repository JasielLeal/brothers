import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, unauthorized, notFound, internalError } from '@/lib/api-response'

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
  images: z.array(z.string().min(1)).min(1).optional(),
  categoryId: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bySlug = req.nextUrl.searchParams.get('by') === 'slug'

    const product = await prisma.product.findUnique({
      where: bySlug ? { slug: id } : { id },
      include: {
        category: true,
        brand: true,
        type: true,
        supplier: { select: { id: true, name: true } },
      },
    })
    if (!product) return notFound('Produto não encontrado')
    return ok(product)
  } catch (e) {
    return internalError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: {
        category: true,
        brand: true,
        type: true,
        supplier: { select: { id: true, name: true } },
      },
    })
    return ok(product)
  } catch (e) {
    return internalError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return ok({ success: true })
  } catch (e) {
    return internalError(e)
  }
}
