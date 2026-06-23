import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, badRequest, internalError } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json()
    if (!code) return badRequest('Código obrigatório')

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase().trim() },
    })

    if (!coupon) return badRequest('Cupom não encontrado')
    if (!coupon.isActive) return badRequest('Cupom inativo')
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return badRequest('Cupom expirado')
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return badRequest('Cupom esgotado')
    if (coupon.minOrderValue !== null && orderTotal < coupon.minOrderValue)
      return badRequest(`Pedido mínimo de ${coupon.minOrderValue} para usar este cupom`)

    const discount =
      coupon.type === 'PERCENTAGE'
        ? (orderTotal * coupon.value) / 100
        : Math.min(coupon.value, orderTotal)

    return ok({ coupon, discount })
  } catch (e) {
    return internalError(e)
  }
}
