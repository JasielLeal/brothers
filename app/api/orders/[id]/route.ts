import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, unauthorized, notFound, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
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

    const { discountType, discountValue, ...restUpdate } = parsed.data
    const hasDiscountUpdate = discountType !== undefined || discountValue !== undefined
    let discountFields: { discountAmount: number; total: number } | undefined

    if (hasDiscountUpdate) {
      if (existing.status === 'DELIVERED' || existing.status === 'CANCELLED')
        return badRequest('Não é possível alterar desconto de um pedido já fechado')
      if (existing.couponCode) return badRequest('Remova o cupom antes de aplicar desconto manual')
      if (discountType === 'PERCENTAGE' && (discountValue ?? 0) > 100)
        return badRequest('Desconto percentual não pode ultrapassar 100%')

      const subtotal = existing.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const discountAmount =
        !discountType || !discountValue || discountValue <= 0
          ? 0
          : discountType === 'PERCENTAGE'
            ? (subtotal * Math.min(discountValue, 100)) / 100
            : Math.min(discountValue, subtotal)
      const total = Math.max(0, subtotal - discountAmount + existing.shippingCost)
      discountFields = { discountAmount, total }
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { ...restUpdate, ...discountFields },
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
