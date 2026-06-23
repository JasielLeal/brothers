import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, unauthorized, notFound, internalError } from '@/lib/api-response'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) return notFound('Despesa não encontrada')

    await prisma.expense.delete({ where: { id } })
    return ok({ id })
  } catch (e) {
    return internalError(e)
  }
}
