import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, notFound, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const exchangeSchema = z.object({
  itemId: z.string().min(1),
  newProductId: z.string().min(1),
  quantity: z.number().int().positive(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = exchangeSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)
    const { itemId, newProductId, quantity, size, color } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) return notFound('Pedido não encontrado')
    if (order.status === 'CANCELLED')
      return badRequest('Não é possível trocar itens de um pedido cancelado')

    const oldItem = order.items.find((i) => i.id === itemId)
    if (!oldItem) return notFound('Item não encontrado neste pedido')

    const newProduct = await prisma.product.findUnique({
      where: { id: newProductId, isActive: true, deletedAt: null },
      select: { id: true, name: true, price: true, stock: true },
    })
    if (!newProduct) return badRequest('Produto não encontrado')

    // ── Validate stock for the new item ──────────────────────
    if (size && color) {
      const variant = await prisma.productVariant.findFirst({
        where: { productId: newProductId, colorName: color },
        include: { sizes: { where: { size } } },
      })
      const sizeStock = variant?.sizes[0]?.stock ?? 0
      if (sizeStock < quantity)
        return badRequest(
          `Estoque insuficiente para "${newProduct.name}" (${color} / ${size}). Disponível: ${sizeStock}`
        )
    } else {
      if (newProduct.stock < quantity)
        return badRequest(
          `Estoque insuficiente para "${newProduct.name}". Disponível: ${newProduct.stock}`
        )
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock from the old item
      if (oldItem.productId) {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { increment: oldItem.quantity } },
        })
        if (oldItem.color && oldItem.size) {
          await tx.variantSizeStock.updateMany({
            where: {
              size: oldItem.size,
              variant: { productId: oldItem.productId, colorName: oldItem.color },
            },
            data: { stock: { increment: oldItem.quantity } },
          })
        }
      }

      // Decrement stock for the new item — atomic guard against negative stock
      if (size && color) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: newProductId, colorName: color },
          select: { id: true },
        })
        if (!variant) throw new Error(`Cor "${color}" não encontrada para "${newProduct.name}"`)

        const sizeResult = await tx.variantSizeStock.updateMany({
          where: { variantId: variant.id, size, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        })
        if (sizeResult.count === 0)
          throw new Error(`Estoque insuficiente para "${newProduct.name}" (${color} / ${size})`)
      }

      const result = await tx.product.updateMany({
        where: { id: newProductId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      })
      if (result.count === 0) throw new Error(`Estoque insuficiente para "${newProduct.name}"`)

      const oldLineTotal = oldItem.price * oldItem.quantity
      const newLineTotal = newProduct.price * quantity
      const priceDifference = newLineTotal - oldLineTotal

      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          productId: newProduct.id,
          productName: newProduct.name,
          quantity,
          price: newProduct.price,
          size: size ?? null,
          color: color ?? null,
        },
      })

      await tx.orderItemExchange.create({
        data: {
          orderId: id,
          oldProductId: oldItem.productId,
          oldProductName: oldItem.productName,
          oldQuantity: oldItem.quantity,
          oldPrice: oldItem.price,
          oldSize: oldItem.size,
          oldColor: oldItem.color,
          newProductId: newProduct.id,
          newProductName: newProduct.name,
          newQuantity: quantity,
          newPrice: newProduct.price,
          newSize: size ?? null,
          newColor: color ?? null,
          priceDifference,
        },
      })

      return tx.order.update({
        where: { id },
        data: { total: Math.max(0, order.total + priceDifference) },
        include: {
          items: { include: { product: { select: { images: true } } } },
          exchanges: { orderBy: { createdAt: 'desc' } },
        },
      })
    })

    return ok(updatedOrder)
  } catch (e) {
    const msg = e instanceof Error ? e.message : undefined
    if (msg && (msg.includes('Estoque') || msg.includes('Cor'))) return badRequest(msg)
    return internalError(e)
  }
}
