import type { ReactNode } from 'react'
import Image from 'next/image'
import logo from '@/../public/logo.png'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

/** Cabeçalho padrão das páginas do admin (mesmo estilo do Dashboard). */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <Image src={logo} alt="Brothers Outlet" className="h-8 w-auto shrink-0" priority />
        <div className="flex-1" />
        {action}
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  )
}
