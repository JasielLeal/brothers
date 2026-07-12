'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useAdminThemeStore } from '@/store/admin-theme.store'

export function AdminThemeShell({ children }: { children: React.ReactNode }) {
  const theme = useAdminThemeStore((s) => s.theme)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Toggle on <body> (not just a wrapper div) so the sidebar's mobile drawer —
  // rendered via createPortal directly into document.body — also picks up dark: styles.
  useEffect(() => {
    if (!mounted) return
    document.body.classList.toggle('dark', theme === 'dark')
    return () => {
      document.body.classList.remove('dark')
    }
  }, [mounted, theme])

  return <>{children}</>
}
