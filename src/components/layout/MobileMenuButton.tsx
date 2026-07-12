'use client'

import { Menu } from 'lucide-react'
import { useAdminUiStore } from '@/store/admin-ui.store'

export function MobileMenuButton() {
  const open = useAdminUiStore((s) => s.openMobileSidebar)
  return (
    <button
      onClick={open}
      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
