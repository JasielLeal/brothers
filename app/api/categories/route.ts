import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, created, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  hasVariants: z.boolean().optional(),
  sizeSet: z.enum(['CLOTHING', 'SHOE', 'UNIQUE']).optional(),
  showInNav: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).nullable().optional(),
})

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
    return ok(categories)
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

    if (parsed.data.showInNav) {
      const navCount = await prisma.category.count({ where: { showInNav: true } })
      if (navCount >= 8) return badRequest('Máximo de 8 categorias na navbar')
    }

    const category = await prisma.category.create({ data: parsed.data })
    return created(category)
  } catch (e) {
    return internalError(e)
  }
}
