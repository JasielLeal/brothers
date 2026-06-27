import { prisma } from '@/lib/db'
import { ok, internalError } from '@/lib/api-response'

export async function GET() {
  try {
    const config = await prisma.freightConfig.findFirst({ select: { originCep: true } })
    return ok({ originCep: config?.originCep?.replace(/\D/g, '') ?? null })
  } catch (e) {
    return internalError(e)
  }
}
