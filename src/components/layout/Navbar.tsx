'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  Clock,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import { useNavCategories } from '@/features/products/hooks/useProducts'
import { useState, useRef, useEffect } from 'react'
import type { NavCategory } from '@/features/products/types/product.types'
import logo from '@/../public/logo.png'

const RECENT_KEY = 'recent_searches'
const MAX_RECENT = 5

/* ── Category item with hover mega-dropdown ──────────────── */
function CategoryItem({ cat, transparent }: { cat: NavCategory; transparent: boolean }) {
  const hasDropdown = cat.brands.length > 0 || cat.types.length > 0

  return (
    <div className="group relative">
      <Link
        href={`/search?categoryId=${cat.id}`}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
          transparent ? 'text-white/80 hover:text-white' : 'text-white/60 hover:text-white'
        }`}
      >
        {cat.name}
        {hasDropdown && (
          <ChevronDown className="h-3 w-3 shrink-0 text-white/30 transition-transform duration-200 group-hover:rotate-180" />
        )}
      </Link>

      {hasDropdown && (
        <div className="invisible absolute top-full left-0 z-50 translate-y-1 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <div
            className={`rounded-2xl bg-[#1a1a1a] p-5 shadow-2xl ring-1 ring-white/10 ${cat.types.length > 0 && cat.brands.length > 0 ? 'grid min-w-72 grid-cols-2 gap-6' : 'min-w-44'}`}
          >
            {cat.types.length > 0 && (
              <div>
                <p className="mb-2.5 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                  Estilo
                </p>
                <div className="flex flex-col gap-0.5">
                  {cat.types.map((t) => (
                    <Link
                      key={t.id}
                      href={`/search?categoryId=${cat.id}&typeId=${t.id}`}
                      className="rounded-lg px-2.5 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {cat.brands.length > 0 && (
              <div>
                <p className="mb-2.5 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                  Marcas
                </p>
                <div className="flex flex-col gap-0.5">
                  {cat.brands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/search?categoryId=${cat.id}&brandId=${b.id}`}
                      className="rounded-lg px-2.5 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Navbar ──────────────────────────────────────────────── */
export function Navbar() {
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { data: navCategories = [] } = useNavCategories()
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openCatId, setOpenCatId] = useState<string | null>(null)

  function toggleCat(id: string) {
    setOpenCatId((prev) => (prev === id ? null : id))
  }
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isHome = pathname === '/'
  const transparent = isHome && !scrolled

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  function openSearch() {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      setRecentSearches(stored ? JSON.parse(stored) : [])
    } catch {
      setRecentSearches([])
    }
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  function saveRecent(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      const current: string[] = stored ? JSON.parse(stored) : []
      const updated = [trimmed, ...current.filter((s) => s !== trimmed)].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      setRecentSearches(updated)
    } catch {}
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    if (q) {
      saveRecent(q)
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchOpen(false)
      setMobileOpen(false)
      setSearch('')
    }
  }

  function handleRecentClick(q: string) {
    saveRecent(q)
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setSearch('')
  }

  function removeRecent(q: string) {
    const updated = recentSearches.filter((s) => s !== q)
    setRecentSearches(updated)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
  }

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-50 border-b transition-all duration-300 ${
          transparent
            ? 'border-transparent bg-transparent'
            : 'border-white/10 bg-[#0d0d0d]/95 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-17 max-w-screen-2xl items-center gap-6 px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src={logo}
              alt="Brothers Outlet"
              width={30}
              height={30}
              className="h-7 w-auto object-contain"
            />
          </Link>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-white/10 md:block" />

          {/* Categories nav */}
          <nav className="hidden flex-1 items-center justify-center md:flex">
            {navCategories.map((cat) => (
              <CategoryItem key={cat.id} cat={cat} transparent={transparent} />
            ))}
          </nav>

          {/* Right actions — desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={openSearch}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Buscar"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            <Link
              href="/favoritos"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Favoritos"
            >
              <Heart className="h-4.5 w-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1565a0] text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <button
              className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={openSearch}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/cart"
              className="relative rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1565a0] text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            <button
              className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => {
                setMobileOpen((v) => !v)
                setOpenCatId(null)
              }}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-sm">
            {/* Row — mesma altura e padding do navbar */}
            <div className="mx-auto flex h-17 max-w-screen-2xl items-center gap-4 px-6 lg:px-10">
              <Search className="h-5 w-5 shrink-0 text-white/40" />
              <form onSubmit={handleSearch} className="flex flex-1 items-center">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none"
                />
              </form>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Recentes — aparece abaixo da barra */}
            {recentSearches.length > 0 && (
              <div className="mx-auto max-w-screen-2xl border-t border-white/5 px-6 pb-3 lg:px-10">
                <p className="mb-1.5 pt-3 text-[10px] font-semibold tracking-wider text-white/25 uppercase">
                  Pesquisas recentes
                </p>
                <ul className="flex flex-col gap-0.5">
                  {recentSearches.map((q) => (
                    <li key={q} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleRecentClick(q)}
                        className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-white/20" />
                        {q}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(q)}
                        className="rounded p-1 text-white/20 hover:text-white/60"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile nav menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-17.25 z-40 border-b border-white/10 bg-[#0d0d0d] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/favoritos"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <Heart className="h-4 w-4" />
              Favoritos{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
            </Link>

            {navCategories.length > 0 && (
              <>
                <div className="my-2 border-t border-white/10" />
                <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-white/30 uppercase">
                  Categorias
                </p>
                {navCategories.map((cat) => {
                  const hasChildren = cat.types.length > 0 || cat.brands.length > 0
                  const isOpen = openCatId === cat.id
                  return (
                    <div key={cat.id}>
                      {hasChildren ? (
                        <button
                          onClick={() => toggleCat(cat.id)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          {cat.name}
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={`/search?categoryId=${cat.id}`}
                          className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                          onClick={() => setMobileOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      )}
                      {hasChildren && isOpen && (
                        <div className="flex flex-col pb-1">
                          {cat.types.map((t) => (
                            <Link
                              key={t.id}
                              href={`/search?categoryId=${cat.id}&typeId=${t.id}`}
                              onClick={() => setMobileOpen(false)}
                              className="px-4 py-2 pl-6 text-sm text-white/40 hover:text-white/80"
                            >
                              {t.name}
                            </Link>
                          ))}
                          {cat.brands.map((b) => (
                            <Link
                              key={b.id}
                              href={`/search?categoryId=${cat.id}&brandId=${b.id}`}
                              onClick={() => setMobileOpen(false)}
                              className="px-4 py-2 pl-6 text-sm text-white/40 hover:text-white/80"
                            >
                              {b.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
