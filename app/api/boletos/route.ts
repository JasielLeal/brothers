import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, created, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

const createSchema = z.object({
  code: z.string().min(10),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().min(2),
  description: z.string().min(3),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? undefined
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 10)))

    const where = {
      ...(search && {
        OR: [
          { supplierName: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status: status as never }),
    }

    const [data, total] = await Promise.all([
      prisma.boleto.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.boleto.count({ where }),
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

    const boleto = await prisma.boleto.create({
      data: {
        ...parsed.data,
        dueDate: new Date(parsed.data.dueDate),
      },
    })
    return created(boleto)
  } catch (e) {
    return internalError(e)
  }
}
