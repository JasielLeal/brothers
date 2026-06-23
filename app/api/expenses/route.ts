import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api-response'

const createSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum([
    'RENT',
    'UTILITIES',
    'SALARIES',
    'SUPPLIES',
    'MARKETING',
    'MAINTENANCE',
    'OTHER',
  ]),
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { searchParams } = req.nextUrl
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 1)
      where.date = { gte: start, lt: end }
    }

    const data = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return ok({ data })
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

    const { date, ...rest } = parsed.data
    const expense = await prisma.expense.create({
      data: { ...rest, date: new Date(date) },
    })

    return created(expense)
  } catch (e) {
    return internalError(e)
  }
}
