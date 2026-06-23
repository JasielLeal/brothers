'use client'

import { useState, useRef, useEffect } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  X,
  FileText,
  Check,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import {
  useBoletos,
  useCreateBoleto,
  useUpdateBoletoStatus,
} from '@/features/boletos/hooks/useBoletos'
import type { Boleto, BoletoStatus, BoletoInput } from '@/features/boletos/types/boleto.types'

const STATUS_META: Record<
  BoletoStatus,
  { label: string; bg: string; text: string; Icon: React.ElementType }
> = {
  PENDING: { label: 'Pendente', bg: 'bg-yellow-50', text: 'text-yellow-700', Icon: Clock },
  PAID: { label: 'Pago', bg: 'bg-green-50', text: 'text-green-700', Icon: CheckCircle2 },
  OVERDUE: { label: 'Vencido', bg: 'bg-red-50', text: 'text-red-700', Icon: AlertCircle },
  CANCELLED: { label: 'Cancelado', bg: 'bg-gray-100', text: 'text-gray-500', Icon: XCircle },
}

const FILTER_TABS: { key: BoletoStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'OVERDUE', label: 'Vencidos' },
  { key: 'PAID', label: 'Pagos' },
  { key: 'CANCELLED', label: 'Cancelados' },
]

const EMPTY_FORM = { supplierName: '', description: '', amount: '', dueDate: '' }

