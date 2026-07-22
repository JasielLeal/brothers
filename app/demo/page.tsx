'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Marquee from 'react-fast-marquee'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, ShieldCheck, BadgeCheck, Heart } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { FadeIn } from '@/components/ui/FadeIn'
import { useIsTablet } from '@/hooks/useIsTablet'
import { useIsNotebook } from '@/hooks/useIsNotebook'

/* ─── static fake data (catálogo real ainda em cadastro) ──────────── */

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

const dealFilters = ['Todos', 'Feminino', 'Masculino', 'Casual', 'Esportivo', 'outros']

const categories = [
  {
    name: 'Camisetas',
    count: 24,
    image: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80',
  },
  {
    name: 'Calças',
    count: 18,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80',
  },
  {
    name: 'Calçados',
    count: 21,
    image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&q=80',
  },
  {
    name: 'Jaquetas',
    count: 12,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
  },
  {
    name: 'Acessórios',
    count: 16,
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80',
  },
  {
    name: 'Moletons',
    count: 14,
    image: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=600&q=80',
  },
]

interface FakeProduct {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  image: string
  stock: number
}

const bestSellers: FakeProduct[] = [
  {
    id: 'bs-1',
    name: 'Camiseta Oversize Essential Preta',
    category: 'Camisetas',
    price: 129.9,
    originalPrice: 179.9,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    stock: 14,
  },
  {
    id: 'bs-2',
    name: 'Calça Cargo Wide Leg Verde',
    category: 'Calças',
    price: 189.9,
    originalPrice: 249.9,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    stock: 9,
  },
  {
    id: 'bs-3',
    name: 'Tênis Chunky Branco Street',
    category: 'Calçados',
    price: 349.9,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    stock: 6,
  },
  {
    id: 'bs-4',
    name: 'Jaqueta Corta-Vento Preta',
    category: 'Jaquetas',
    price: 219.9,
    originalPrice: 289.9,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    stock: 3,
  },
  {
    id: 'bs-5',
    name: 'Boné Aba Reta Snapback',
    category: 'Acessórios',
    price: 79.9,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
    stock: 20,
  },
  {
    id: 'bs-6',
    name: 'Camiseta Regular Básica Cinza',
    category: 'Camisetas',
    price: 59.9,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80',
    stock: 30,
  },
  {
    id: 'bs-7',
    name: 'Calça Jogger Slim Preta',
    category: 'Calças',
    price: 149.9,
    originalPrice: 199.9,
    image: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&q=80',
    stock: 8,
  },
  {
    id: 'bs-8',
    name: 'Tênis Skate Casual Preto',
    category: 'Calçados',
    price: 299.9,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
    stock: 11,
  },
  {
    id: 'bs-9',
    name: 'Camiseta Estampada Street Branca',
    category: 'Camisetas',
    price: 99.9,
    originalPrice: 139.9,
    image: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80',
    stock: 17,
  },
  {
    id: 'bs-10',
    name: 'Calça Jeans Reta Azul',
    category: 'Calças',
    price: 179.9,
    image: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80',
    stock: 12,
  },
  {
    id: 'bs-11',
    name: 'Sandália Slide Confort',
    category: 'Calçados',
    price: 89.9,
    originalPrice: 119.9,
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80',
    stock: 5,
  },
  {
    id: 'bs-12',
    name: 'Jaqueta Bomber Verde Militar',
    category: 'Jaquetas',
    price: 259.9,
    originalPrice: 329.9,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    stock: 4,
  },
]

