'use client'

import { useState, useRef, useEffect } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Loader2,
} from 'lucide-react'
import { formatDate } from '@/utils/formatDate'
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/features/suppliers/hooks/useSuppliers'
import type { Supplier, SupplierInput } from '@/features/suppliers/types/supplier.types'

// ── stats carousel (mobile) ───────────────────────────────────────────────────
type StatItem = { label: string; value: number; accent: string }

function StatsCarousel({ stats }: { stats: StatItem[] }) {
  const n = stats.length
  const extended = [stats[n - 1], ...stats, stats[0]]
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
        {extended.map((s, i) => (
          <div key={i} className="w-full shrink-0">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
              <p className="text-xs text-gray-400 dark:text-neutral-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {stats.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setAnimated(true)
              setIdx(i + 1)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${dot === i ? 'w-4 bg-[#4A6CF7]' : 'w-1.5 bg-gray-200 dark:bg-neutral-700'}`}
          />
        ))}
      </div>
    </div>
  )
}

const EMPTY_FORM: SupplierInput = {
  name: '',
  contactName: '',
  phone: '',
  categories: [],
  isActive: true,
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function AdminSuppliersPage() {
  const [catInput, setCatInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)

  const isActiveParam =
    statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined

  const { data, isLoading } = useSuppliers({
    search,
    isActive: isActiveParam,
    page,
    limit: 5,
  })

  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const suppliers = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierInput>(EMPTY_FORM)

  // confirm-delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }
  function handleStatus(v: string) {
    setStatus(v as typeof statusFilter)
    setPage(1)
  }

  const stats = [
    { label: 'Total', value: total, accent: '#4A6CF7' },
    { label: 'Ativos', value: suppliers.filter((s) => s.isActive).length, accent: '#22C55E' },
    { label: 'Inativos', value: suppliers.filter((s) => !s.isActive).length, accent: '#94A3B8' },
    {
      label: 'Categorias',
      value: new Set(suppliers.flatMap((s) => s.categories)).size,
      accent: '#F59E0B',
    },
  ]

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setCatInput('')
    setDrawerOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name: s.name,
      contactName: s.contactName,
      phone: s.phone,
      categories: [...s.categories],
      isActive: s.isActive,
    })
    setCatInput('')
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditing(null)
    setCatInput('')
  }

  function addCategory(raw: string) {
    const tag = raw.trim()
    if (!tag || form.categories.includes(tag)) {
      setCatInput('')
      return
    }
    setForm((f) => ({ ...f, categories: [...f.categories, tag] }))
    setCatInput('')
  }

  function removeCategory(cat: string) {
    setForm((f) => ({ ...f, categories: f.categories.filter((c) => c !== cat) }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (editing) {
      await updateSupplier.mutateAsync({ id: editing.id, input: form })
    } else {
      await createSupplier.mutateAsync(form)
    }
    closeDrawer()
  }

  async function handleDelete(id: string) {
    await deleteSupplier.mutateAsync(id)
    setDeletingId(null)
  }

  const isSaving = createSupplier.isPending || updateSupplier.isPending

  return (
    <div className="space-y-5">
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <h1 className="text-xl font-bold text-gray-800 dark:text-neutral-100">Fornecedores</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5]"
        >
          <Plus className="h-4 w-4" />
          Novo fornecedor
        </button>
      </div>

      {/* ── stats ──────────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        <StatsCarousel stats={stats} />
      </div>
      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800"
          >
            <p className="text-xs text-gray-400 dark:text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar fornecedor..."
            className="w-full rounded-xl border-0 bg-white py-2.5 pr-4 pl-9 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/30 focus:outline-none dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-800 dark:placeholder:text-neutral-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="rounded-xl border-0 bg-white py-2.5 pr-8 pl-3 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-[#4A6CF7]/30 focus:outline-none dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-800"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* ── table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300 dark:text-neutral-600" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-neutral-500">
            Nenhum fornecedor encontrado.
          </div>
        ) : (
          <>
            {/* mobile + tablet card list */}
            <div className="divide-y divide-gray-50 lg:hidden dark:divide-neutral-800">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4A6CF7]/8">
                    <Building2 className="h-4 w-4 text-[#4A6CF7]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-neutral-100">
                        {s.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.isActive ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'}`}
                      >
                        {s.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                      {s.contactName} · {s.phone}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.categories.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          {c}
                        </span>
                      ))}
                      {s.categories.length > 3 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                          +{s.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#4A6CF7]/8 hover:text-[#4A6CF7] dark:text-neutral-500"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(s.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-neutral-800">
                    {[
                      'Empresa',
                      'Responsável',
                      'Telefone',
                      'Categorias',
                      'Status',
                      'Cadastro',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                  {suppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-neutral-800/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4A6CF7]/8">
                            <Building2 className="h-4 w-4 text-[#4A6CF7]" />
                          </div>
                          <span className="max-w-44 truncate font-medium text-gray-800 dark:text-neutral-100">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-neutral-300">
                        {s.contactName}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-neutral-300">
                        {s.phone}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {s.categories.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              {c}
                            </span>
                          ))}
                          {s.categories.length > 2 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                              +{s.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.isActive ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'}`}
                        >
                          {s.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 dark:text-neutral-500">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#4A6CF7]/8 hover:text-[#4A6CF7] dark:text-neutral-500"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deletingId === s.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15"
                                title="Confirmar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(s.id)}
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-neutral-500">
            Exibindo{' '}
            <span className="font-semibold text-gray-700 dark:text-neutral-200">
              {(page - 1) * 5 + 1}–{Math.min(page * 5, total)}
            </span>{' '}
            de <span className="font-semibold text-gray-700 dark:text-neutral-200">{total}</span>{' '}
            fornecedores
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:shadow-sm disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-[#4A6CF7] text-white shadow-sm' : 'text-gray-500 hover:bg-white hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:shadow-sm disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── drawer ─────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={closeDrawer}
          />
          <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-gray-800 dark:text-neutral-100">
                {editing ? 'Editar fornecedor' : 'Novo fornecedor'}
              </h2>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-neutral-400">
                  Razão social *
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700 dark:placeholder:text-neutral-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-neutral-400">
                    Responsável
                  </span>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    placeholder="Nome do contato"
                    className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700 dark:placeholder:text-neutral-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-neutral-400">
                    Telefone
                  </span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4A6CF7]/40 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700 dark:placeholder:text-neutral-500"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-neutral-400">
                  Categorias fornecidas
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-xl bg-gray-50 px-3 py-2.5 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-[#4A6CF7]/40 dark:bg-neutral-950 dark:ring-neutral-700">
                  {form.categories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 rounded-full bg-[#4A6CF7] px-2.5 py-0.5 text-xs font-semibold text-white"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="ml-0.5 rounded-full hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={catInput}
                    onChange={(e) => setCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        addCategory(catInput)
                      }
                      if (e.key === 'Backspace' && !catInput && form.categories.length > 0)
                        removeCategory(form.categories[form.categories.length - 1])
                    }}
                    onBlur={() => {
                      if (catInput.trim()) addCategory(catInput)
                    }}
                    placeholder={form.categories.length === 0 ? 'Digite e pressione Enter...' : ''}
                    className="min-w-28 flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-neutral-200 dark:placeholder:text-neutral-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200 dark:bg-neutral-950 dark:ring-neutral-700">
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-200">
                  Fornecedor ativo
                </span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${form.isActive ? 'bg-[#4A6CF7]' : 'bg-gray-300 dark:bg-neutral-600'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform dark:bg-neutral-900 ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-neutral-800">
              <button
                onClick={closeDrawer}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5] disabled:opacity-40"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing ? 'Salvar alterações' : 'Adicionar fornecedor'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
