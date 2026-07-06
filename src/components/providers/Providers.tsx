'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/lib/api/query-client'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
  session: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    // Session is fetched server-side (see app/layout.tsx) and passed in here so
    // SessionProvider skips its own client-side GET /api/auth/session on mount —
    // without it, every page load/navigation fired that request again.
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  )
}
