'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Marquee from 'react-fast-marquee'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronDown, Zap, ShieldCheck, BadgeCheck } from 'lucide-react'
import {
  useBestSellers,
  useNewArrivals,
  usePopularCategories,
  useDeals,
} from '@/features/products/hooks/useProducts'
import { formatCurrency } from '@/utils/formatCurrency'
import { ProductCard } from '@/features/products/components/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { FadeIn } from '@/components/ui/FadeIn'
import { useIsTablet } from '@/hooks/useIsTablet'
import { useIsNotebook } from '@/hooks/useIsNotebook'

/* ─── static data ──────────────────────────────────────── */

const dealFilters = ['Todos', 'Feminino', 'Masculino', 'Casual', 'Esportivo', 'outros']

const brands = [
  'Adidas',
  'Nike',
  'Puma',
  'Under Armour',
  'Mizuno',
  'Balenciaga',
  'Boss',
  'Dior',
  'Louis Vuitton',
]

const faqs = [
  {
    q: 'Como funciona a Brothers Outlet?',
    a: 'A Brothers Outlet simplifica sua experiência de compra. Navegue pelo catálogo, escolha suas peças favoritas e finalize o pedido. Sua moda chega na velocidade que você merece.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartão de crédito, PIX e boleto bancário. Todas as transações são seguras e criptografadas.',
  },
  {
    q: 'Posso acompanhar meu pedido em tempo real?',
    a: 'Sim! Você pode acompanhar o status do seu pedido em tempo real pela nossa plataforma, desde a separação até a entrega na sua porta.',
  },
  {
    q: 'Há promoções ou descontos especiais?',
    a: 'Sim! Temos promoções exclusivas para clientes cadastrados, além de descontos sazonais de até 40% em coleções selecionadas.',
  },
  {
    q: 'A Brothers Outlet está disponível na minha cidade?',
    a: 'Estamos expandindo rapidamente. Consulte as áreas de entrega disponíveis ao inserir seu CEP no campo de busca.',
  },
]

const stats = [
  { value: '546+', label: 'Entregadores Cadastrados' },
  { value: '789.900+', label: 'Pedidos Entregues' },
  { value: '690+', label: 'Marcas Parceiras' },
  { value: '17.457+', label: 'Peças Disponíveis' },
]

/* ─── component ────────────────────────────────────────── */