// ── StatsCarousel ────────────────────────────────────────────────────────────
function StatsCarousel({
  stats,
}: {
  stats: { label: string; value: string | number; accent: string }[]
}) {
  const items = [stats[stats.length - 1], ...stats, stats[0]]
  const [idx, setIdx] = useState(1)
  const [transitioning, setTransitioning] = useState(true)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    if (!transitioning) return
    if (idx === 0) {
      const t = setTimeout(() => {
        setTransitioning(false)
        setIdx(stats.length)
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
  }, [idx, transitioning, items.length, stats.length])

  useEffect(() => {
    if (!transitioning) {
      const t = requestAnimationFrame(() => setTransitioning(true))
      return () => cancelAnimationFrame(t)
    }
  }, [transitioning])

  const realIdx = idx === 0 ? stats.length - 1 : idx === items.length - 1 ? 0 : idx - 1

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
          {items.map((s, i) => (
            <div key={i} className="w-full shrink-0">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
                <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {stats.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setTransitioning(true)
              setIdx(i + 1)
            }}
            className={`h-1.5 rounded-full transition-all ${i === realIdx ? 'w-4 bg-[#4A6CF7]' : 'w-1.5 bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  )
}

function generateCode() {
  const n = () => Math.floor(Math.random() * 90000 + 10000)
  return `34191.${n()} ${n()}.${n()} ${n()}.${n()} 1 ${String(Math.floor(Math.random() * 99999999999999)).padStart(14, '0')}`
}

export default function AdminInvoicesPage() {
  const [tab, setTab] = useState<BoletoStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [copied, setCopied] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [detail, setDetail] = useState<Boleto | null>(null)

  const { data, isLoading } = useBoletos({
    search,
    status: tab === 'all' ? undefined : tab,
    page,
    limit: 5,
  })

  const createBoleto = useCreateBoleto()
  const updateStatus = useUpdateBoletoStatus()

  const boletos = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }
  function handleTab(t: BoletoStatus | 'all') {
    setTab(t)
    setPage(1)
  }

  const pendingTotal = boletos
    .filter((b) => b.status === 'PENDING')
    .reduce((s, b) => s + b.amount, 0)
  const overdueTotal = boletos
    .filter((b) => b.status === 'OVERDUE')
    .reduce((s, b) => s + b.amount, 0)
  const paidTotal = boletos.filter((b) => b.status === 'PAID').reduce((s, b) => s + b.amount, 0)
  const overdueCount = boletos.filter((b) => b.status === 'OVERDUE').length

  const stats = [
    { label: 'A Pagar', value: formatCurrency(pendingTotal), accent: '#F59E0B' },
    { label: 'Vencidos', value: formatCurrency(overdueTotal), accent: '#EF4444' },
    { label: 'Pagos (mês)', value: formatCurrency(paidTotal), accent: '#22C55E' },
    { label: 'Qtd. Vencidos', value: overdueCount, accent: '#EF4444' },
  ]

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  async function markPaid(id: string) {
    const result = await updateStatus.mutateAsync({
      id,
      status: 'PAID',
      paidAt: new Date().toISOString(),
    })
    setDetail((d) => (d?.id === id ? result : d))
  }

  async function cancelBoleto(id: string) {
    const result = await updateStatus.mutateAsync({ id, status: 'CANCELLED' })
    setDetail((d) => (d?.id === id ? result : d))
  }

  async function handleCreate() {
    if (!form.supplierName.trim() || !form.amount || !form.dueDate) return
    const input: BoletoInput = {
      code: generateCode(),
      supplierName: form.supplierName,
      description: form.description,
      amount: parseFloat(form.amount.replace(',', '.')),
      dueDate: new Date(form.dueDate).toISOString(),
    }
    await createBoleto.mutateAsync(input)
    setDrawerOpen(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="space-y-5">
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <h1 className="text-xl font-bold text-gray-800">Boletos</h1>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5]"
        >
          <Plus className="h-4 w-4" />
          Novo boleto
        </button>
      </div>

      {/* ── stats ──────────────────────────────────────────────────────────── */}
      <StatsCarousel stats={stats} />
      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
            <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── filter tabs + search ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid w-full grid-cols-3 gap-2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-100 sm:flex sm:w-auto sm:gap-1">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === key ? 'bg-[#4A6CF7] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-52">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar fornecedor ou descrição..."
            className="w-full rounded-xl border-0 bg-white py-2.5 pr-4 pl-9 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/30 focus:outline-none"
          />
        </div>
      </div>

      {/* ── table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : boletos.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Nenhum boleto encontrado.</div>
        ) : (
          <>
            {/* mobile card list */}
            <div className="divide-y divide-gray-50 lg:hidden">
              {boletos.map((b) => {
                const meta = STATUS_META[b.status]
                const StatusIcon = meta.Icon
                return (
                  <div key={b.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4A6CF7]/8">
                      <FileText className="h-4 w-4 text-[#4A6CF7]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {b.supplierName}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.text}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{b.description}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(b.amount)}
                        </span>
                        <span className="text-xs text-gray-400">Vence {formatDate(b.dueDate)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1">
                          <span className="truncate font-mono text-[11px] text-gray-400">
                            {b.code.slice(0, 24)}…
                          </span>
                          <button
                            onClick={() => handleCopy(b.code)}
                            className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            {copied === b.code ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => setDetail(b)}
                          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#4A6CF7] hover:bg-[#4A6CF7]/8"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Código', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {boletos.map((b) => {
                    const meta = STATUS_META[b.status]
                    const StatusIcon = meta.Icon
                    return (
                      <tr key={b.id} className="transition-colors hover:bg-gray-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4A6CF7]/8">
                              <FileText className="h-4 w-4 text-[#4A6CF7]" />
                            </div>
                            <span className="max-w-40 truncate font-medium text-gray-800">
                              {b.supplierName}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-52 truncate px-5 py-3.5 text-gray-600">
                          {b.description}
                        </td>
                        <td className="px-5 py-3.5 font-semibold whitespace-nowrap text-gray-800">
                          {formatCurrency(b.amount)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                          {formatDate(b.dueDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="max-w-32 truncate font-mono text-xs text-gray-400">
                              {b.code}
                            </span>
                            <button
                              onClick={() => handleCopy(b.code)}
                              className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title="Copiar código"
                            >
                              {copied === b.code ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setDetail(b)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#4A6CF7] transition-colors hover:bg-[#4A6CF7]/8"
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Exibindo{' '}
            <span className="font-semibold text-gray-700">
              {(page - 1) * 5 + 1}–{Math.min(page * 5, total)}
            </span>{' '}
            de <span className="font-semibold text-gray-700">{total}</span> boletos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:shadow-sm disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-[#4A6CF7] text-white shadow-sm' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:shadow-sm disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── detail modal ────────────────────────────────────────────────────── */}
      {detail &&
        (() => {
          const meta = STATUS_META[detail.status]
          const StatusIcon = meta.Icon
          return (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                onClick={() => setDetail(null)}
              />
              <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="text-base font-bold text-gray-800">Detalhes do Boleto</h2>
                  <button
                    onClick={() => setDetail(null)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${meta.bg} ${meta.text}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Fornecedor</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800">
                        {detail.supplierName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Valor</p>
                      <p className="mt-0.5 text-xl font-bold text-gray-900">
                        {formatCurrency(detail.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Vencimento</p>
                      <p className="mt-0.5 text-sm text-gray-700">{formatDate(detail.dueDate)}</p>
                    </div>
                    {detail.paidAt && (
                      <div>
                        <p className="text-xs text-gray-400">Pago em</p>
                        <p className="mt-0.5 text-sm text-gray-700">{formatDate(detail.paidAt)}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Descrição</p>
                      <p className="mt-0.5 text-sm text-gray-700">{detail.description}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-mono text-xs break-all text-gray-600">{detail.code}</p>
                      <button
                        onClick={() => handleCopy(detail.code)}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:shadow-sm"
                      >
                        {copied === detail.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {(detail.status === 'PENDING' || detail.status === 'OVERDUE') && (
                  <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                    <button
                      onClick={() => cancelBoleto(detail.id)}
                      disabled={updateStatus.isPending}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      Cancelar boleto
                    </button>
                    <button
                      onClick={() => markPaid(detail.id)}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-green-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-40"
                    >
                      {updateStatus.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Marcar como pago
                    </button>
                  </div>
                )}
              </div>
            </>
          )
        })()}

      {/* ── create drawer ────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-800">Novo Boleto</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Fornecedor *
                </span>
                <input
                  value={form.supplierName}
                  onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))}
                  placeholder="Nome do fornecedor"
                  className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Descrição
                </span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Pedido #1234 — camisetas"
                  className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Valor (R$) *
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Vencimento *
                  </span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !form.supplierName.trim() ||
                  !form.amount ||
                  !form.dueDate ||
                  createBoleto.isPending
                }
                className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5] disabled:opacity-40"
              >
                {createBoleto.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Gerar boleto
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
