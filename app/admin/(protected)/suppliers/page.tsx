'use client'

import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
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
            <div className="rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6">
              <p className="text-xs text-neutral-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
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
            className={`h-1.5 rounded-full transition-all duration-300 ${dot === i ? 'w-4 bg-[#141414]' : 'w-1.5 bg-white/10'}`}
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
    { label: 'Total', value: total, accent: '#F5F5F5' },
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

  function isFormValid(f: SupplierInput) {
    return (
      f.name.trim().length >= 2 && f.contactName.trim().length >= 2 && f.phone.trim().length >= 10
    )
  }

  async function handleSave() {
    if (!isFormValid(form)) return
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
      <PageHeader
        title="Fornecedores"
        subtitle="Gerencie os fornecedores e seus contatos"
        action={
          <button
            onClick={openCreate}
            className="flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            Novo fornecedor
          </button>
        }
      />

      {/* ── stats ──────────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        <StatsCarousel stats={stats} />
      </div>
      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
            <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar fornecedor..."
            className="w-full rounded-xl border-0 bg-[#141414] py-2.5 pr-4 pl-9 text-sm text-neutral-200 ring-1 ring-white/6 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="rounded-xl border-0 bg-[#141414] py-2.5 pr-8 pl-3 text-sm text-neutral-200 ring-1 ring-white/6 focus:ring-2 focus:ring-white/20 focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* ── table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-[#141414] ring-1 ring-white/6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            Nenhum fornecedor encontrado.
          </div>
        ) : (
          <>
            {/* mobile + tablet card list */}
            <div className="divide-y divide-white/6 lg:hidden">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-neutral-100">{s.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/6 text-neutral-400'}`}
                      >
                        {s.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {s.contactName} · {s.phone}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.categories.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-neutral-300"
                        >
                          {c}
                        </span>
                      ))}
                      {s.categories.length > 3 && (
                        <span className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-neutral-300">
                          +{s.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/8"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(s.id)}
                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
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
                  <tr className="border-b border-white/6">
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
                        className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-neutral-800/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="max-w-44 truncate font-medium text-neutral-100">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-300">{s.contactName}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-neutral-300">{s.phone}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {s.categories.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="rounded-full bg-white/6 px-2 py-0.5 text-xs text-neutral-300"
                            >
                              {c}
                            </span>
                          ))}
                          {s.categories.length > 2 && (
                            <span className="rounded-full bg-white/6 px-2 py-0.5 text-xs text-neutral-300">
                              +{s.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/6 text-neutral-400'}`}
                        >
                          {s.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-neutral-500">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/8 hover:text-white"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deletingId === s.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/15"
                                title="Confirmar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/8"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(s.id)}
                              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
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
          <p className="text-xs text-neutral-500">
            Exibindo{' '}
            <span className="font-semibold text-neutral-200">
              {(page - 1) * 5 + 1}–{Math.min(page * 5, total)}
            </span>{' '}
            de <span className="font-semibold text-neutral-200">{total}</span> fornecedores
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/8 hover:shadow-sm disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:bg-white/8 hover:shadow-sm'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/8 hover:shadow-sm disabled:opacity-30"
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
          <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-[#141414] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
              <h2 className="text-base font-bold text-neutral-100">
                {editing ? 'Editar fornecedor' : 'Novo fornecedor'}
              </h2>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/8 hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                  Razão social *
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="mt-1.5 w-full rounded-xl border-0 bg-white/4 px-4 py-2.5 text-sm text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    Responsável *
                  </span>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    placeholder="Nome do contato"
                    className="mt-1.5 w-full rounded-xl border-0 bg-white/4 px-4 py-2.5 text-sm text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    Telefone *
                  </span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="mt-1.5 w-full rounded-xl border-0 bg-white/4 px-4 py-2.5 text-sm text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                  Categorias fornecidas
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-xl bg-white/4 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-white/20">
                  {form.categories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-black"
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
                    className="min-w-28 flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3 ring-1 ring-white/10">
                <span className="text-sm font-medium text-neutral-200">Fornecedor ativo</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${form.isActive ? 'bg-[#141414]' : 'bg-neutral-600'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#141414] shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/6 px-6 py-4">
              <button
                onClick={closeDrawer}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/8"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid(form) || isSaving}
                className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-40"
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
