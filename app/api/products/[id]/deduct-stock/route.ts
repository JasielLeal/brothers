import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const schema = z.object({
  color: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive().default(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id: productId } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { color, size, quantity } = parsed.data

    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { productId, colorName: color },
        select: { id: true },
      })
      if (!variant) throw new Error(`Cor "${color}" não encontrada`)

      const sizeResult = await tx.variantSizeStock.updateMany({
        where: { variantId: variant.id, size, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      })
      if (sizeResult.count === 0) throw new Error(`Sem estoque disponível para ${color} / ${size}`)

      const productResult = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      })
      if (productResult.count === 0) throw new Error('Estoque do produto insuficiente')
    })

    return ok({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : undefined
    if (msg) return badRequest(msg)
    return internalError(e)
  }
}
