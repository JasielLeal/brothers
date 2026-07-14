'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import {
  useProducts,
  useStockByCategory,
  useStockByType,
} from '@/features/products/hooks/useProducts'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { formatCurrency } from '@/utils/formatCurrency'
import { TrendingUp, TrendingDown, ChevronDown, AlertTriangle } from 'lucide-react'
import type { StockByCategory, StockByType } from '@/features/products/types/product.types'

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/* ── BarChart (receita por dia do mês selecionado) ─────── */
function BarChart({
  curData,
  prevData,
}: {
  curData: { day: number; revenue: number }[]
  prevData: { day: number; revenue: number }[]
}) {
  const maxVal = Math.max(...curData.map((d) => d.revenue), ...prevData.map((d) => d.revenue), 1)
  const H = 130
  const barW = 6
  const gap = 2
  const groupW = barW * 2 + gap + 10
  const totalW = curData.length * groupW

  return (
    <svg viewBox={`0 0 ${totalW} ${H + 18}`} className="w-full" preserveAspectRatio="none">
      {curData.map((d, i) => {
        const x = i * groupW + 2
        const curH = (d.revenue / maxVal) * H
        const prevH = ((prevData[i]?.revenue ?? 0) / maxVal) * H
        return (
          <g key={i}>
            <rect x={x} y={H - curH} width={barW} height={curH} rx="3" fill="#4A6CF7" />
            <rect
              x={x + barW + gap}
              y={H - prevH}
              width={barW}
              height={prevH}
              rx="3"
              fill="#E2E8F0"
            />
            <text x={x + barW + gap / 2} y={H + 14} textAnchor="middle" fontSize="8" fill="#94A3B8">
              {d.day}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── LineChart (pedidos semanais) ──────────────────────── */
function LineChart({ curData, prevData }: { curData: number[]; prevData: number[] }) {
  const W = 280
  const H = 80
  const maxVal = Math.max(...curData, ...prevData, 1)

  const toPoints = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / Math.max(arr.length - 1, 1)) * W
        const y = H - (v / maxVal) * (H - 8)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

  const areaPoints = curData
    .map((v, i) => {
      const x = (i / Math.max(curData.length - 1, 1)) * W
      const y = H - (v / maxVal) * (H - 8)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <polygon points={`0,${H} ${areaPoints} ${W},${H}`} fill="#4A6CF7" fillOpacity="0.07" />
      <polyline
        points={toPoints(prevData)}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polyline
        points={toPoints(curData)}
        fill="none"
        stroke="#4A6CF7"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── SlideCarousel ─────────────────────────────────────── */
function SlideCarousel({ children }: { children: React.ReactNode[] }) {
  const items = [children[children.length - 1], ...children, children[0]]
  const [idx, setIdx] = useState(1)
  const [transitioning, setTransitioning] = useState(true)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    if (!transitioning) return
    if (idx === 0) {
      const t = setTimeout(() => {
        setTransitioning(false)
        setIdx(children.length)
      }, 300)
      return () => clearTimeout(t)
    }
    if (idx === items.length - 1) {
      const t = setTimeout(() => {
        setTransitioning(false)
        setIdx(1)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [idx, transitioning, items.length, children.length])

  useEffect(() => {
    if (!transitioning) {
      const t = requestAnimationFrame(() => setTransitioning(true))
      return () => cancelAnimationFrame(t)
    }
  }, [transitioning])

  const realIdx = idx === 0 ? children.length - 1 : idx === items.length - 1 ? 0 : idx - 1

  return (
    <div className="lg:hidden">
      <div
        className="overflow-hidden"
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (startX.current === null) return
          const dx = startX.current - e.changedTouches[0].clientX
          if (Math.abs(dx) > 40) {
            setTransitioning(true)
            setIdx((i) => i + (dx > 0 ? 1 : -1))
          }
          startX.current = null
        }}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${idx * 100}%)`,
            transition: transitioning ? 'transform 300ms ease' : 'none',
          }}
        >
          {items.map((child, i) => (
            <div key={i} className="w-full shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {children.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setTransitioning(true)
              setIdx(i + 1)
            }}
            className={`h-1.5 rounded-full transition-all ${i === realIdx ? 'w-4 bg-[#4A6CF7]' : 'w-1.5 bg-gray-200 dark:bg-neutral-700'}`}
          />
        ))}
      </div>
    </div>
  )
}

/* ── page ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: productsData } = useProducts({ limit: 100 })
  const { data: ordersData } = useOrders({ limit: 1000 })
  const { data: stockByCategory = [] } = useStockByCategory()
  const { data: stockByType = [] } = useStockByType()

  const orders = ordersData?.data ?? []
  const confirmedOrders = orders.filter((o) => o.status === 'DELIVERED')

  const investedValue = useMemo(
    () => (productsData?.data ?? []).reduce((sum, p) => sum + (p.costPrice ?? 0) * p.stock, 0),
    [productsData]
  )

  const stockSaleValue = useMemo(
    () => (productsData?.data ?? []).reduce((sum, p) => sum + p.price * p.stock, 0),
    [productsData]
  )

  const totalSales = useMemo(
    () => confirmedOrders.reduce((sum, o) => sum + o.total, 0),
    [confirmedOrders]
  )
  const now = new Date()

  // ── Month selector ─────────────────────────────────────
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`

  const availableMonths = useMemo(() => {
    const months = new Set<string>([currentMonthKey])
    orders.forEach((o) => {
      const d = new Date(o.createdAt)
      months.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 6)
  }, [orders, currentMonthKey])

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
    setSelectedMonth(availableMonths[0])
  }

  const selectedMonthParts = selectedMonth.split('-').map(Number)
  const selYear = selectedMonthParts[0]
  const selMonth = selectedMonthParts[1]

  // ── Revenue per day (selected month) ──────────────────
  const { curRevenueByDay, prevRevenueByDay, totalRevenue, prevTotalRevenue } = useMemo(() => {
    const daysInSel = new Date(selYear, selMonth + 1, 0).getDate()

    const prevMonth = selMonth === 0 ? 11 : selMonth - 1
    const prevYear = selMonth === 0 ? selYear - 1 : selYear
    const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate()

    const cur = Array.from({ length: daysInSel }, (_, i) => ({ day: i + 1, revenue: 0 }))
    const prev = Array.from({ length: daysInPrev }, (_, i) => ({ day: i + 1, revenue: 0 }))

    let totalRevenue = 0
    let prevTotalRevenue = 0

    confirmedOrders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (d.getFullYear() === selYear && d.getMonth() === selMonth) {
        const idx = d.getDate() - 1
        if (idx < cur.length) {
          cur[idx].revenue += o.total
          totalRevenue += o.total
        }
      }
      if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        const idx = d.getDate() - 1
        if (idx < prev.length) {
          prev[idx].revenue += o.total
          prevTotalRevenue += o.total
        }
      }
    })

    return { curRevenueByDay: cur, prevRevenueByDay: prev, totalRevenue, prevTotalRevenue }
  }, [confirmedOrders, selectedMonth, selYear, selMonth])

  const revenueTrend =
    prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : null

  // ── Top products (por quantidade vendida) ──────────────
  const topProducts = useMemo(() => {
    const counts = new Map<string, { count: number; name: string; productId: string | null }>()
    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productId ?? item.productName
        const e = counts.get(key) ?? {
          count: 0,
          name: item.productName,
          productId: item.productId,
        }
        e.count += item.quantity
        counts.set(key, e)
      })
    })
    const ranked = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
    return ranked.map((tp) => {
      const product = productsData?.data.find((p) => p.id === tp.productId)
      return { ...tp, image: product?.images[0] ?? null, price: product?.price ?? 0 }
    })
  }, [confirmedOrders, productsData])

  // fallback: se não há pedidos, mostrar featured products
  const displayTopProducts = useMemo(() => {
    if (topProducts.length > 0) return topProducts
    return (productsData?.data ?? []).slice(0, 4).map((p) => ({
      productId: p.id,
      name: p.name,
      count: 0,
      image: p.images[0] ?? null,
      price: p.price,
    }))
  }, [topProducts, productsData])

  // ── Categories (por unidades vendidas em pedidos confirmados) ─
  const categoryStats = useMemo(() => {
    const cats = new Map<string, { name: string; count: number }>()
    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const product = productsData?.data.find((p) => p.id === item.productId)
        if (!product) return
        const e = cats.get(product.categoryId) ?? { name: product.category.name, count: 0 }
        e.count += item.quantity
        cats.set(product.categoryId, e)
      })
    })
    const colors = ['#4A6CF7', '#F5A623', '#4BC9C8', '#22C55E', '#EF4444']
    return Array.from(cats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((c, i) => ({ ...c, color: colors[i] }))
  }, [confirmedOrders, productsData])

  // ── Weekly orders (last 7 days vs prev 7 days) ─────────
  const { weekCur, weekPrev, weekTotalCur, weekTotalPrev } = useMemo(() => {
    const cur: number[] = []
    const prev: number[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const dayStr = day.toISOString().slice(0, 10)

      const prevDay = new Date(day)
      prevDay.setDate(day.getDate() - 7)
      const prevDayStr = prevDay.toISOString().slice(0, 10)

      cur.push(confirmedOrders.filter((o) => o.createdAt.slice(0, 10) === dayStr).length)
      prev.push(confirmedOrders.filter((o) => o.createdAt.slice(0, 10) === prevDayStr).length)
    }
    const weekTotalCur = cur.reduce((s, v) => s + v, 0)
    const weekTotalPrev = prev.reduce((s, v) => s + v, 0)
    return { weekCur: cur, weekPrev: prev, weekTotalCur, weekTotalPrev }
  }, [confirmedOrders, now])

  const weekTrend =
    weekTotalPrev > 0 ? ((weekTotalCur - weekTotalPrev) / weekTotalPrev) * 100 : null
  const weekTrendUp = weekTrend === null || weekTrend >= 0

  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`
  const rangeLabel = `${MONTH_NAMES[selMonth]} ${selYear}`

  const weekLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getDate() - 6}–${now.getDate()}`

  // ── Month picker label ──────────────────────────────────
  function monthKeyToLabel(key: string) {
    const [y, m] = key.split('-').map(Number)
    return `${MONTH_NAMES[m]} ${y}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center">
        <MobileMenuButton />
        <h1 className="text-xl font-bold text-gray-800 dark:text-neutral-100">Dashboard</h1>
      </div>

      {/* ── top row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Receita */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 xl:col-span-3 dark:bg-neutral-900 dark:ring-neutral-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">Receita</h2>
            {/* Month picker */}
            <div className="relative">
              <button
                onClick={() => setMonthPickerOpen((o) => !o)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {monthKeyToLabel(selectedMonth)}
                <ChevronDown className="h-3 w-3 text-gray-400 dark:text-neutral-500" />
              </button>
              {monthPickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMonthPickerOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 min-w-32 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
                    {availableMonths.map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedMonth(key)
                          setMonthPickerOpen(false)
                        }}
                        className={`block w-full px-4 py-2 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 ${selectedMonth === key ? 'font-semibold text-[#4A6CF7]' : 'text-gray-600 dark:text-neutral-300'}`}
                      >
                        {monthKeyToLabel(key)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="mt-1.5 mb-3 flex items-center gap-2">
            {revenueTrend !== null ? (
              <span
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${revenueTrend >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'}`}
              >
                {revenueTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(revenueTrend).toFixed(1)}%
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
                —
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-neutral-500">vs mês anterior</span>
          </div>
          <p className="mb-4 text-xs text-gray-400 dark:text-neutral-500">Vendas de {rangeLabel}</p>
          <BarChart curData={curRevenueByDay} prevData={prevRevenueByDay} />
          <div className="mt-3 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4A6CF7]" />
              {monthLabel}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-neutral-700" />
              Mês anterior
            </span>
          </div>
        </div>

        {/* Valor Investido + Total de Vendas */}
        <div className="flex flex-col gap-5 xl:col-span-2">
          <InvestedValueCard
            value={investedValue}
            saleValue={stockSaleValue}
            productsCount={productsData?.data.filter((p) => (p.costPrice ?? 0) > 0).length ?? 0}
          />
          <TotalSalesCard value={totalSales} count={confirmedOrders.length} />
        </div>
      </div>

      {/* ── bottom row ───────────────────────────────── */}
      {/* Mobile carousel */}
      <SlideCarousel>
        <CategoriesCard categoryStats={categoryStats} />
        <TopProductsCard products={displayTopProducts} />
        <WeeklyOrdersCard
          curData={weekCur}
          prevData={weekPrev}
          total={weekTotalCur}
          trend={weekTrend}
          trendUp={weekTrendUp}
          label={weekLabel}
        />
      </SlideCarousel>

      {/* Desktop grid */}
      <div className="hidden grid-cols-3 gap-5 lg:grid">
        <CategoriesCard categoryStats={categoryStats} />
        <TopProductsCard products={displayTopProducts} />
        <WeeklyOrdersCard
          curData={weekCur}
          prevData={weekPrev}
          total={weekTotalCur}
          trend={weekTrend}
          trendUp={weekTrendUp}
          label={weekLabel}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <StockByCategoryCard categories={stockByCategory} />
        <StockByTypeCard types={stockByType} />
      </div>

      <p className="text-xs text-gray-400 dark:text-neutral-500">
        {productsData?.total ?? 0} produtos · {confirmedOrders.length} pedidos confirmados
      </p>
    </div>
  )
}

