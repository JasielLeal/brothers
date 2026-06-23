import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api-response'

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

const createSchema = z.object({
  customerName: z.string().min(3),
  customerPhone: z.string().min(10),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH']),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  couponCode: z.string().optional().nullable(),
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
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { items, ...orderData } = parsed.data

    // Verify stock availability before creating the order
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      select: { id: true, name: true, stock: true },
    })

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return badRequest(`Produto não encontrado: ${item.productId}`)
      if (product.stock < item.quantity) {
        return badRequest(
          `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}`
        )
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          ...orderData,
          items: {
            create: items.map(({ productId, productName, quantity, price }) => ({
              productId,
              productName,
              quantity,
              price,
            })),
          },
        },
        include: { items: true },
      })

      // Decrement stock for each item
      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      )

      // Increment coupon usage if one was applied
      if (orderData.couponCode) {
        await tx.coupon.updateMany({
          where: { code: orderData.couponCode.toUpperCase().trim(), isActive: true },
          data: { usedCount: { increment: 1 } },
        })
      }

      return newOrder
    })

    return created(order)
  } catch (e) {
    return internalError(e)
  }
}
