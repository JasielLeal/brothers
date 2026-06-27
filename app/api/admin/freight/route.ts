import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

const configSchema = z.object({
  originCep: z.string().min(8).max(9),
  defaultWeight: z.number().positive().default(0.5),
  defaultHeight: z.number().positive().default(10),
  defaultWidth: z.number().positive().default(15),
  defaultLength: z.number().positive().default(20),
  freeAbove: z.number().positive().nullable().optional(),
})

export async function GET() {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const config = await prisma.freightConfig.findFirst()
    return ok(config ?? null)
  } catch (e) {
    return internalError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json()
    const parsed = configSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const existing = await prisma.freightConfig.findFirst()

    const config = existing
      ? await prisma.freightConfig.update({ where: { id: existing.id }, data: parsed.data })
      : await prisma.freightConfig.create({ data: parsed.data })

    return ok(config)
  } catch (e) {
    return internalError(e)
  }
}
