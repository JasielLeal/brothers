'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { useInfiniteProducts, useNavCategories } from '@/features/products/hooks/useProducts'
import { ProductCard } from '@/features/products/components/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'

/* ─── price ranges ──────────────────────────────────────── */

const PRICE_RANGES = [
  { label: 'Até R$50', min: 0, max: 50 },
  { label: 'R$50 a R$100', min: 50, max: 100 },
  { label: 'R$100 a R$200', min: 100, max: 200 },
  { label: 'R$200 a R$500', min: 200, max: 500 },
  { label: 'R$500 a R$1.000', min: 500, max: 1000 },
  { label: 'Acima de R$1.000', min: 1000, max: undefined },
]

/* ─── checkbox ──────────────────────────────────────────── */

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? 'border-[#4a9fd4] bg-[#4a9fd4]'
          : 'border-white/20 bg-transparent hover:border-white/40'
      }`}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && (
        <svg
          className="h-2.5 w-2.5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

/* ─── main content ──────────────────────────────────────── */

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const urlCategoryId = searchParams.get('categoryId') ?? null
  const urlBrandId = searchParams.get('brandId') ?? null
  const urlTypeId = searchParams.get('typeId') ?? null

  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    urlCategoryId ? [urlCategoryId] : []
  )
  const [selectedTypes, setSelectedTypes] = useState<string[]>(urlTypeId ? [urlTypeId] : [])
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlBrandId ? [urlBrandId] : [])
  const [openCatId, setOpenCatId] = useState<string | null>(urlCategoryId)
  const [filterOpen, setFilterOpen] = useState(false)

  const [prevCatId, setPrevCatId] = useState(urlCategoryId)
  const [prevBrandId, setPrevBrandId] = useState(urlBrandId)
  const [prevTypeId, setPrevTypeId] = useState(urlTypeId)

  if (prevCatId !== urlCategoryId) {
    setPrevCatId(urlCategoryId)
    setSelectedCategories(urlCategoryId ? [urlCategoryId] : [])
    setOpenCatId(urlCategoryId)
    setSelectedPriceRange(null)
  }
  if (prevBrandId !== urlBrandId) {
    setPrevBrandId(urlBrandId)
    setSelectedBrands(urlBrandId ? [urlBrandId] : [])
  }
  if (prevTypeId !== urlTypeId) {
    setPrevTypeId(urlTypeId)
    setSelectedTypes(urlTypeId ? [urlTypeId] : [])
  }

  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data: navCategories } = useNavCategories()
  const activeRange = selectedPriceRange !== null ? PRICE_RANGES[selectedPriceRange] : null

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteProducts({
    search: q || undefined,
    categoryId: selectedCategories[0] || undefined,
    brandId: selectedBrands[0] || undefined,
    typeId: selectedTypes[0] || undefined,
    minPrice: activeRange?.min || undefined,
    maxPrice: activeRange?.max || undefined,
  })

  // infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allProducts = data?.pages.flatMap((p) => p.data) ?? []
  const suggestedProducts = data?.pages[0]?.suggestedProducts ?? []
  const totalCount = data?.pages[0]?.total ?? 0

  const products = allProducts.filter((p) => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category.id)) return false
    if (selectedTypes.length > 0 && !selectedTypes.includes(p.type?.id ?? '')) return false
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand?.id ?? '')) return false
    return true
  })

  const noResults = !isLoading && allProducts.length === 0

  // brands & categories derived from fetched results
  const resultBrands = Array.from(
    new Map(allProducts.filter((p) => p.brand).map((p) => [p.brand!.id, p.brand!])).values()
  )
  const categoryCounts = new Map<string, number>()
  allProducts.forEach((p) =>
    categoryCounts.set(p.category.id, (categoryCounts.get(p.category.id) ?? 0) + 1)
  )
  const resultTypeIds = new Set(allProducts.map((p) => p.type?.id).filter(Boolean))
  const minCatCount = allProducts.length >= 8 ? 2 : 1
  const visibleNavCategories = (navCategories ?? []).filter((cat) => {
    if ((categoryCounts.get(cat.id) ?? 0) >= minCatCount) return true
    return cat.types.some((t) => resultTypeIds.has(t.id))
  })

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }
  function toggleType(id: string) {
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }
  function toggleBrand(id: string) {
    setSelectedBrands((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))
  }
  function toggleCatAccordion(id: string) {
    setOpenCatId((prev) => (prev === id ? null : id))
  }

  const activeFilterCount =
    (selectedPriceRange !== null ? 1 : 0) +
    selectedCategories.length +
    selectedTypes.length +
    selectedBrands.length

  function clearAll() {
    setSelectedPriceRange(null)
    setSelectedCategories([])
    setSelectedTypes([])
    setSelectedBrands([])
  }

  /* ── filtros compartilhados ── */
  const filtersContent = (
    <>
      {/* Price Range */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Faixa de Preço</h3>
          {selectedPriceRange !== null && (
            <button
              onClick={() => setSelectedPriceRange(null)}
              className="text-xs text-[#4a9fd4] hover:underline"
            >
              Resetar
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((range, i) => (
            <div
              key={i}
              className="flex cursor-pointer items-center gap-3"
              onClick={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
            >
              <Checkbox
                checked={selectedPriceRange === i}
                onChange={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
              />
              <span className="text-sm text-white/60">{range.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      {resultBrands.length > 0 && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Marca</h3>
            {selectedBrands.length > 0 && (
              <button
                onClick={() => setSelectedBrands([])}
                className="text-xs text-[#4a9fd4] hover:underline"
              >
                Resetar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {resultBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex cursor-pointer items-center gap-3"
                onClick={() => toggleBrand(brand.id)}
              >
                <Checkbox
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => toggleBrand(brand.id)}
                />
                <span className="text-sm text-white/60">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Categoria</h3>
          {(selectedCategories.length > 0 || selectedTypes.length > 0) && (
            <button
              onClick={() => {
                setSelectedCategories([])
                setSelectedTypes([])
              }}
              className="text-xs text-[#4a9fd4] hover:underline"
            >
              Resetar
            </button>
          )}
        </div>
        <div className="flex flex-col">
          {visibleNavCategories.map((cat) => {
            const isOpen = openCatId === cat.id
            const hasTypes = cat.types.length > 0
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-3 py-1.5">
                  <Checkbox
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  {hasTypes ? (
                    <button
                      type="button"
                      onClick={() => toggleCatAccordion(cat.id)}
                      className="flex flex-1 items-center justify-between text-left text-sm text-white/70 hover:text-white"
                    >
                      {cat.name}
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : (
                    <span className="text-sm text-white/70">{cat.name}</span>
                  )}
                </div>
                {hasTypes && isOpen && (
                  <div className="mb-1 flex flex-col pl-7">
                    {cat.types.map((t) => (
                      <div
                        key={t.id}
                        className="flex cursor-pointer items-center gap-3 py-1"
                        onClick={() => toggleType(t.id)}
                      >
                        <Checkbox
                          checked={selectedTypes.includes(t.id)}
                          onChange={() => toggleType(t.id)}
                        />
                        <span className="text-xs text-white/40">{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  return (
    <div className="mx-auto max-w-screen-2xl px-3 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            {q ? `Resultados para "${q}"` : 'Todos os produtos'}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {isLoading
              ? 'Buscando…'
              : `${totalCount} produto${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4a9fd4] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">{filtersContent}</aside>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-3/4 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : noResults ? (
            <div>
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                  🔍
                </div>
                <p className="text-lg font-bold text-white">
                  {q ? `Nenhum resultado para "${q}"` : 'Nenhum produto encontrado'}
                </p>
                <p className="mt-1 text-sm text-white/40">
                  {q
                    ? 'Tente verificar a ortografia ou use termos mais gerais'
                    : 'Tente alterar os filtros'}
                </p>
              </div>
              {suggestedProducts.length > 0 && (
                <div className="mt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <p className="text-sm font-semibold text-white/40">
                      Produtos que podem te interessar
                    </p>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {suggestedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Sentinel para infinite scroll */}
              <div ref={sentinelRef} className="mt-8 flex justify-center">
                {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-white/30" />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      {filterOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-[#111] lg:hidden">
            <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Filtros</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#4a9fd4] px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-[#4a9fd4] hover:underline"
                  >
                    Limpar tudo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="rounded-full p-1.5 text-white/40 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-6">{filtersContent}</div>
            <div className="shrink-0 border-t border-white/10 bg-[#0d0d0d] px-4 py-4">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="w-full rounded-xl bg-[#4a9fd4] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Ver {products.length} resultado{products.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
