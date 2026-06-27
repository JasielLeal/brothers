import { auth } from '@/auth'
import { forbidden, unauthorized } from '@/lib/api-response'
import type { Session } from 'next-auth'
import type { NextResponse } from 'next/server'

type GuardError = ReturnType<typeof unauthorized>

interface AuthResult {
  session: Session
  error: null
}
interface AuthErrorResult {
  session: null
  error: GuardError
}

/** Any authenticated user (ADMIN or VIEWER) — for read-only admin endpoints */
export async function requireAuth(): Promise<AuthResult | AuthErrorResult> {
  const session = (await auth()) as Session | null
  if (!session?.user) return { session: null, error: unauthorized() }
  return { session, error: null }
}

/** ADMIN role only — for all write/mutation endpoints */
export async function requireAdmin(): Promise<AuthResult | AuthErrorResult> {
  const session = (await auth()) as Session | null
  if (!session?.user) return { session: null, error: unauthorized() }
  if ((session.user as { role?: string }).role !== 'ADMIN')
    return { session: null, error: forbidden() }
  return { session, error: null }
}

export type { GuardError, NextResponse }
