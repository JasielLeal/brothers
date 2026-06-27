import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, created, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

const createSchema = z.object({
  code: z
    .string()
    .min(3)
    .transform((v) => v.toUpperCase().trim()),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderValue: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = req.nextUrl
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)))

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coupon.count(),
    ])

    return ok({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return internalError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { expiresAt, ...rest } = parsed.data

    const existing = await prisma.coupon.findUnique({ where: { code: rest.code } })
    if (existing) return badRequest('Já existe um cupom com esse código')

    const coupon = await prisma.coupon.create({
      data: { ...rest, expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`) : null },
    })
    return created(coupon)
  } catch (e) {
    return internalError(e)
  }
}
