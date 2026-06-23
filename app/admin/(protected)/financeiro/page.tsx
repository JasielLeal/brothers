'use client'

import { useState, useMemo } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { useProducts } from '@/features/products/hooks/useProducts'
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
} from '@/features/financeiro/hooks/useExpenses'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/features/financeiro/types/expense.types'
import {
  Plus,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Package,
} from 'lucide-react'

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
const MONTH_SHORT = [
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
const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]

/* ── Add Expense Modal ─────────────────────────────────── */
function AddExpenseModal({ onClose }: { onClose: () => void }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('OTHER')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const { mutate: create, isPending } = useCreateExpense()

  const canSubmit = description.trim().length > 0 && Number(amount) > 0

  function handleSubmit() {
    if (!canSubmit) return
    create(
      {
        description: description.trim(),
        amount: Number(amount),
        category,
        date,
        notes: notes.trim() || null,
      },
      { onSuccess: onClose }
    )
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4A6CF7]/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Nova Despesa</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">Descrição *</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel de outubro"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Valor (R$) *
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="0,00"
                inputMode="decimal"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">Data *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">Categoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={inputCls}
            >
              {CATEGORIES.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Opcional"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="flex items-center gap-2 rounded-xl bg-[#4A6CF7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3a5ce5] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────── */
export default function FinanceiroPage() {
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [addOpen, setAddOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  const { data: ordersData } = useOrders({ limit: 1000 })
  const { data: productsData } = useProducts({ limit: 1000, isActive: true })
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses({
    month: String(selMonth + 1),
    year: String(selYear),
  })
  const { mutate: deleteExpense, isPending: deleting } = useDeleteExpense()

  const allOrders = ordersData?.data ?? []
  const confirmedOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'DELIVERED'),
    [allOrders]
  )

  // ── Revenue & COGS for selected month ─────────────────
  const { revenue, cogs, prevRevenue } = useMemo(() => {
    const prevMonth = selMonth === 0 ? 11 : selMonth - 1
    const prevYear = selMonth === 0 ? selYear - 1 : selYear

    let revenue = 0
    let cogs = 0
    let prevRevenue = 0

    confirmedOrders.forEach((o) => {
      const d = new Date(o.createdAt)
      if (d.getFullYear() === selYear && d.getMonth() === selMonth) {
        revenue += o.total
        o.items.forEach((item) => {
          const product = productsData?.data.find((p) => p.id === item.productId)
          if (product?.costPrice) cogs += product.costPrice * item.quantity
        })
      }
      if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevRevenue += o.total
      }
    })

    return { revenue, cogs, prevRevenue }
  }, [confirmedOrders, productsData, selMonth, selYear])

  const inventoryInvestment = useMemo(() => {
    return (productsData?.data ?? []).reduce((sum, p) => {
      if (p.costPrice && p.stock > 0) return sum + p.costPrice * p.stock
      return sum
    }, 0)
  }, [productsData])

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const grossProfit = revenue - cogs
  const netProfit = grossProfit - totalExpenses
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
  const revTrend = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null

  // ── Expenses by category ───────────────────────────────
  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>()
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount))
    return Array.from(map.entries())
      .map(([cat, total]) => ({ cat, label: EXPENSE_CATEGORY_LABELS[cat], total }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`

  const summaryCards = [
    {
      label: 'Receita',
      value: revenue,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: revTrend,
    },
    {
      label: 'Custo dos Produtos',
      value: cogs,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      trend: null,
    },
    {
      label: 'Despesas',
      value: totalExpenses,
      color: 'text-red-500',
      bg: 'bg-red-50',
      trend: null,
    },
    {
      label: 'Lucro Líquido',
      value: netProfit,
      color: netProfit >= 0 ? 'text-[#4A6CF7]' : 'text-red-500',
      bg: netProfit >= 0 ? 'bg-[#4A6CF7]/8' : 'bg-red-50',
      trend: null,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <h1 className="text-xl font-bold text-gray-800">Financeiro</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a5ce5]"
        >
          <Plus className="h-4 w-4" /> Nova despesa
        </button>
      </div>

      {/* Month selector */}
      <div className="relative inline-block">
        <button
          onClick={() => setMonthPickerOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {monthLabel}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        {monthPickerOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMonthPickerOpen(false)} />
            <div className="absolute left-0 z-20 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-100">
              {MONTH_SHORT.map((m, i) => (
                <button
                  key={m}
                  onClick={() => {
                    setSelMonth(i)
                    setMonthPickerOpen(false)
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${selMonth === i && selYear === now.getFullYear() ? 'font-semibold text-[#4A6CF7]' : 'text-gray-700'}`}
                >
                  {m} {selYear}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Inventory investment — independent of month filter */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50">
          <Package className="h-5 w-5 text-violet-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-400">Dinheiro Investido em Estoque</p>
          <p className="text-xl font-bold text-violet-600">{formatCurrency(inventoryInvestment)}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {(productsData?.data ?? []).filter((p) => p.costPrice && p.stock > 0).length} produto(s)
            com custo cadastrado
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`mt-1 text-xl font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
            {c.trend !== null && (
              <div className="mt-1.5 flex items-center gap-1">
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${c.trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                >
                  {c.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(c.trend).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-400">vs mês ant.</span>
              </div>
            )}
            {c.trend === null && c.label === 'Lucro Líquido' && revenue > 0 && (
              <p className="mt-1 text-xs text-gray-400">Margem: {margin.toFixed(1)}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Lucro bruto breakdown */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Resumo do Mês</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Receita bruta', value: revenue, cls: 'text-gray-800' },
            { label: '− Custo dos produtos (CMV)', value: -cogs, cls: 'text-amber-600' },
            {
              label: '= Lucro bruto',
              value: grossProfit,
              cls: 'font-semibold text-gray-800',
              border: true,
            },
            { label: '− Despesas operacionais', value: -totalExpenses, cls: 'text-red-500' },
            {
              label: '= Lucro líquido',
              value: netProfit,
              cls: `font-bold ${netProfit >= 0 ? 'text-[#4A6CF7]' : 'text-red-500'}`,
              border: true,
            },
          ].map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-1.5 ${row.border ? 'border-t border-gray-100' : ''}`}
            >
              <span className="text-gray-500">{row.label}</span>
              <span className={row.cls}>{formatCurrency(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Expenses list */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Despesas de {MONTH_SHORT[selMonth]}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {expenses.length} lançamento{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          {loadingExpenses ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-300">Nenhuma despesa lançada</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {expenses.map((expense) => (
                <li key={expense.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {EXPENSE_CATEGORY_LABELS[expense.category]} ·{' '}
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-sm font-semibold text-red-500">
                      −{formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      disabled={deleting}
                      className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* By category */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Despesas por Categoria</h2>
          <p className="mb-5 text-xs text-gray-400">Total: {formatCurrency(totalExpenses)}</p>
          {byCategory.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-300">
              Sem despesas
            </div>
          ) : (
            <div className="space-y-3">
              {byCategory.map((c) => (
                <div key={c.cat}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{c.label}</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-[#4A6CF7]"
                      style={{
                        width: `${totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {addOpen && <AddExpenseModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}
