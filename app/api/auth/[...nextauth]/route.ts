import { NextRequest, NextResponse } from 'next/server'
import { handlers } from '@/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const { GET } = handlers

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.endsWith('callback/credentials')) {
    const ip = getClientIp(req)
    const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em instantes.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetInSeconds) } }
      )
    }
  }
  return handlers.POST(req)
}
