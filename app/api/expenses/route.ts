import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, created, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

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
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = req.nextUrl
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)))

    const where: Record<string, unknown> = {}
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 1)
      where.date = { gte: start, lt: end }
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    return ok({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
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

    const { date, ...rest } = parsed.data
    const expense = await prisma.expense.create({
      data: { ...rest, date: new Date(date) },
    })

    return created(expense)
  } catch (e) {
    return internalError(e)
  }
}
