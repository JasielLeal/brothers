'use client'

import { useEffect } from 'react'
import { adminFont } from '@/lib/admin-font'

// O painel admin é sempre dark. As classes vão no <body> (e não só num wrapper) para que
// o drawer mobile da sidebar, renderizado via createPortal no body, também herde
// os estilos dark: e a fonte do admin.
export function AdminThemeShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const classes = ['dark', ...adminFont.className.split(' ')]
    document.body.classList.add(...classes)
    return () => document.body.classList.remove(...classes)
  }, [])

  return <div className={`dark ${adminFont.className}`}>{children}</div>
}
