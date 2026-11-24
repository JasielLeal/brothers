'use client'

import { useState, useSyncExternalStore } from 'react'
import { Check, Copy, ExternalLink, Loader2, PackageSearch } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useCategories,
  useProductTypes,
  useBrands,
  useProducts,
} from '@/features/products/hooks/useProducts'
import { ProductCard } from '@/features/products/components/ProductCard'
import { SIZE_SETS } from '@/features/products/types/product.types'

const selectClass =
  'h-9 w-full rounded-lg border px-3 text-sm transition outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 border-white/10 bg-[#141414] text-neutral-100'

export default function GerarLinkPage() {
  const { data: categories = [] } = useCategories()
  const { data: types = [] } = useProductTypes()
  const { data: brands = [] } = useBrands()

  const [categoryId, setCategoryId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [size, setSize] = useState('')
  const [copied, setCopied] = useState(false)

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const origin = mounted ? window.location.origin : ''

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const sizeOptions = selectedCategory ? SIZE_SETS[selectedCategory.sizeSet] : null

  function handleCategoryChange(value: string) {
    setCategoryId(value)
    setSize('')
  }

  const { data, isLoading } = useProducts({
    categoryId: categoryId || undefined,
    typeId: typeId || undefined,
    brandId: brandId || undefined,
    size: size || undefined,
    isActive: true,
    limit: 8,
  })

  const products = data?.data ?? []
  const total = data?.total ?? 0

  const params = new URLSearchParams()
  if (categoryId) params.set('categoryId', categoryId)
  if (typeId) params.set('typeId', typeId)
  if (brandId) params.set('brandId', brandId)
  if (size) params.set('size', size)
  const path = params.toString() ? `/search?${params.toString()}` : '/search'
  const link = `${origin}${path}`
  const hasFilters = categoryId || typeId || brandId || size

  function handleCopy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleClear() {
    setCategoryId('')
    setTypeId('')
    setBrandId('')
    setSize('')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gerar Link"
        subtitle="Escolha os filtros e gere um link da loja pronto para compartilhar"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* filtros */}
        <div className="space-y-4 rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Tipo</label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className={selectClass}
            >
              <option value="">Todos os tipos</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Marca</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={selectClass}
            >
              <option value="">Todas as marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Tamanho</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className={selectClass}>
              <option value="">Todos os tamanhos</option>
              {sizeOptions ? (
                sizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              ) : (
                <>
                  <optgroup label="Roupa">
                    {SIZE_SETS.CLOTHING.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Calçado">
                    {SIZE_SETS.SHOE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
            {!selectedCategory && (
              <p className="text-[11px] text-neutral-500">
                Selecione uma categoria para ver só os tamanhos que ela usa
              </p>
            )}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-white hover:underline"
            >
              Limpar filtros
            </button>
          )}

          <div className="space-y-1.5 border-t border-white/6 pt-4">
            <label className="text-sm font-medium text-neutral-200">Link da loja</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="h-9 w-full rounded-lg border border-white/10 bg-white/6 px-3 font-mono text-xs text-neutral-300 outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                title="Copiar link"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-black transition hover:bg-neutral-200"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir na loja"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-300 transition hover:bg-white/8"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* preview */}
        <div className="space-y-3 rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-200">Pré-visualização</h2>
            <span className="text-xs text-neutral-500">
              {isLoading ? 'Carregando…' : `${total} produto${total !== 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="rounded-xl bg-[#111] p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-white/40">
                <PackageSearch className="h-8 w-8" />
                <p className="text-sm">Nenhum produto corresponde a esses filtros</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
