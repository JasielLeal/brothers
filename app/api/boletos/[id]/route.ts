import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, notFound, internalError } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  paidAt: z.string().datetime().optional().nullable(),
  description: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const boleto = await prisma.boleto.findUnique({ where: { id } })
    if (!boleto) return notFound('Boleto não encontrado')
    return ok(boleto)
  } catch (e) {
    return internalError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.dueDate) data.dueDate = new Date(parsed.data.dueDate)
    if (parsed.data.paidAt) data.paidAt = new Date(parsed.data.paidAt)

    const boleto = await prisma.boleto.update({ where: { id }, data })
    return ok(boleto)
  } catch (e) {
    return internalError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.boleto.delete({ where: { id } })
    return ok({ success: true })
  } catch (e) {
    return internalError(e)
  }
}
