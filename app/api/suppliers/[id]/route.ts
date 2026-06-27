import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, notFound, internalError } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  contactName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  cnpj: z.string().min(14).optional(),
  categories: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const supplier = await prisma.supplier.findUnique({ where: { id } })
    if (!supplier) return notFound('Fornecedor não encontrado')
    return ok(supplier)
  } catch (e) {
    return internalError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data })
    return ok(supplier)
  } catch (e) {
    return internalError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.supplier.delete({ where: { id } })
    return ok({ success: true })
  } catch (e) {
    return internalError(e)
  }
}
