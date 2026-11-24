'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import logo from '@/../public/logo.png'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import { useProducts, useStockByCategory } from '@/features/products/hooks/useProducts'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  Plus,
  ShoppingBag,
  Clock,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react'

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

const PANEL = 'rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6'
const ROW = 'rounded-2xl bg-white/4'

/* ── AreaChart suave (receita por dia) ─────────────────── */
function AreaChart({ data }: { data: { day: number; revenue: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 300
  const H = 140
  const max = Math.max(...data.map((d) => d.revenue), 1)
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - 12 - (d.revenue / max) * (H - 36),
  }))
  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
  }, '')
  const area = `${line} L${W},${H} L0,${H} Z`
  const h = hover !== null ? pts[hover] : null

  return (
    <div className="relative pt-8">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-40 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1))
          setHover(Math.min(Math.max(i, 0), data.length - 1))
        }}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaFill)" />
        <path
          d={line}
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {h && (
          <line
            x1={h.x}
            x2={h.x}
            y1={0}
            y2={H}
            stroke="#fff"
            strokeOpacity="0.5"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-black px-3 py-1.5 text-center ring-1 ring-white/20"
          style={{ left: `${(h.x / W) * 100}%` }}
        >
          <p className="text-[10px] text-neutral-400">Dia {data[hover].day}</p>
          <p className="text-xs font-semibold text-white">{formatCurrency(data[hover].revenue)}</p>
        </div>
      )}
    </div>
  )
}

