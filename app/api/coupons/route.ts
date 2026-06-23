import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api-response'

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

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const data = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    return ok({ data })
  } catch (e) {
    return internalError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

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
