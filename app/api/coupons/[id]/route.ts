import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, badRequest, unauthorized, notFound, internalError } from '@/lib/api-response'

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { expiresAt, ...rest } = parsed.data
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...rest,
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`) : null }
          : {}),
      },
    })
    return ok(coupon)
  } catch (e) {
    return internalError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const existing = await prisma.coupon.findUnique({ where: { id } })
    if (!existing) return notFound('Cupom não encontrado')

    await prisma.coupon.delete({ where: { id } })
    return ok({ id })
  } catch (e) {
    return internalError(e)
  }
}