const newArrivals: FakeProduct[] = [
  {
    id: 'na-1',
    name: 'Camiseta Cropped Tie-Dye Rosa',
    category: 'Camisetas',
    price: 89.9,
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&q=80',
    stock: 16,
  },
  {
    id: 'na-2',
    name: 'Calça Alfaiataria Bege',
    category: 'Calças',
    price: 209.9,
    originalPrice: 259.9,
    image:
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=697&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    stock: 7,
  },
  {
    id: 'na-3',
    name: 'Tênis Runner Performance Cinza',
    category: 'Calçados',
    price: 379.9,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80',
    stock: 9,
  },
  {
    id: 'na-4',
    name: 'Moletom Canguru Oversize Preto',
    category: 'Moletons',
    price: 219.9,
    originalPrice: 279.9,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
    stock: 6,
  },
  {
    id: 'na-5',
    name: 'Boné Trucker Bordado',
    category: 'Acessórios',
    price: 69.9,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    stock: 22,
  },
  {
    id: 'na-6',
    name: 'Camiseta Regata Basic Branca',
    category: 'Camisetas',
    price: 49.9,
    image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600&q=80',
    stock: 25,
  },
  {
    id: 'na-7',
    name: 'Bermuda Cargo Bege',
    category: 'Calças',
    price: 139.9,
    originalPrice: 179.9,
    image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&q=80',
    stock: 13,
  },
  {
    id: 'na-8',
    name: 'Tênis Slip-On Casual Preto',
    category: 'Calçados',
    price: 219.9,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    stock: 10,
  },
  {
    id: 'na-9',
    name: 'Jaqueta Jeans Clássica',
    category: 'Jaquetas',
    price: 229.9,
    originalPrice: 289.9,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
    stock: 5,
  },
  {
    id: 'na-10',
    name: 'Óculos de Sol Retrô',
    category: 'Acessórios',
    price: 99.9,
    originalPrice: 149.9,
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80',
    stock: 18,
  },
  {
    id: 'na-11',
    name: 'Camiseta Manga Longa Listrada',
    category: 'Camisetas',
    price: 109.9,
    image: 'https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=600&q=80',
    stock: 14,
  },
  {
    id: 'na-12',
    name: 'Mochila Urbana Impermeável',
    category: 'Acessórios',
    price: 159.9,
    originalPrice: 199.9,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    stock: 8,
  },
]

interface FakeDeal extends FakeProduct {
  originalPrice: number
  tag: string
}

const deals: FakeDeal[] = [
  { ...bestSellers[0], originalPrice: bestSellers[0].originalPrice!, stock: 3, tag: 'Masculino' },
  { ...bestSellers[1], originalPrice: bestSellers[1].originalPrice!, stock: 2, tag: 'Casual' },
  { ...bestSellers[3], originalPrice: bestSellers[3].originalPrice!, stock: 5, tag: 'Esportivo' },
  { ...newArrivals[1], originalPrice: newArrivals[1].originalPrice!, stock: 4, tag: 'Feminino' },
  { ...newArrivals[3], originalPrice: newArrivals[3].originalPrice!, stock: 6, tag: 'Casual' },
  { ...newArrivals[11], originalPrice: newArrivals[11].originalPrice!, stock: 9, tag: 'outros' },
]

/* ─── product card (visual idêntico ao ProductCard real) ──────────── */

