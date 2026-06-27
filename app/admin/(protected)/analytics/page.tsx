'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useProducts } from '@/features/products/hooks/useProducts'
import { formatCurrency } from '@/utils/formatCurrency'
import { TrendingUp, TrendingDown } from 'lucide-react'

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
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/* ── SVG helpers ───────────────────────────────────────── */
function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCart(cx, cy, r, start)
  const e = polarToCart(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

/* ── charts ────────────────────────────────────────────── */
function MonthlyBarChart({
  data,
  prev,
  selectedMonth,
}: {
  data: number[]
  prev: number[]
  selectedMonth: number | null
}) {
  const maxVal = Math.max(...data, ...prev, 1)
  const H = 120
  const barW = 8
  const gap = 3
  const groupW = barW * 2 + gap + 16
  const totalW = 12 * groupW
  return (
    <svg viewBox={`0 0 ${totalW} ${H + 20}`} className="w-full" preserveAspectRatio="none">
      {data.map((v, i) => {
        const x = i * groupW + 2
        const curH = (v / maxVal) * H
        const prevH = (prev[i] / maxVal) * H
        return (
          <g key={i}>
            <rect x={x} y={H - prevH} width={barW} height={prevH} rx="3" fill="#E2E8F0" />
            <rect
              x={x + barW + gap}
              y={H - curH}
              width={barW}
              height={curH}
              rx="3"
              fill={selectedMonth === i ? '#2E4FD4' : '#4A6CF7'}
            />
            <text
              x={x + barW + gap / 2}
              y={H + 14}
              textAnchor="middle"
              fontSize="7.5"
              fill="#94A3B8"
            >
              {MONTH_NAMES[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function WeekdayBarChart({
  data,
  prev,
  labels,
}: {
  data: number[]
  prev: number[]
  labels: string[]
}) {
  const maxVal = Math.max(...data, ...prev, 1)
  const H = 90
  const barW = 10
  const gap = 3
  const groupW = barW * 2 + gap + 14
  const totalW = 7 * groupW
  return (
    <svg viewBox={`0 0 ${totalW} ${H + 18}`} className="w-full" preserveAspectRatio="none">
      {data.map((v, i) => {
        const x = i * groupW + 2
        const curH = (v / maxVal) * H
        const prevH = (prev[i] / maxVal) * H
        return (
          <g key={i}>
            <rect x={x} y={H - prevH} width={barW} height={prevH} rx="3" fill="#E2E8F0" />
            <rect
              x={x + barW + gap}
              y={H - curH}
              width={barW}
              height={curH}
              rx="3"
              fill="#4A6CF7"
            />
            <text x={x + barW + gap / 2} y={H + 13} textAnchor="middle" fontSize="8" fill="#94A3B8">
              {labels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

type DonutSeg = { label: string; sublabel: string; count: number; pct: number; color: string }

function HourDonut({ segments }: { segments: DonutSeg[] }) {
  const cx = 65
  const cy = 65
  const r = 46
  const GAP = 4
  const arcs = segments.reduce<Array<DonutSeg & { startDeg: number; endDeg: number }>>(
    (acc, seg) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].endDeg + GAP / 2 : 0
      const deg = (seg.pct / 100) * 360
      return [...acc, { ...seg, startDeg: prev, endDeg: prev + deg - GAP }]
    },
    []
  )
  const biggest = segments.reduce((a, b) => (a.count > b.count ? a : b), segments[0])
  return (
    <div className="relative flex justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEF0FF" strokeWidth="22" />
        {arcs.map((seg, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, r, seg.startDeg, seg.endDeg)}
            fill="none"
            stroke={seg.color}
            strokeWidth="22"
            strokeLinecap="round"
          />
        ))}
        <circle cx={cx} cy={cy} r={30} fill="white" />
      </svg>
      {biggest && biggest.count > 0 && (
        <div className="pointer-events-none absolute -top-2 left-[54%] rounded-xl bg-gray-800 px-3 py-2 text-white shadow-xl">
          <p className="text-[10px] font-semibold opacity-80">{biggest.label}</p>
          <p className="text-[10px] opacity-60">{biggest.sublabel}</p>
          <p className="text-sm font-bold">
            {biggest.count} pedido{biggest.count !== 1 ? 's' : ''}
          </p>
          <div className="absolute top-3.5 -left-1.5 h-3 w-3 rotate-45 bg-gray-800" />
        </div>
      )}
    </div>
  )
}

/* ── shared ────────────────────────────────────────────── */
function Trend({ up, value, label }: { up: boolean; value: string; label: string }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span
        className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
      >
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {value}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

type KpiItem = {
  label: string
  value: string
  trend: string | null
  up: boolean
  sub: string
  accent: string
}

function KpiCarousel({ kpis }: { kpis: KpiItem[] }) {
  const n = kpis.length
  const extended = [kpis[n - 1], ...kpis, kpis[0]]
  const [idx, setIdx] = useState(1)
  const [animated, setAnimated] = useState(true)
  const touchX = useRef(0)
  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => setAnimated(true), 20)
      return () => clearTimeout(t)
    }
  }, [animated])
  useEffect(() => {
    if (idx === 0) {
      const t = setTimeout(() => {
        setAnimated(false)
        setIdx(n)
      }, 350)
      return () => clearTimeout(t)
    }
    if (idx === n + 1) {
      const t = setTimeout(() => {
        setAnimated(false)
        setIdx(1)
      }, 350)
      return () => clearTimeout(t)
    }
  }, [idx, n])
  const dot = idx === 0 ? n - 1 : idx === n + 1 ? 0 : idx - 1
  return (
    <div
      className="overflow-hidden"
      onTouchStart={(e) => {
        touchX.current = e.targetTouches[0].clientX
      }}
      onTouchEnd={(e) => {
        const diff = touchX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 40) setIdx((i) => i + (diff > 0 ? 1 : -1))
      }}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${idx * 100}%))`,
          transition: animated ? 'transform 0.35s ease' : 'none',
        }}
      >
        {extended.map((k, i) => (
          <div key={i} className="w-full shrink-0 px-0.5">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{k.value}</p>
              {k.trend ? (
                <Trend up={k.up} value={k.trend} label={k.sub} />
              ) : (
                <p className="mt-1.5 text-xs text-gray-300">—</p>
              )}
              <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: k.accent }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {kpis.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setAnimated(true)
              setIdx(i + 1)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${dot === i ? 'w-4 bg-[#4A6CF7]' : 'w-1.5 bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  )
}

function SlideCarousel({ children }: { children: React.ReactNode[] }) {
  const n = children.length
  const extended = [children[n - 1], ...children, children[0]]
  const [idx, setIdx] = useState(1)
  const [animated, setAnimated] = useState(true)
  const touchX = useRef(0)
  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => setAnimated(true), 20)
      return () => clearTimeout(t)
    }
  }, [animated])
  useEffect(() => {
    if (idx === 0) {
      const t = setTimeout(() => {
        setAnimated(false)
        setIdx(n)
      }, 350)
      return () => clearTimeout(t)
    }
    if (idx === n + 1) {
      const t = setTimeout(() => {
        setAnimated(false)
        setIdx(1)
      }, 350)
      return () => clearTimeout(t)
    }
  }, [idx, n])
  const dot = idx === 0 ? n - 1 : idx === n + 1 ? 0 : idx - 1
  return (
    <div
      className="overflow-hidden"
      onTouchStart={(e) => {
        touchX.current = e.targetTouches[0].clientX
      }}
      onTouchEnd={(e) => {
        const diff = touchX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 40) setIdx((i) => i + (diff > 0 ? 1 : -1))
      }}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${idx * 100}%))`,
          transition: animated ? 'transform 0.35s ease' : 'none',
        }}
      >
        {extended.map((child, i) => (
          <div key={i} className="w-full shrink-0">
            {child}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: n }, (_, i) => (
          <button
            key={i}
            onClick={() => {
              setAnimated(true)
              setIdx(i + 1)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${dot === i ? 'w-4 bg-[#4A6CF7]' : 'w-1.5 bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  )
}

/* ── page ──────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { data: ordersData } = useOrders({ limit: 1000 })
  const { data: productsData } = useProducts({ limit: 100 })
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const allOrders = ordersData?.data ?? []
  const confirmedOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'DELIVERED'),
    [allOrders]
  )

  // ── KPIs ───────────────────────────────────────────────
  const { totalRevenue, totalOrders, avgTicket, cancelRate, kpiTrends } = useMemo(() => {
    const totalRevenue = confirmedOrders.reduce((s, o) => s + o.total, 0)
    const totalOrders = confirmedOrders.length
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const cancelRate =
      allOrders.length > 0
        ? (allOrders.filter((o) => o.status === 'CANCELLED').length / allOrders.length) * 100
        : 0

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const curMo = confirmedOrders.filter((o) => {
      const d = new Date(o.createdAt)
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })
    const prevMo = confirmedOrders.filter((o) => {
      const d = new Date(o.createdAt)
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth
    })
    const curRev = curMo.reduce((s, o) => s + o.total, 0)
    const prevRev = prevMo.reduce((s, o) => s + o.total, 0)
    const curAvg = curMo.length > 0 ? curRev / curMo.length : 0
    const prevAvg = prevMo.length > 0 ? prevRev / prevMo.length : 0
    const pct = (cur: number, prev: number) =>
      prev > 0 ? `${cur >= prev ? '+' : ''}${(((cur - prev) / prev) * 100).toFixed(1)}%` : null
    return {
      totalRevenue,
      totalOrders,
      avgTicket,
      cancelRate,
      kpiTrends: {
        rev: pct(curRev, prevRev),
        revUp: curRev >= prevRev,
        orders: pct(curMo.length, prevMo.length),
        ordersUp: curMo.length >= prevMo.length,
        ticket: pct(curAvg, prevAvg),
        ticketUp: curAvg >= prevAvg,
      },
    }
  }, [confirmedOrders, allOrders, currentMonth, currentYear])

  // ── Monthly revenue ─────────────────────────────────────
  const { monthlyRev, monthlyPrev } = useMemo(() => {
    const rev = Array(12).fill(0)
    const prev = Array(12).fill(0)
    confirmedOrders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (d.getFullYear() === currentYear) rev[d.getMonth()] += o.total
      else if (d.getFullYear() === currentYear - 1) prev[d.getMonth()] += o.total
    })
    return { monthlyRev: rev, monthlyPrev: prev }
  }, [confirmedOrders, currentYear])

  // ── Hour donut ──────────────────────────────────────────
  const hourSegments = useMemo((): DonutSeg[] => {
    const buckets = { madrugada: 0, manha: 0, tarde: 0, noite: 0 }
    confirmedOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours()
      if (h >= 0 && h < 6) buckets.madrugada++
      else if (h >= 6 && h < 12) buckets.manha++
      else if (h >= 12 && h < 18) buckets.tarde++
      else buckets.noite++
    })
    const total = Math.max(1, confirmedOrders.length)
    return [
      {
        label: 'Tarde',
        sublabel: '12h–18h',
        count: buckets.tarde,
        pct: Math.round((buckets.tarde / total) * 100),
        color: '#4A6CF7',
      },
      {
        label: 'Noite',
        sublabel: '18h–00h',
        count: buckets.noite,
        pct: Math.round((buckets.noite / total) * 100),
        color: '#8AA4F9',
      },
      {
        label: 'Manhã',
        sublabel: '06h–12h',
        count: buckets.manha,
        pct: Math.round((buckets.manha / total) * 100),
        color: '#D0DAFE',
      },
      {
        label: 'Madrugada',
        sublabel: '00h–06h',
        count: buckets.madrugada,
        pct: Math.round((buckets.madrugada / total) * 100),
        color: '#EEF0FF',
      },
    ]
  }, [confirmedOrders])

  // ── Weekday ─────────────────────────────────────────────
  const { weekCur, weekPrev, weekLabels } = useMemo(() => {
    const cur: number[] = []
    const prev: number[] = []
    const labels: string[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const prevDay = new Date(day)
      prevDay.setDate(day.getDate() - 7)
      cur.push(
        confirmedOrders.filter((o) => o.createdAt.slice(0, 10) === day.toISOString().slice(0, 10))
          .length
      )
      prev.push(
        confirmedOrders.filter(
          (o) => o.createdAt.slice(0, 10) === prevDay.toISOString().slice(0, 10)
        ).length
      )
      labels.push(WEEKDAYS[day.getDay()])
    }
    return { weekCur: cur, weekPrev: prev, weekLabels: labels }
  }, [confirmedOrders, now])

  // ── Top products ────────────────────────────────────────
  const topProductsRev = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>()
    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productId ?? item.productName
        const e = map.get(key) ?? { name: item.productName, revenue: 0 }
        e.revenue += item.price * item.quantity
        map.set(key, e)
      })
    })
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [confirmedOrders])

  // ── Payment methods ─────────────────────────────────────
  const paymentStats = useMemo(() => {
    const map: Record<string, number> = { PIX: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, CASH: 0 }
    confirmedOrders.forEach((o) => {
      map[o.paymentMethod] = (map[o.paymentMethod] ?? 0) + 1
    })
    const total = Math.max(1, confirmedOrders.length)
    const labels: Record<string, string> = {
      PIX: 'PIX',
      CREDIT_CARD: 'Crédito',
      DEBIT_CARD: 'Débito',
      CASH: 'Dinheiro',
    }
    const colors: Record<string, string> = {
      PIX: '#4A6CF7',
      CREDIT_CARD: '#22C55E',
      DEBIT_CARD: '#F5A623',
      CASH: '#8AA4F9',
    }
    return Object.entries(map)
      .map(([key, count]) => ({
        key,
        label: labels[key],
        count,
        pct: Math.round((count / total) * 100),
        color: colors[key],
      }))
      .sort((a, b) => b.count - a.count)
  }, [confirmedOrders])

  const kpis: KpiItem[] = [
    {
      label: 'Receita Total',
      value: formatCurrency(totalRevenue),
      trend: kpiTrends.rev,
      up: kpiTrends.revUp,
      sub: 'vs mês anterior',
      accent: '#4A6CF7',
    },
    {
      label: 'Pedidos Confirmados',
      value: totalOrders.toLocaleString('pt-BR'),
      trend: kpiTrends.orders,
      up: kpiTrends.ordersUp,
      sub: 'vs mês anterior',
      accent: '#22C55E',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(avgTicket),
      trend: kpiTrends.ticket,
      up: kpiTrends.ticketUp,
      sub: 'vs mês anterior',
      accent: '#F5A623',
    },
    {
      label: 'Taxa Cancelamento',
      value: `${cancelRate.toFixed(1)}%`,
      trend: null,
      up: false,
      sub: 'do total de pedidos',
      accent: '#EF4444',
    },
  ]

  const monthLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`

  /* ── sub-cards ── */
  const weekdayCard = (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-sm font-semibold text-gray-600">Pedidos por Dia</h2>
      <p className="mt-0.5 mb-4 text-xs text-gray-400">Últimos 7 dias vs semana anterior</p>
      <WeekdayBarChart data={weekCur} prev={weekPrev} labels={weekLabels} />
      <div className="mt-3 flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4A6CF7]" /> Esta semana
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-200" /> Semana passada
        </span>
      </div>
    </div>
  )

  const topProductsCard = (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-sm font-semibold text-gray-600">Top Produtos</h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400">Por receita gerada</p>
      {topProductsRev.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300">
          Sem vendas ainda
        </div>
      ) : (
        <div className="space-y-3">
          {topProductsRev.map((p, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-4 text-[10px] font-bold text-gray-300">#{i + 1}</span>
                  <span className="max-w-32.5 truncate font-medium text-gray-700">{p.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-gray-700">
                  {formatCurrency(p.revenue)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-[#4A6CF7]"
                  style={{ width: `${(p.revenue / topProductsRev[0].revenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const paymentCard = (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-sm font-semibold text-gray-600">Formas de Pagamento</h2>
      <p className="mt-0.5 mb-5 text-xs text-gray-400">Pedidos confirmados</p>
      {confirmedOrders.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-300">Sem dados</div>
      ) : (
        <div className="space-y-3">
          {paymentStats.map((p) => (
            <div key={p.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-medium text-gray-700">{p.label}</span>
                </span>
                <span className="text-gray-400">
                  {p.count} pedido{p.count !== 1 ? 's' : ''} ·{' '}
                  <span className="font-semibold text-gray-700">{p.pct}%</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center">
        <MobileMenuButton />
        <h1 className="text-xl font-bold text-gray-800">Analytics</h1>
      </div>

      {/* KPIs mobile */}
      <div className="lg:hidden">
        <KpiCarousel kpis={kpis} />
      </div>
      {/* KPIs desktop */}
      <div className="hidden grid-cols-2 gap-5 lg:grid xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{k.value}</p>
            {k.trend ? (
              <Trend up={k.up} value={k.trend} label={k.sub} />
            ) : (
              <p className="mt-1.5 text-xs text-gray-400">{k.sub}</p>
            )}
            <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: k.accent }} />
          </div>
        ))}
      </div>

      {/* Receita mensal + Horário de Compras */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Receita */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 xl:col-span-3">
          <h2 className="mb-1 text-sm font-semibold text-gray-600">Receita Mensal</h2>
          <p className="mb-4 text-xs text-gray-400">Jan – {monthLabel}</p>
          <MonthlyBarChart data={monthlyRev} prev={monthlyPrev} selectedMonth={selectedMonth} />
          <div className="mt-4 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4A6CF7]" /> {currentYear}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-200" /> {currentYear - 1}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {MONTH_NAMES.map((m, i) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(selectedMonth === i ? null : i)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${selectedMonth === i ? 'bg-[#4A6CF7] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {m}
                {selectedMonth === i && (
                  <span className="ml-1 font-semibold">{formatCurrency(monthlyRev[i])}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Horário de Compras */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 xl:col-span-2">
          <h2 className="text-sm font-semibold text-gray-600">Horário de Compras</h2>
          <p className="mt-0.5 mb-5 text-xs text-gray-400">
            {confirmedOrders.length > 0
              ? `Baseado em ${confirmedOrders.length} pedidos confirmados`
              : 'Sem dados ainda'}
          </p>
          {confirmedOrders.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-300">
              Sem dados
            </div>
          ) : (
            <>
              <HourDonut segments={hourSegments} />
              <div className="mt-5 space-y-2.5">
                {hourSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-medium text-gray-700">{seg.label}</span>
                      <span className="text-gray-400">{seg.sublabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{seg.count} ped.</span>
                      <span className="w-8 text-right font-bold text-gray-800">{seg.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom 3 — mobile carousel */}
      <div className="lg:hidden">
        <SlideCarousel>{[weekdayCard, topProductsCard, paymentCard]}</SlideCarousel>
      </div>
      {/* Bottom 3 — desktop grid */}
      <div className="hidden grid-cols-3 gap-5 lg:grid">
        {weekdayCard}
        {topProductsCard}
        {paymentCard}
      </div>

      <p className="text-xs text-gray-400">
        {productsData?.total ?? 0} produtos · {confirmedOrders.length} pedidos confirmados ·
        Atualizado em {now.toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
