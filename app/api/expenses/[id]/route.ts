import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ok, notFound, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) return notFound('Despesa não encontrada')

    await prisma.expense.delete({ where: { id } })
    return ok({ id })
  } catch (e) {
    return internalError(e)
  }
}
