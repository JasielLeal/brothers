import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api-response'

const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
})

export async function GET() {
  try {
    const types = await prisma.productType.findMany({ orderBy: { name: 'asc' } })
    return ok(types)
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

    const productType = await prisma.productType.create({ data: parsed.data })
    return created(productType)
  } catch (e) {
    return internalError(e)
  }
}
