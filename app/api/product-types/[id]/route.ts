import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, notFound, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const productType = await prisma.productType.update({ where: { id }, data: parsed.data })
    return ok(productType)
  } catch (e) {
    return internalError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const productType = await prisma.productType.findUnique({ where: { id } })
    if (!productType) return notFound('Tipo não encontrado')

    await prisma.productType.delete({ where: { id } })
    return ok({ success: true })
  } catch (e) {
    return internalError(e)
  }
}