/* ── LineChart (pedidos semanais) ──────────────────────── */
function LineChart({ curData, prevData }: { curData: number[]; prevData: number[] }) {
  const W = 280
  const H = 70
  const maxVal = Math.max(...curData, ...prevData, 1)
  const toPoints = (arr: number[]) =>
    arr
      .map(
        (v, i) =>
          `${((i / Math.max(arr.length - 1, 1)) * W).toFixed(1)},${(H - (v / maxVal) * (H - 8)).toFixed(1)}`
      )
      .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={toPoints(prevData)}
        fill="none"
        stroke="#3A3A3A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polyline
        points={toPoints(curData)}
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrendPill({ value, up }: { value: number; up: boolean }) {
  return (
    <span
      className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-white text-black' : 'bg-white/10 text-neutral-300'}`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

/* ── page ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: productsData } = useProducts({ limit: 100 })
  const { data: ordersData } = useOrders({ limit: 1000 })
  const { data: stockByCategory = [] } = useStockByCategory()
  const [search, setSearch] = useState('')

  const orders = useMemo(() => ordersData?.data ?? [], [ordersData])
  const confirmedOrders = useMemo(() => orders.filter((o) => o.status === 'DELIVERED'), [orders])
  const products = useMemo(() => productsData?.data ?? [], [productsData])

  const investedValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.costPrice ?? 0) * p.stock, 0),
    [products]
  )
  const stockSaleValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.stock, 0),
    [products]
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

  const [selYear, selMonth] = selectedMonth.split('-').map(Number)

  // ── Revenue per day (selected month) ──────────────────
  const { curRevenueByDay, totalRevenue, prevTotalRevenue } = useMemo(() => {
    const daysInSel = new Date(selYear, selMonth + 1, 0).getDate()
    const prevMonth = selMonth === 0 ? 11 : selMonth - 1
    const prevYear = selMonth === 0 ? selYear - 1 : selYear

    const cur = Array.from({ length: daysInSel }, (_, i) => ({ day: i + 1, revenue: 0 }))
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
        prevTotalRevenue += o.total
      }
    })

    return { curRevenueByDay: cur, totalRevenue, prevTotalRevenue }
  }, [confirmedOrders, selYear, selMonth])

  const revenueTrend =
    prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : null

  // ── Top products (por quantidade vendida) ──────────────
  const topProducts = useMemo(() => {
    const counts = new Map<string, { count: number; name: string; productId: string | null }>()
    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productId ?? item.productName
        const e = counts.get(key) ?? { count: 0, name: item.productName, productId: item.productId }
        e.count += item.quantity
        counts.set(key, e)
      })
    })
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((tp) => {
        const product = products.find((p) => p.id === tp.productId)
        return { ...tp, image: product?.images[0] ?? null, price: product?.price ?? 0 }
      })
  }, [confirmedOrders, products])

  // fallback: se não há pedidos, mostrar os primeiros produtos
  const displayTopProducts = useMemo(() => {
    if (topProducts.length > 0) return topProducts
    return products.slice(0, 4).map((p) => ({
      productId: p.id,
      name: p.name,
      count: 0,
      image: p.images[0] ?? null,
      price: p.price,
    }))
  }, [topProducts, products])

  // ── Weekly orders (last 7 days vs prev 7 days) ─────────
  const todayStr = now.toDateString()
  const { weekCur, weekPrev, weekTotalCur, weekTotalPrev, weekLabel } = useMemo(() => {
    const today = new Date(todayStr)
    const cur: number[] = []
    const prev: number[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today)
      day.setDate(today.getDate() - i)
      const dayStr = day.toISOString().slice(0, 10)
      const prevDay = new Date(day)
      prevDay.setDate(day.getDate() - 7)
      const prevDayStr = prevDay.toISOString().slice(0, 10)
      cur.push(confirmedOrders.filter((o) => o.createdAt.slice(0, 10) === dayStr).length)
      prev.push(confirmedOrders.filter((o) => o.createdAt.slice(0, 10) === prevDayStr).length)
    }
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return {
      weekCur: cur,
      weekPrev: prev,
      weekTotalCur: cur.reduce((s, v) => s + v, 0),
      weekTotalPrev: prev.reduce((s, v) => s + v, 0),
      weekLabel: `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`,
    }
  }, [confirmedOrders, todayStr])

  const weekTrend =
    weekTotalPrev > 0 ? ((weekTotalCur - weekTotalPrev) / weekTotalPrev) * 100 : null
  const weekTrendUp = weekTrend === null || weekTrend >= 0

  function monthKeyToLabel(key: string) {
    const [y, m] = key.split('-').map(Number)
    return `${MONTH_NAMES[m]} ${y}`
  }

  // ── Derived for new layout ─────────────────────────────
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Admin'
  const pendingOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PROCESSING'
  ).length
  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products])
  const lowCategories = stockByCategory.filter((c) => c.isLow).length

  const tableProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...activeProducts]
      .filter(
        (p) => !q || p.name.toLowerCase().includes(q) || p.category.name.toLowerCase().includes(q)
      )
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
  }, [activeProducts, search])

  const stats = [
    { label: 'Pedidos confirmados', value: confirmedOrders.length, icon: ShoppingBag },
    { label: 'Pedidos pendentes', value: pendingOrders, icon: Clock },
    { label: 'Produtos ativos', value: activeProducts.length, icon: Package },
    { label: 'Categorias com estoque baixo', value: lowCategories, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-5">
      {/* top bar */}
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <Image src={logo} alt="Brothers Outlet" className="h-8 w-auto shrink-0" priority />
        <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-[#141414] px-4 ring-1 ring-white/6">
          <Search className="h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto ou categoria"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
          />
        </div>
        <Link
          href="/admin/products"
          className="hidden h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90 sm:flex"
        >
          <Plus className="h-4 w-4" /> Novo Produto
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_20rem]">
        {/* ── main column ─────────────────────────────── */}
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Olá, {firstName}</h1>
            <p className="mt-1 text-sm text-neutral-500">Veja como está a loja hoje</p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              {stats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col justify-between rounded-3xl bg-[#141414] p-4 ring-1 ring-white/6"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-neutral-400" />
                    <MoreHorizontal className="h-4 w-4 text-neutral-700" />
                  </div>
                  <p className="mt-6 text-xs leading-tight text-neutral-500">{label}</p>
                  <p className="text-4xl font-semibold tracking-tight text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Receita */}
            <div className={`${PANEL} lg:col-span-3`}>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-400">Receita mensal</h2>
                <div className="relative">
                  <button
                    onClick={() => setMonthPickerOpen((o) => !o)}
                    className="flex items-center gap-1 rounded-full border border-white/12 px-3 py-1 text-xs text-neutral-300 hover:bg-white/8"
                  >
                    {monthKeyToLabel(selectedMonth)}
                    <ChevronDown className="h-3 w-3 text-neutral-500" />
                  </button>
                  {monthPickerOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMonthPickerOpen(false)}
                      />
                      <div className="absolute right-0 z-20 mt-1 min-w-32 overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-lg ring-1 ring-white/10">
                        {availableMonths.map((key) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedMonth(key)
                              setMonthPickerOpen(false)
                            }}
                            className={`block w-full px-4 py-2 text-left text-xs hover:bg-white/8 ${selectedMonth === key ? 'font-semibold text-white' : 'text-neutral-400'}`}
                          >
                            {monthKeyToLabel(key)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-semibold tracking-tight text-white">
                  {formatCurrency(totalRevenue)}
                </p>
                {revenueTrend !== null && <TrendPill value={revenueTrend} up={revenueTrend >= 0} />}
              </div>
              <AreaChart data={curRevenueByDay} />
              <div className="mt-2 flex justify-between text-[10px] text-neutral-600">
                <span>Dia 1</span>
                <span>Dia {curRevenueByDay.length}</span>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className={PANEL}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-400">Menor estoque primeiro</h2>
              <Link href="/admin/products" className="text-xs text-neutral-400 hover:text-white">
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-[1fr_5rem_4rem_5rem] gap-3 px-3 pb-2 text-[11px] tracking-wide text-neutral-600 uppercase sm:grid-cols-[1fr_8rem_5rem_4rem_5rem]">
              <span>Produto</span>
              <span className="hidden sm:block">Categoria</span>
              <span>Preço</span>
              <span>Estoque</span>
              <span />
            </div>
            <div className="space-y-2">
              {tableProducts.length === 0 && (
                <p className="py-8 text-center text-sm text-neutral-600">
                  Nenhum produto encontrado
                </p>
              )}
              {tableProducts.map((p) => {
                const low = p.stock <= 5
                return (
                  <div
                    key={p.id}
                    className={`${ROW} grid grid-cols-[1fr_5rem_4rem_5rem] items-center gap-3 px-3 py-2.5 sm:grid-cols-[1fr_8rem_5rem_4rem_5rem]`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
                        {p.images[0] && (
                          <Image
                            src={p.images[0]}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="truncate text-sm font-medium text-white">{p.name}</span>
                    </div>
                    <span className="hidden truncate text-xs text-neutral-400 sm:block">
                      {p.category.name}
                    </span>
                    <span className="text-xs text-neutral-300">{formatCurrency(p.price)}</span>
                    <span
                      className={`text-xs font-semibold ${low ? 'text-red-400' : 'text-neutral-200'}`}
                    >
                      {p.stock}
                    </span>
                    <Link
                      href="/admin/products"
                      className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold ${low ? 'bg-white text-black' : 'bg-white/10 text-neutral-300'}`}
                    >
                      {low ? 'Repor' : 'Ver'}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── right column ────────────────────────────── */}
        <aside className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
          <div className="rounded-3xl bg-white p-5 text-black">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-600">Total de Vendas</h2>
              <ArrowUpRight className="h-4 w-4 text-neutral-400" />
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight">
              {formatCurrency(totalSales)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {confirmedOrders.length} pedido{confirmedOrders.length !== 1 ? 's' : ''} confirmado
              {confirmedOrders.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/10 pt-3">
              <div>
                <p className="text-[11px] text-neutral-500">Valor investido</p>
                <p className="text-sm font-semibold">{formatCurrency(investedValue)}</p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Valor de venda</p>
                <p className="text-sm font-semibold">{formatCurrency(stockSaleValue)}</p>
              </div>
            </div>
          </div>

          <div className={PANEL}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-400">Pedidos · 7 dias</h2>
              {weekTrend !== null && <TrendPill value={weekTrend} up={weekTrendUp} />}
            </div>
            <p className="text-3xl font-semibold tracking-tight text-white">{weekTotalCur}</p>
            <p className="mb-3 text-xs text-neutral-500">{weekLabel}</p>
            <LineChart curData={weekCur} prevData={weekPrev} />
          </div>

          <div className={PANEL}>
            <h2 className="mb-3 text-sm font-medium text-neutral-400">Mais vendidos</h2>
            <div className="space-y-2">
              {displayTopProducts.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-600">Sem vendas ainda</p>
              )}
              {displayTopProducts.map((p) => (
                <div key={p.productId ?? p.name} className={`${ROW} flex items-center gap-3 p-2.5`}>
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
                    {p.image && (
                      <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">{p.name}</p>
                    <p className="text-[11px] text-neutral-500">
                      {p.count > 0
                        ? `${p.count} vendido${p.count !== 1 ? 's' : ''}`
                        : formatCurrency(p.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <h2 className="mb-3 text-sm font-medium text-neutral-400">Estoque por categoria</h2>
            <div className="space-y-2">
              {[...stockByCategory]
                .sort((a, b) => Number(b.isLow) - Number(a.isLow) || a.totalStock - b.totalStock)
                .slice(0, 5)
                .map((c) => (
                  <div key={c.id} className={`${ROW} flex items-center gap-3 p-2.5`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{c.name}</p>
                      <p className="text-[11px] text-neutral-500">{c.totalStock} unidades</p>
                    </div>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${c.isLow ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-white'}`}
                    >
                      {c.isLow ? (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </div>
                ))}
              {stockByCategory.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-600">Sem categorias</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
