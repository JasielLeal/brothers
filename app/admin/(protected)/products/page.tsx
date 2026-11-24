'use client'

import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import {
  useProducts,
  useDeleteProduct,
  useCategories,
  useProductTypes,
} from '@/features/products/hooks/useProducts'
import { formatCurrency } from '@/utils/formatCurrency'
import { ProductFormModal } from '@/features/products/components/ProductFormModal'
import { ProductTagModal } from '@/features/products/components/ProductTagModal'
import type { Product } from '@/features/products/types/product.types'

/* ── stats carousel (mobile + tablet infinite) ──────────────── */
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
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dot === i ? 'w-4 bg-white' : 'w-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function AdminProductsPage() {
  const PAGE_SIZE = 10

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [tagProduct, setTagProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }
  function handleCategory(v: string) {
    setCategoryId(v)
    setPage(1)
  }
  function handleType(v: string) {
    setTypeId(v)
    setPage(1)
  }

  const { data: productsData, isLoading } = useProducts({
    limit: PAGE_SIZE,
    page,
    search: search || undefined,
    categoryId: categoryId || undefined,
    typeId: typeId || undefined,
  })
  const { data: categories } = useCategories()
  const { data: productTypes } = useProductTypes()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()

  const products = productsData?.data ?? []
  const total = productsData?.total ?? 0
  const totalPages = productsData?.totalPages ?? 1
  const active = products.filter((p) => p.isActive).length
  const inactive = products.filter((p) => !p.isActive).length
  const noStock = products.filter((p) => p.stock === 0).length

  const stats = [
    { label: 'Total', value: total, accent: '#F5F5F5' },
    { label: 'Ativos', value: active, accent: '#22C55E' },
    { label: 'Inativos', value: inactive, accent: '#94A3B8' },
    { label: 'Sem estoque', value: noStock, accent: '#EF4444' },
  ]

  return (
    <div className="space-y-5">
      {/* ── header ───────────────────────────────────── */}
      <PageHeader
        title="Produtos"
        subtitle="Gerencie o catálogo de produtos da loja"
        action={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </button>
        }
      />

      {/* ── stats row ────────────────────────────────── */}
      {/* mobile + tablet: infinite carousel */}
      <div className="lg:hidden">
        <StatsCarousel stats={stats} />
      </div>
      {/* desktop: grid */}
      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
            <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── filters ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full rounded-xl border-0 bg-[#141414] py-2.5 pr-4 pl-9 text-sm text-neutral-200 ring-1 ring-white/6 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => handleCategory(e.target.value)}
          className="rounded-xl border-0 bg-[#141414] py-2.5 pr-8 pl-3 text-sm text-neutral-200 ring-1 ring-white/6 focus:ring-2 focus:ring-white/20 focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={typeId}
          onChange={(e) => handleType(e.target.value)}
          className="rounded-xl border-0 bg-[#141414] py-2.5 pr-8 pl-3 text-sm text-neutral-200 ring-1 ring-white/6 focus:ring-2 focus:ring-white/20 focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          {productTypes?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── table card ───────────────────────────────── */}
      <div className="rounded-3xl bg-[#141414] ring-1 ring-white/6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-neutral-600" />
          </div>
        ) : !products.length ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            Nenhum produto encontrado.
          </div>
        ) : (
          <>
            {/* ── mobile + tablet card list ────────────────────────── */}
            <div className="divide-y divide-white/6 lg:hidden">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/6">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-neutral-100">
                        {product.name}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          product.isActive
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-white/6 text-neutral-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-neutral-500'}`}
                        />
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="text-xs text-neutral-500">{product.category.name}</span>
                      <span className="text-xs font-semibold text-neutral-200">
                        {formatCurrency(product.price)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${product.stock === 0 ? 'text-red-400' : product.stock <= 10 ? 'text-amber-400' : 'text-green-400'}`}
                      >
                        Estoque: {product.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setTagProduct(product)}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                      title="Etiqueta"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── desktop table ─────────────────────────────────── */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Produto
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Categoria
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Preço
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Estoque
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Lucro / peça
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-neutral-800/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/6">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-neutral-100">{product.name}</p>
                            {product.isFeatured && (
                              <span className="text-[10px] font-semibold text-amber-400">
                                Destaque
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-400">
                        {product.category.name}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-neutral-100">
                            {formatCurrency(product.price)}
                          </p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-[11px] text-neutral-500 line-through">
                              {formatCurrency(product.originalPrice)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-sm font-semibold ${
                            product.stock === 0
                              ? 'text-red-400'
                              : product.stock <= 10
                                ? 'text-amber-400'
                                : 'text-green-400'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {product.costPrice ? (
                          <span className="text-xs font-semibold text-emerald-400">
                            +
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(product.price - product.costPrice)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.isActive
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-white/6 text-neutral-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.isActive ? 'bg-green-500' : 'bg-neutral-500'
                            }`}
                          />
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setTagProduct(product)}
                            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                            title="Etiqueta"
                          >
                            <Tag className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/8 hover:text-white"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* ── pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Exibindo{' '}
            <span className="font-semibold text-neutral-200">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
            </span>{' '}
            de <span className="font-semibold text-neutral-200">{total}</span> produtos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/8 hover:shadow-sm disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              const delta = 2
              const left = page - delta
              const right = page + delta

              for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                  pages.push(i)
                } else if (pages[pages.length - 1] !== '...') {
                  pages.push('...')
                }
              }

              return pages.map((p, idx) =>
                p === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-6 items-center justify-center text-xs text-neutral-500"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === page
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-400 hover:bg-white/8 hover:shadow-sm'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
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

      <ProductFormModal
        key={editingProduct?.id ?? (isCreateOpen ? 'create' : 'closed')}
        open={isCreateOpen || editingProduct !== null}
        product={editingProduct}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingProduct(null)
        }}
      />

      {tagProduct && <ProductTagModal product={tagProduct} onClose={() => setTagProduct(null)} />}

      {deletingProduct && (
        <DeleteProductModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onDeleted={() => setDeletingProduct(null)}
        />
      )}
    </div>
  )
}

/* ── DeleteProductModal ────────────────────────────────── */
function DeleteProductModal({
  product,
  onClose,
  onDeleted,
}: {
  product: Product
  onClose: () => void
  onDeleted: () => void
}) {
  const { mutate: deleteProduct, isPending } = useDeleteProduct()

  function handleDelete() {
    deleteProduct(product.id, { onSuccess: onDeleted })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-neutral-100">Excluir produto</h3>
          <p className="text-sm text-neutral-400">
            Tem certeza que deseja excluir{' '}
            <span className="font-semibold text-neutral-200">&ldquo;{product.name}&rdquo;</span>?
            Esta ação não pode ser desfeita.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/8 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