function DemoProductCard({ product }: { product: FakeProduct }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-[#1a1a1a] transition-colors hover:bg-[#222]"
    >
      <div className="relative overflow-hidden rounded-t-2xl bg-[#111]">
        <div className="relative aspect-square">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>

        {discount && (
          <span className="absolute top-3 left-3 rounded-full bg-[#1565a0] px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}

        <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
          <Heart className="h-4 w-4 text-white/60" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
          {product.category}
        </p>
        <h3 className="mb-3 line-clamp-2 text-sm leading-snug font-bold text-white/80 group-hover:text-white">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-col">
          {product.originalPrice && (
            <span className="text-xs text-white/30 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
          <span className="text-lg font-extrabold text-white">{formatCurrency(product.price)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ─── page ─────────────────────────────────────────────────────────── */

export default function DemoPage() {
  const [activeDeal, setActiveDeal] = useState('Todos')
  const [currentDeal, setCurrentDeal] = useState(0)
  const isTablet = useIsTablet()
  const isNotebook = useIsNotebook()

  const [currentBestSeller, setCurrentBestSeller] = useState(0)
  const bsSwipeStart = useRef<number | null>(null)
  const [bsPage, setBsPage] = useState(0)
  const BS_PER_PAGE = isTablet ? 2 : isNotebook ? 3 : 4
  const bsTotalPages = Math.ceil(bestSellers.length / BS_PER_PAGE)

  const [naSlide, setNaSlide] = useState(0)
  const naSwipeStart = useRef<number | null>(null)
  const NA_PER_PAGE = isTablet ? 2 : isNotebook ? 3 : 4
  const naTotalPages = Math.ceil(newArrivals.length / NA_PER_PAGE)

  const filteredDeals = activeDeal === 'Todos' ? deals : deals.filter((d) => d.tag === activeDeal)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBsPage(0)
    setNaSlide(0)
  }, [isTablet, isNotebook])

  useEffect(() => {
    setCurrentDeal(0)
  }, [activeDeal])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const total = filteredDeals.length
    if (total === 0) return
    const timer = setInterval(() => {
      setCurrentDeal((prev) => (prev + 1) % total)
    }, 3500)
    return () => clearInterval(timer)
  }, [filteredDeals.length])

  function onBsSwipeStart(x: number) {
    bsSwipeStart.current = x
  }
  function onBsSwipeEnd(x: number) {
    if (bsSwipeStart.current === null) return
    const diff = bsSwipeStart.current - x
    if (diff > 40) setCurrentBestSeller((p) => Math.min(p + 1, bestSellers.length - 1))
    else if (diff < -40) setCurrentBestSeller((p) => Math.max(p - 1, 0))
    bsSwipeStart.current = null
  }

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

  return (
    <div className="w-full">
      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="relative -mt-17 min-h-screen overflow-hidden">
        <Image
          src="/background-3.jpg"
          alt="Hero"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />

        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-screen-2xl flex-col justify-between px-6 pt-36 pb-14 lg:px-10 lg:pt-44 lg:pb-20">
          <div className="flex items-center justify-between gap-8">
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

          <div className="flex items-end justify-between">
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

          {/* Mobile: carousel de 1 por vez */}
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
                {bestSellers.map((product) => (
                  <div key={product.id} className="w-full shrink-0">
                    <DemoProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {bestSellers.map((_, i) => (
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

          {/* Desktop/tablet: visíveis por página */}
          <div className="hidden sm:block">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${bsPage * 100}%)` }}
              >
                {Array.from({ length: bsTotalPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="flex w-full shrink-0 gap-6">
                    {bestSellers
                      .slice(pageIdx * BS_PER_PAGE, (pageIdx + 1) * BS_PER_PAGE)
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
                          <DemoProductCard product={product} />
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

          {/* Mobile: carousel */}
          <div className="relative overflow-hidden rounded-2xl sm:hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentDeal * 100}%)` }}
            >
              {filteredDeals.map((deal) => {
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
                      <Image src={deal.image} alt={deal.name} fill className="object-cover" />
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
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
              {filteredDeals.map((_, i) => (
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
            <button
              onClick={() =>
                setCurrentDeal((prev) => (prev - 1 + filteredDeals.length) % filteredDeals.length)
              }
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50"
              aria-label="Anterior"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={() => setCurrentDeal((prev) => (prev + 1) % filteredDeals.length)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop: grid */}
          <div className="hidden grid-cols-3 gap-4 sm:grid">
            {filteredDeals.map((deal) => {
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
                      src={deal.image}
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
        </div>
      </section>

      {/* ═══ BRANDS ══════════════════════════════════════════ */}
      <section className="py-10">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <Marquee gradient gradientColor="#0d0d0d" speed={40} pauseOnHover>
            {brands.map((brand) => (
              <span
                key={brand}
                className="mx-10 text-sm font-bold tracking-[0.18em] text-white uppercase opacity-30"
              >
                {brand}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ═══ CATEGORIES ══════════════════════════════════════ */}
      <section className="py-12">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <FadeIn className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Populares</h2>
            <Link href="/search" className="text-sm font-medium text-[#1565a0] hover:underline">
              Ver todas
            </Link>
          </FadeIn>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {categories.map((cat) => (
              <Link key={cat.name} href="/search" className="group flex flex-col gap-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] transition-all duration-300 group-hover:border-white/20">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
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

          {/* Mobile: carousel 1 por vez */}
          <div className="sm:hidden">
            <div
              className="overflow-hidden rounded-2xl"
              onTouchStart={(e) => onNaSwipeStart(e.touches[0].clientX)}
              onTouchEnd={(e) => onNaSwipeEnd(e.changedTouches[0].clientX, newArrivals.length)}
              onPointerDown={(e) => onNaSwipeStart(e.clientX)}
              onPointerUp={(e) => onNaSwipeEnd(e.clientX, newArrivals.length)}
            >
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${naSlide * 100}%)` }}
              >
                {newArrivals.map((product) => (
                  <div key={product.id} className="w-full shrink-0">
                    <DemoProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {newArrivals.map((_, i) => (
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

          {/* Desktop: visíveis por página */}
          <div className="hidden sm:block">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${naSlide * 100}%)` }}
              >
                {Array.from({ length: naTotalPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="flex w-full shrink-0 gap-6">
                    {newArrivals
                      .slice(pageIdx * NA_PER_PAGE, (pageIdx + 1) * NA_PER_PAGE)
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
                          <DemoProductCard product={product} />
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