/* ── sub-cards ─────────────────────────────────────────── */
const CATEGORY_POSITIONS = [
  'absolute top-0 left-0',
  'absolute top-5 right-0',
  'absolute bottom-0 left-10',
]

function CategoriesCard({
  categoryStats,
}: {
  categoryStats: { name: string; count: number; color: string }[]
}) {
  const totalSold = categoryStats.reduce((s, c) => s + c.count, 0)
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">
        Categorias de Destaque
      </h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400 dark:text-neutral-500">
        {totalSold > 0 ? `${totalSold} unidades vendidas` : 'Sem vendas ainda'}
      </p>

      {categoryStats.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300 dark:text-neutral-600">
          Sem vendas
        </div>
      ) : (
        <div className="relative mx-auto h-52 w-52">
          {categoryStats.map((cat, i) => (
            <div
              key={cat.name}
              className={`${CATEGORY_POSITIONS[i]} flex h-30 w-30 items-center justify-center rounded-full`}
              style={{ backgroundColor: cat.color }}
            >
              <div className="text-center text-white">
                <p className="text-lg leading-none font-bold">{cat.count}</p>
                <p className="mt-1 text-[11px] font-medium">{cat.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TopProductsCard({
  products,
}: {
  products: {
    productId: string | null
    name: string
    count: number
    image: string | null
    price: number
  }[]
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">Mais Vendidos</h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400 dark:text-neutral-500">
        Produtos com maior demanda
      </p>

      {products.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300 dark:text-neutral-600">
          Sem vendas ainda
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.productId} className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-300 dark:text-neutral-600">
                    ?
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">
                  {p.name}
                </p>
                {p.count > 0 && (
                  <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                    {p.count} vendido{p.count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                {p.price > 0 ? formatCurrency(p.price) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WeeklyOrdersCard({
  curData,
  prevData,
  total,
  trend,
  trendUp,
  label,
}: {
  curData: number[]
  prevData: number[]
  total: number
  trend: number | null
  trendUp: boolean
  label: string
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">Pedidos</h2>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {total.toLocaleString('pt-BR')}
      </p>
      <div className="mt-1.5 mb-3 flex items-center gap-2">
        {trend !== null ? (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${trendUp ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'}`}
          >
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-neutral-800 dark:text-neutral-500">
            —
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-neutral-500">vs semana anterior</span>
      </div>
      <p className="mb-4 text-xs text-gray-400 dark:text-neutral-500">{label}</p>
      <LineChart curData={curData} prevData={prevData} />
      <div className="mt-3 flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4A6CF7]" />
          Últimos 7 dias
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-neutral-700" />
          Semana anterior
        </span>
      </div>
    </div>
  )
}

function TotalSalesCard({ value, count }: { value: number; count: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">Total de Vendas</h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400 dark:text-neutral-500">
        {count > 0
          ? `${count} pedido${count !== 1 ? 's' : ''} confirmado${count !== 1 ? 's' : ''}`
          : 'Nenhuma venda ainda'}
      </p>
      {value === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300 dark:text-neutral-600">
          Sem dados
        </div>
      ) : (
        <div className="flex flex-col justify-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(value)}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">Acumulado geral</p>
        </div>
      )}
    </div>
  )
}

function InvestedValueCard({
  value,
  saleValue,
  productsCount,
}: {
  value: number
  saleValue: number
  productsCount: number
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">
        Valor do Estoque
      </h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400 dark:text-neutral-500">
        {productsCount > 0
          ? `${productsCount} produto${productsCount !== 1 ? 's' : ''} com custo cadastrado`
          : 'Nenhum custo cadastrado'}
      </p>
      {value === 0 && saleValue === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300 dark:text-neutral-600">
          Sem dados
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(value)}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
              Valor Investido
              <br />
              Custo × estoque atual
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(saleValue)}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
              Valor de Venda
              <br />
              Preço × estoque atual
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StockByCategoryCard({ categories }: { categories: StockByCategory[] }) {
  const sorted = [...categories].sort((a, b) => {
    if (a.isLow !== b.isLow) return a.isLow ? -1 : 1
    return a.totalStock - b.totalStock
  })

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">
        Estoque por Categoria
      </h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400 dark:text-neutral-500">
        Unidades em estoque de produtos ativos, por categoria
      </p>

      {sorted.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300 dark:text-neutral-600">
          Sem categorias
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((cat) => {
            const max = Math.max(...sorted.map((c) => c.totalStock), 1)
            const pct = Math.min((cat.totalStock / max) * 100, 100)
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-gray-700 dark:text-neutral-200">
                  {cat.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${cat.isLow ? 'bg-red-500' : 'bg-[#4A6CF7]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  {cat.totalStock}
                </span>
                {cat.isLow && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500 dark:bg-red-500/10 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    Baixo
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StockByTypeCard({ types }: { types: StockByType[] }) {
  const sorted = [...types].sort((a, b) => {
    if (a.isLow !== b.isLow) return a.isLow ? -1 : 1
    return a.totalStock - b.totalStock
  })

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-neutral-300">
        Estoque por Tipo
      </h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400 dark:text-neutral-500">
        Unidades em estoque de produtos ativos, por tipo
      </p>

      {sorted.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300 dark:text-neutral-600">
          Sem tipos
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((type) => {
            const max = Math.max(...sorted.map((t) => t.totalStock), 1)
            const pct = Math.min((type.totalStock / max) * 100, 100)
            return (
              <div key={type.id} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-gray-700 dark:text-neutral-200">
                  {type.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${type.isLow ? 'bg-red-500' : 'bg-[#4A6CF7]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  {type.totalStock}
                </span>
                {type.isLow && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500 dark:bg-red-500/10 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    Baixo
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
