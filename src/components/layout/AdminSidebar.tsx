'use client'

import { useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@/../public/logo.png'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Truck,
  Building2,
  X,
  LogOut,
  Layers,
  Wallet,
  Ticket,
  Link2,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/utils/cn'
import { useAdminUiStore } from '@/store/admin-ui.store'
import { Separator } from '../ui/separator'

const MAIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/catalog', label: 'Catálogo', icon: Layers },
  { href: '/admin/gerar-link', label: 'Gerar Link', icon: Link2 },
]

const BOTTOM_NAV: { href: string; label: string; icon: React.ElementType }[] = []

const DOCS_NAV = [
  { label: 'Financeiro', icon: Wallet, href: '/admin/financeiro' },
  { label: 'Cupons', icon: Ticket, href: '/admin/cupons' },
  { label: 'Frete', icon: Truck, href: '/admin/frete' },
  { label: 'Fornecedores', icon: Building2, href: '/admin/suppliers' },
]

// ── user menu ─────────────────────────────────────────────────────────────────
function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session } = useSession()
  const user = session?.user
  const [open, setOpen] = useState(false)
  const initial = user?.name?.[0]?.toUpperCase() ?? 'A'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/8',
          collapsed && 'justify-center px-2'
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">
          {initial}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-semibold text-gray-800 dark:text-neutral-100">
              {user?.name ?? 'Admin'}
            </p>
            <p className="truncate text-[10px] text-gray-400 dark:text-neutral-500">
              {user?.email ?? ''}
            </p>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute bottom-full z-20 mb-2 min-w-48 overflow-hidden rounded-xl bg-[#151515] py-1 shadow-lg ring-1 ring-white/10',
              collapsed ? 'left-0' : 'right-0'
            )}
          >
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── shared nav content ─────────────────────────────────────────────────────────
function NavContent({
  collapsed = false,
  onLinkClick,
}: {
  collapsed?: boolean
  onLinkClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      <Separator />
      <nav className="mt-5 flex-1 overflow-y-auto px-2">
        {!collapsed && (
          <p className="mb-1 px-3 text-[10px] font-semibold tracking-[0.18em] text-neutral-600 uppercase">
            início
          </p>
        )}
        <ul className="space-y-0.5">
          {MAIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  onClick={onLinkClick}
                  className={cn(
                    'flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-400 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-5">
          {!collapsed && (
            <p className="mb-1 px-3 text-[10px] font-semibold tracking-[0.18em] text-neutral-600 uppercase">
              Documentos
            </p>
          )}
          <ul className="space-y-0.5">
            {DOCS_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    onClick={onLinkClick}
                    className={cn(
                      'flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-2',
                      active
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-400 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/6 px-2 py-3">
        <UserMenu collapsed={collapsed} />
      </div>
    </>
  )
}

// ── main component ─────────────────────────────────────────────────────────────
export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const mobileOpen = useAdminUiStore((s) => s.mobileSidebarOpen)
  const closeMobileSidebar = useAdminUiStore((s) => s.closeMobileSidebar)

  return (
    <>
      {/* ── Desktop sidebar (in flex layout) ──────────────────────────────── */}
      <aside
        className={cn(
          'sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-3xl bg-[#0e0e0e] ring-1 ring-white/6 transition-all duration-200 md:flex',
          collapsed ? 'w-15' : 'w-56'
        )}
      >
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed && (
            <div className="flex items-center gap-2 pl-2">
              <Image src={logo} alt="Brothers Outlet" className="h-7 w-auto shrink-0" />
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300',
              collapsed && 'mx-auto'
            )}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
        <NavContent collapsed={collapsed} />
      </aside>

      {/* ── Mobile drawer via portal ───────────────────────────────────────── */}
      {mounted &&
        createPortal(
          <>
            <div
              className={cn(
                'fixed inset-0 z-9998 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden',
                mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              )}
              onClick={closeMobileSidebar}
            />
            <aside
              className={cn(
                'fixed top-0 left-0 z-9999 flex h-full w-72 flex-col bg-[#0e0e0e] shadow-2xl transition-transform duration-300 ease-in-out md:hidden',
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Image src={logo} alt="Brothers Outlet" className="h-7 w-auto shrink-0" />
                </div>
                <button
                  onClick={closeMobileSidebar}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  aria-label="Fechar menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavContent onLinkClick={closeMobileSidebar} />
            </aside>
          </>,
          document.body
        )}
    </>
  )
}
