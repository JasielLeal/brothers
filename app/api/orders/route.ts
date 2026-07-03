import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import {
  ok,
  created,
  badRequest,
  unauthorized,
  tooManyRequests,
  internalError,
} from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  // price is intentionally omitted — always read from DB
})

const createSchema = z.object({
  customerName: z.string().min(3),
  customerPhone: z.string().min(10),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH']),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  items: z.array(orderItemSchema).min(1),
  couponCode: z.string().optional().nullable(),
  shippingCost: z.number().min(0).default(0),
  shippingService: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? undefined
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 10)))

    const where = {
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' as const } },
          { customerPhone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status: status as never }),
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { include: { product: { select: { images: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return ok({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return internalError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 pedidos por hora por IP
    const ip = getClientIp(req)
    const rl = rateLimit(`orders:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.resetInSeconds)

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { items, couponCode, shippingCost, shippingService, ...orderData } = parsed.data
    const normalizedCode = couponCode?.toUpperCase().trim() ?? null

    // ── 1. Read prices from DB — never trust the client ──────
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
      select: { id: true, name: true, price: true, stock: true },
    })

    for (const item of items) {
      const product = dbProducts.find((p) => p.id === item.productId)
      if (!product) return badRequest(`Produto não encontrado: ${item.productId}`)

      if (item.size && item.color) {
        // Check variant size stock
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.productId, colorName: item.color },
          include: { sizes: { where: { size: item.size } } },
        })
        const sizeStock = variant?.sizes[0]?.stock ?? 0
        if (sizeStock < item.quantity)
          return badRequest(
            `Estoque insuficiente para "${product.name}" (${item.color} / ${item.size}). Disponível: ${sizeStock}`
          )
      } else {
        if (product.stock < item.quantity)
          return badRequest(
            `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}`
          )
      }
    }

    // ── 2. Compute subtotal server-side ─────────────────────
    const subtotal = items.reduce((sum, item) => {
      const p = dbProducts.find((p) => p.id === item.productId)!
      return sum + p.price * item.quantity
    }, 0)

    // ── 3. Validate shippingCost server-side (#7) ────────────
    // If DELIVERY with shippingCost=0, verify the order qualifies for free shipping
    const resolvedShippingCost = shippingCost
    if (orderData.deliveryType === 'DELIVERY' && shippingCost === 0) {
      const freightConfig = await prisma.freightConfig.findFirst()
      const freeAbove = freightConfig?.freeAbove ?? null
      if (freeAbove === null || subtotal < freeAbove) {
        return badRequest('Custo de frete inválido para entrega')
      }
      // subtotal >= freeAbove → free shipping is legitimately zero
    }

    // ── 4. Pre-validate coupon (non-atomic, for early UX feedback) ──
    if (normalizedCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
        include: { products: { select: { productId: true } } },
      })
      if (!coupon || !coupon.isActive) return badRequest('Cupom inválido ou não aplicável')
      if (coupon.expiresAt && new Date() > coupon.expiresAt)
        return badRequest('Cupom inválido ou não aplicável')
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        return badRequest('Cupom inválido ou não aplicável')
      if (coupon.products.length > 0) {
        const eligibleIds = new Set(coupon.products.map((p) => p.productId))
        const eligibleQty = items
          .filter((i) => eligibleIds.has(i.productId))
          .reduce((sum, i) => sum + i.quantity, 0)
        if (coupon.minQuantity !== null && eligibleQty < coupon.minQuantity)
          return badRequest(
            `Este cupom exige pelo menos ${coupon.minQuantity} unidade(s) dos produtos participantes`
          )
        if (eligibleQty === 0) return badRequest('Cupom inválido ou não aplicável')
      }
    }

    // ── 5. Transaction: atomic stock decrement + coupon read + order create ──
    const order = await prisma.$transaction(
      async (tx) => {
        // Atomically decrement stock — guard prevents negative stock
        for (const item of items) {
          const p = dbProducts.find((p) => p.id === item.productId)!

          if (item.size && item.color) {
            // Decrement variant size stock
            const variant = await tx.productVariant.findFirst({
              where: { productId: item.productId, colorName: item.color },
              select: { id: true },
            })
            if (!variant) throw new Error(`Cor "${item.color}" não encontrada para "${p.name}"`)

            const sizeResult = await tx.variantSizeStock.updateMany({
              where: { variantId: variant.id, size: item.size, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })
            if (sizeResult.count === 0)
              throw new Error(
                `Estoque insuficiente para "${p.name}" (${item.color} / ${item.size})`
              )
          }

          // Always decrement the product total stock
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (result.count === 0) throw new Error(`Estoque insuficiente para "${p.name}"`)
        }

        // Read coupon INSIDE the transaction to get authoritative value (TOCTOU fix #10)
        let discountAmount = 0
        if (normalizedCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: normalizedCode },
            include: { products: { select: { productId: true } } },
          })
          if (!coupon || !coupon.isActive) throw new Error('Cupom não pôde ser aplicado')
          if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new Error('Cupom expirado')
          if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
            throw new Error('Cupom esgotado')

          let discountBase = subtotal
          if (coupon.products.length > 0) {
            const eligibleIds = new Set(coupon.products.map((p) => p.productId))
            const eligibleItems = items.filter((i) => eligibleIds.has(i.productId))
            const eligibleQty = eligibleItems.reduce((sum, i) => sum + i.quantity, 0)
            if (coupon.minQuantity !== null && eligibleQty < coupon.minQuantity)
              throw new Error(
                `Cupom exige pelo menos ${coupon.minQuantity} unidade(s) dos produtos participantes`
              )
            if (eligibleQty === 0) throw new Error('Cupom não pôde ser aplicado')

            discountBase = eligibleItems.reduce((sum, i) => {
              const p = dbProducts.find((p) => p.id === i.productId)!
              return sum + p.price * i.quantity
            }, 0)
          }

          discountAmount =
            coupon.type === 'PERCENTAGE'
              ? (discountBase * coupon.value) / 100
              : Math.min(coupon.value, discountBase)

          // Atomically consume coupon
          const consumed = await tx.$executeRaw`
          UPDATE "Coupon"
          SET "usedCount" = "usedCount" + 1
          WHERE code = ${normalizedCode}
            AND "isActive" = true
            AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
            AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
        `
          if (consumed === 0) throw new Error('Cupom não pôde ser aplicado (esgotado ou expirado)')
        }

        const total = Math.max(0, subtotal - discountAmount + resolvedShippingCost)

        return tx.order.create({
          data: {
            ...orderData,
            couponCode: normalizedCode,
            discountAmount,
            shippingCost: resolvedShippingCost,
            shippingService: shippingService ?? null,
            total,
            items: {
              create: items.map((item) => {
                const p = dbProducts.find((p) => p.id === item.productId)!
                return {
                  productId: item.productId,
                  productName: p.name,
                  quantity: item.quantity,
                  price: p.price,
                  size: item.size ?? null,
                  color: item.color ?? null,
                }
              }),
            },
          },
          include: { items: true },
        })
      },
      { timeout: 15000 }
    )

    return created(order)
  } catch (e) {
    const msg = e instanceof Error ? e.message : undefined
    if (msg && (msg.includes('Cupom') || msg.includes('Estoque'))) return badRequest(msg)
    return internalError(e)
  }
}