export default function HomePage() {
  const [activeDeal, setActiveDeal] = useState('Todos')
  const [currentDeal, setCurrentDeal] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const isTablet = useIsTablet()
  const isNotebook = useIsNotebook()
  const { data: featuredProducts, isLoading } = useBestSellers(12)
  const [currentBestSeller, setCurrentBestSeller] = useState(0)
  const bsSwipeStart = useRef<number | null>(null)
  const [bsPage, setBsPage] = useState(0)
  const BS_PER_PAGE = isTablet ? 2 : isNotebook ? 3 : 4
  const bsTotalPages = Math.ceil((featuredProducts?.length ?? 0) / BS_PER_PAGE)

  const { data: popularCategories, isLoading: popularCategoriesLoading } = usePopularCategories(6)

  const { data: deals, isLoading: dealsLoading } = useDeals(6)

  const { data: newArrivals, isLoading: newArrivalsLoading } = useNewArrivals(12)
  const [naSlide, setNaSlide] = useState(0)
  const naSwipeStart = useRef<number | null>(null)
  const NA_PER_PAGE = isTablet ? 2 : isNotebook ? 3 : 4
  const naTotalPages = Math.ceil((newArrivals?.length ?? 0) / NA_PER_PAGE)

  // Reset to the first page when the per-page count changes (e.g. rotating
  // a tablet), otherwise bsPage/naSlide can point past the new total.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBsPage(0)
    setNaSlide(0)
  }, [isTablet, isNotebook])
  /* eslint-enable react-hooks/set-state-in-effect */

  function onNaSwipeStart(x: number) {
    naSwipeStart.current = x
  }
  function onNaSwipeEnd(x: number, total: number) {
    if (naSwipeStart.current === null) return
    const diff = naSwipeStart.current - x
    if (diff > 40) setNaSlide((p) => Math.min(p + 1, total - 1))
    else if (diff < -40) setNaSlide((p) => Math.max(p - 1, 0))
    naSwipeStart.current = null
  }

  function onBsSwipeStart(x: number) {
    bsSwipeStart.current = x
  }
  function onBsSwipeEnd(x: number) {
    if (bsSwipeStart.current === null) return
    const diff = bsSwipeStart.current - x
    const total = featuredProducts?.length ?? 0
    if (diff > 40) setCurrentBestSeller((p) => Math.min(p + 1, total - 1))
    else if (diff < -40) setCurrentBestSeller((p) => Math.max(p - 1, 0))
    bsSwipeStart.current = null
  }

  useEffect(() => {
    const total = deals?.length ?? 0
    if (total === 0) return
    const timer = setInterval(() => {
      setCurrentDeal((prev) => (prev + 1) % total)
    }, 3500)
    return () => clearInterval(timer)
  }, [deals])

  return (
    <div className="w-full">
      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="relative -mt-17 min-h-screen overflow-hidden">
        {/* Background */}
        <Image
          src="/background-3.jpg"
          alt="Hero"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />

        {/* ── Main content ── */}
        <div className="relative mx-auto flex min-h-screen max-w-screen-2xl flex-col justify-between px-6 pt-36 pb-14 lg:px-10 lg:pt-44 lg:pb-20">
          {/* Top row: text + minimal feature list */}
          <div className="flex items-center justify-between gap-8">
            {/* Left: heading block */}
            <div className="max-w-xl">
              <motion.p
                className="mb-6 text-[11px] font-bold tracking-[0.25em] text-[#4a9fd4] uppercase"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Moda Premium
              </motion.p>

              <motion.h1
                className="mb-6 text-6xl leading-[0.95] font-black tracking-tight text-white uppercase sm:text-7xl lg:text-8xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
              >
                Estilo.
                <br />
                Conforto.
                <br />
                <span className="text-[#4a9fd4]">Atitude.</span>
              </motion.h1>

              <motion.p
                className="mb-10 max-w-xs text-sm leading-relaxed text-white/55"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
              >
                Para quem vive o movimento sem abrir mão do estilo. As melhores marcas, direto pra
                você.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link
                  href="/search"
                  className="inline-flex items-center gap-3 border border-white/50 px-7 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white uppercase transition-all hover:bg-white hover:text-gray-900"
                >
                  Ver coleção
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            </div>

            {/* Right: minimal feature list */}
            <div className="hidden flex-col gap-7 lg:flex">
              {(
                [
                  { Icon: Zap, title: 'Entrega rápida', sub: 'Receba em até 3 dias' },
                  { Icon: ShieldCheck, title: 'Compra segura', sub: 'Pagamento protegido' },
                  {
                    Icon: BadgeCheck,
                    title: 'Produtos de qualidade',
                    sub: 'Qualidade certificada',
                  },
                ] as const
              ).map((b, i) => (
                <motion.div
                  key={b.title}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
                >
                  <b.Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/70" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs font-semibold text-white">{b.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">{b.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom: slide indicators + stats */}
          <div className="flex items-end justify-between">
            {/* Slide dots */}
            <div className="flex items-center gap-4">
              {['01', '02', '03'].map((n, i) => (
                <span
                  key={n}
                  className={`text-xs font-bold tracking-widest transition-colors ${
                    i === 0 ? 'text-white' : 'text-white/25'
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="hidden items-end gap-10 lg:flex">
              {[
                { value: '10+', label: 'Marcas parceiras' },
                { value: '700+', label: 'Vendas realizadas' },
                { value: '4.9★', label: 'Avaliação' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className="text-right"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                >
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] tracking-wider text-white/35 uppercase">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MAIS VENDIDOS ═══════════════════════════════════ */}
      <section className="py-12">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <FadeIn className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Mais Vendidos</h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm font-medium text-[#4a9fd4] hover:underline"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          {isLoading ? (
            <>
              <div className="sm:hidden">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-white/5" />
              </div>
              <div className="hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Mobile: carousel de 1 por vez, até 8 */}
              <div className="sm:hidden">
                <div
                  className="overflow-hidden rounded-2xl"
                  onTouchStart={(e) => onBsSwipeStart(e.touches[0].clientX)}
                  onTouchEnd={(e) => onBsSwipeEnd(e.changedTouches[0].clientX)}
                  onPointerDown={(e) => onBsSwipeStart(e.clientX)}
                  onPointerUp={(e) => onBsSwipeEnd(e.clientX)}
                >
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentBestSeller * 100}%)` }}
                  >
                    {featuredProducts?.map((product) => (
                      <div key={product.id} className="w-full shrink-0">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Indicadores */}
                <div className="mt-4 flex justify-center gap-2">
                  {featuredProducts?.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentBestSeller(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentBestSeller ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/20'
                      }`}
                      aria-label={`Produto ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop/tablet: 4 visíveis, navega por página */}
              <div className="hidden sm:block">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${bsPage * 100}%)` }}
                  >
                    {Array.from({ length: bsTotalPages }).map((_, pageIdx) => (
                      <div key={pageIdx} className="flex w-full shrink-0 gap-6">
                        {featuredProducts
                          ?.slice(pageIdx * BS_PER_PAGE, (pageIdx + 1) * BS_PER_PAGE)
                          .map((product) => (
                            <div
                              key={product.id}
                              className={
                                isTablet
                                  ? 'w-1/2 shrink-0'
                                  : isNotebook
                                    ? 'w-1/3 shrink-0'
                                    : 'w-1/4 shrink-0'
                              }
                            >
                              <ProductCard product={product} />
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setBsPage((p) => Math.max(p - 1, 0))}
                    disabled={bsPage === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                    aria-label="Anterior"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: bsTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setBsPage(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === bsPage ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/20'
                        }`}
                        aria-label={`Página ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setBsPage((p) => Math.min(p + 1, bsTotalPages - 1))}
                    disabled={bsPage === bsTotalPages - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ DEALS ═══════════════════════════════════════════ */}
      <section className="py-12">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Ofertas exclusivas</h2>
            <div className="hidden flex-wrap gap-2 sm:flex">
              {dealFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveDeal(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activeDeal === f
                      ? 'border-[#1565a0] bg-[#1565a0] text-white'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-[#1565a0]/60 hover:text-white/80'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {dealsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <>
              {/* ── Mobile: carousel ── */}
              <div className="relative overflow-hidden rounded-2xl sm:hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentDeal * 100}%)` }}
                >
                  {(deals ?? []).map((deal) => {
                    const discountPct = Math.round(
                      ((deal.originalPrice - deal.price) / deal.originalPrice) * 100
                    )
                    const stockLabel =
                      deal.stock <= 3
                        ? `Últimas ${deal.stock} unidades!`
                        : `Restam ${deal.stock} unidades`
                    return (
                      <Link
                        key={deal.id}
                        href={`/product/${deal.id}`}
                        className="relative w-full shrink-0"
                      >
                        <div className="relative aspect-[4/3]">
                          <Image
                            src={deal.images[0]}
                            alt={deal.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        </div>
                        <span className="absolute top-3 left-3 rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                          -{discountPct}%
                        </span>
                        <div className="absolute right-3 bottom-3 left-3">
                          <p className="text-xs font-medium text-amber-400">{stockLabel}</p>
                          <p className="text-sm font-bold text-white">{deal.name}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                {/* Dots */}
                <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                  {(deals ?? []).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentDeal(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentDeal ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/50'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                {/* Arrows */}
                <button
                  onClick={() =>
                    setCurrentDeal(
                      (prev) => (prev - 1 + (deals?.length ?? 1)) % (deals?.length ?? 1)
                    )
                  }
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50"
                  aria-label="Anterior"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentDeal((prev) => (prev + 1) % (deals?.length ?? 1))}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* ── Desktop: grid ── */}
              <div className="hidden grid-cols-3 gap-4 sm:grid">
                {(deals ?? []).map((deal) => {
                  const discountPct = Math.round(
                    ((deal.originalPrice - deal.price) / deal.originalPrice) * 100
                  )
                  const stockLabel =
                    deal.stock <= 3
                      ? `Últimas ${deal.stock} unidades!`
                      : `Restam ${deal.stock} unidades`
                  return (
                    <Link
                      key={deal.id}
                      href={`/product/${deal.id}`}
                      className="group relative overflow-hidden rounded-2xl"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={deal.images[0]}
                          alt={deal.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      </div>
                      <span className="absolute top-3 left-3 rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        -{discountPct}%
                      </span>
                      <div className="absolute right-3 bottom-3 left-3">
                        <p className="text-xs font-medium text-amber-400">{stockLabel}</p>
                        <p className="text-sm font-bold text-white">{deal.name}</p>
                        <p className="text-xs text-white/50">{formatCurrency(deal.price)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ BRANDS ══════════════════════════════════════════ */}
      <section className="py-10">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <Marquee gradient gradientColor="#0d0d0d" speed={40} pauseOnHover>
            {brands.map((brand) => (
              <Link
                key={brand}
                href="/"
                className="mx-10 opacity-30 transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-bold tracking-[0.18em] text-white uppercase">
                  {brand}
                </span>
              </Link>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ═══ CATEGORIES ══════════════════════════════════════ */}
      <section className="py-12">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <FadeIn className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Populares</h2>
            <Link href={'/'} className="text-sm font-medium text-[#1565a0] hover:underline">
              Ver todas
            </Link>
          </FadeIn>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {popularCategoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="aspect-square w-full rounded-2xl bg-white/5" />
                    <Skeleton className="h-3 w-3/4 bg-white/5" />
                  </div>
                ))
              : popularCategories?.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/search?categoryId=${cat.id}`}
                    className="group flex flex-col gap-2"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] transition-all duration-300 group-hover:border-white/20">
                      {cat.image && (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/80 group-hover:text-white">
                        {cat.name}
                      </p>
                      <p className="text-xs text-white/30">{cat.count} peças</p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ═══ NOVIDADES ═══════════════════════════════════════ */}
      <section className="py-12">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <FadeIn className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Novidades</h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm font-medium text-[#4a9fd4] hover:underline"
            >
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          {newArrivalsLoading ? (
            <>
              <div className="sm:hidden">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-white/5" />
              </div>
              <div className="hidden grid-cols-2 gap-6 sm:grid lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* ── Mobile: carousel 1 por vez ── */}
              <div className="sm:hidden">
                <div
                  className="overflow-hidden rounded-2xl"
                  onTouchStart={(e) => onNaSwipeStart(e.touches[0].clientX)}
                  onTouchEnd={(e) =>
                    onNaSwipeEnd(e.changedTouches[0].clientX, newArrivals?.length ?? 0)
                  }
                  onPointerDown={(e) => onNaSwipeStart(e.clientX)}
                  onPointerUp={(e) => onNaSwipeEnd(e.clientX, newArrivals?.length ?? 0)}
                >
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${naSlide * 100}%)` }}
                  >
                    {newArrivals?.map((product) => (
                      <div key={product.id} className="w-full shrink-0">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  {newArrivals?.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setNaSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === naSlide ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/20'
                      }`}
                      aria-label={`Produto ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* ── Desktop: 4 visíveis, navega por página ── */}
              <div className="hidden sm:block">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${naSlide * 100}%)` }}
                  >
                    {Array.from({ length: naTotalPages }).map((_, pageIdx) => (
                      <div key={pageIdx} className="flex w-full shrink-0 gap-6">
                        {newArrivals
                          ?.slice(pageIdx * NA_PER_PAGE, (pageIdx + 1) * NA_PER_PAGE)
                          .map((product) => (
                            <div
                              key={product.id}
                              className={
                                isTablet
                                  ? 'w-1/2 shrink-0'
                                  : isNotebook
                                    ? 'w-1/3 shrink-0'
                                    : 'w-1/4 shrink-0'
                              }
                            >
                              <ProductCard product={product} />
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setNaSlide((p) => Math.max(p - 1, 0))}
                    disabled={naSlide === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                    aria-label="Anterior"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: naTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setNaSlide(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === naSlide ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/20'
                        }`}
                        aria-label={`Página ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setNaSlide((p) => Math.min(p + 1, naTotalPages - 1))}
                    disabled={naSlide === naTotalPages - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ CTA BANNER ══════════════════════════════════════ */}
      <section className="mx-auto max-w-screen-2xl px-6 py-12 lg:px-10">
        <div className="group relative overflow-hidden rounded-3xl">
          <Image
            src="/banner-cta.png"
            alt="Compre na Forget"
            fill
            className="object-cover opacity-70 transition-opacity"
          />
          <div className="relative z-10 flex flex-col items-center justify-center px-8 py-20 text-center">
            <p className="mb-3 text-xs font-bold tracking-widest text-white uppercase">
              Nova coleção disponível
            </p>
            <h2 className="mb-4 text-4xl leading-tight font-extrabold text-white uppercase sm:text-5xl">
              Vista o que você é.
            </h2>
            <p className="mb-8 max-w-md text-sm text-white/70">
              Moda que combina com você — explore milhares de peças com entrega rápida e os melhores
              preços.
            </p>
            <Link
              href="/"
              className="rounded-full bg-[#1565a0] px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Explorar coleção
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
