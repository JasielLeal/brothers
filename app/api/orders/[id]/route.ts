import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, unauthorized, notFound, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
})

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'DELIVERED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { images: true } } } } },
    })
    if (!order) return notFound('Pedido não encontrado')
    return ok(order)
  } catch (e) {
    return internalError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!existing) return notFound('Pedido não encontrado')

    // Validate status transition
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? []
      if (!allowed.includes(parsed.data.status)) {
        return badRequest(`Transição inválida: ${existing.status} → ${parsed.data.status}`)
      }
    }

    const isCancelling = parsed.data.status === 'CANCELLED' && existing.status !== 'CANCELLED'

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: parsed.data,
        include: { items: true },
      })

      if (isCancelling) {
        for (const item of existing.items.filter((i) => i.productId != null)) {
          // Restore product total stock
          await tx.product.update({
            where: { id: item.productId! },
            data: { stock: { increment: item.quantity } },
          })

          // Restore variant size stock if color+size are known
          if (item.color && item.size) {
            await tx.variantSizeStock.updateMany({
              where: {
                size: item.size,
                variant: {
                  productId: item.productId!,
                  colorName: item.color,
                },
              },
              data: { stock: { increment: item.quantity } },
            })
          }
        }
      }

      return updated
    })

    return ok(order)
  } catch (e) {
    return internalError(e)
  }
}
