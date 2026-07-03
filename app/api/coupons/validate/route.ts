import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, badRequest, tooManyRequests, internalError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 tentativas por hora por IP
    const ip = getClientIp(req)
    const rl = rateLimit(`coupon:${ip}`, 20, 60 * 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.resetInSeconds)

    const { code, orderTotal, items } = await req.json()
    if (!code) return badRequest('Código obrigatório')

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase().trim() },
      include: { products: { select: { productId: true } } },
    })

    // Mensagem genérica para todos os casos de falha — evita enumeração
    const invalid = () => badRequest('Cupom inválido ou não aplicável')

    if (!coupon) return invalid()
    if (!coupon.isActive) return invalid()
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return invalid()
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return invalid()

    if (coupon.minOrderValue !== null && orderTotal < coupon.minOrderValue) {
      return badRequest(
        `Valor mínimo do pedido: R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')} para usar este cupom`
      )
    }

    let discountBase = orderTotal

    if (coupon.products.length > 0) {
      const cartItems: { productId: string; quantity: number }[] = Array.isArray(items) ? items : []
      const eligibleIds = new Set(coupon.products.map((p) => p.productId))
      const eligibleItems = cartItems.filter((i) => eligibleIds.has(i.productId))
      const eligibleQty = eligibleItems.reduce((sum, i) => sum + i.quantity, 0)

      if (coupon.minQuantity !== null && eligibleQty < coupon.minQuantity) {
        return badRequest(
          `Este cupom exige pelo menos ${coupon.minQuantity} unidade(s) dos produtos participantes`
        )
      }
      if (eligibleQty === 0) return invalid()

      const dbProducts = await prisma.product.findMany({
        where: { id: { in: eligibleItems.map((i) => i.productId) } },
        select: { id: true, price: true },
      })
      discountBase = eligibleItems.reduce((sum, i) => {
        const p = dbProducts.find((p) => p.id === i.productId)
        return sum + (p ? p.price * i.quantity : 0)
      }, 0)
    }

    const discount =
      coupon.type === 'PERCENTAGE'
        ? (discountBase * coupon.value) / 100
        : Math.min(coupon.value, discountBase)

    // Retornar apenas o necessário — nunca o objeto completo do cupom
    return ok({
      discount,
      type: coupon.type,
      value: coupon.value,
      code: coupon.code,
    })
  } catch (e) {
    return internalError(e)
  }
}
