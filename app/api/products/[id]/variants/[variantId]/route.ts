import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, notFound, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const updateSchema = z.object({
  colorName: z.string().min(1).optional(),
  colorHex: z.string().nullable().optional(),
  images: z.array(z.string().min(1)).min(1).optional(),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1),
        stock: z.number().int().min(0),
      })
    )
    .optional(),
})

type Params = { params: Promise<{ id: string; variantId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { variantId } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const existing = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!existing) return notFound('Variante não encontrada')

    const { sizes, ...rest } = parsed.data

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...rest,
        ...(sizes !== undefined && {
          sizes: {
            deleteMany: {},
            create: sizes.filter((s) => s.stock > 0).map((s) => ({ size: s.size, stock: s.stock })),
          },
        }),
      },
      include: { sizes: true },
    })

    return ok(variant)
  } catch (e) {
    return internalError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { variantId } = await params
    await prisma.productVariant.delete({ where: { id: variantId } })
    return ok({ success: true })
  } catch (e) {
    return internalError(e)
  }
}
