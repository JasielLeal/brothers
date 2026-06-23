import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, unauthorized, notFound, internalError } from '@/lib/api-response'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
})

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
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!existing) return notFound('Pedido não encontrado')

    const isCancelling = parsed.data.status === 'CANCELLED' && existing.status !== 'CANCELLED'

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: parsed.data,
        include: { items: true },
      })

      if (isCancelling) {
        await Promise.all(
          existing.items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
          )
        )
      }

      return updated
    })

    return ok(order)
  } catch (e) {
    return internalError(e)
  }
}
