'use client'

import { useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { useProducts, useNavCategories } from '@/features/products/hooks/useProducts'
import { ProductCard } from '@/features/products/components/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/formatCurrency'

/* ─── constants ─────────────────────────────────────────── */

const PRICE_MIN = 0
const PRICE_MAX = 25000
const PRICE_STEP = 100
const HISTOGRAM_BARS = [2, 4, 7, 12, 18, 26, 32, 24, 15, 9, 6, 4, 2]

/* ─── dual range slider ─────────────────────────────────── */

function DualRangeSlider({
  min,
  max,
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
}: {
  min: number
  max: number
  minVal: number
  maxVal: number
  onMinChange: (v: number) => void
  onMaxChange: (v: number) => void
}) {
  const minPercent = ((minVal - min) / (max - min)) * 100
  const maxPercent = ((maxVal - min) / (max - min)) * 100
  return (
    <div className="relative h-5 w-full">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-200" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#1565a0]"
        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={PRICE_STEP}
        value={minVal}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v < maxVal) onMinChange(v)
        }}
        className="price-range-thumb"
        style={{ zIndex: minVal > max - PRICE_STEP ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={PRICE_STEP}
        value={maxVal}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v > minVal) onMaxChange(v)
        }}
        className="price-range-thumb"
        style={{ zIndex: 4 }}
      />
    </div>
  )
}

function PriceHistogram({ minVal, maxVal }: { minVal: number; maxVal: number }) {
  const maxH = Math.max(...HISTOGRAM_BARS)
  return (
    <svg viewBox="0 0 104 40" className="w-full" aria-hidden>
      {HISTOGRAM_BARS.map((h, i) => {
        const barPrice = PRICE_MIN + ((i + 0.5) / HISTOGRAM_BARS.length) * (PRICE_MAX - PRICE_MIN)
        const inRange = barPrice >= minVal && barPrice <= maxVal
        const barH = (h / maxH) * 36
        return (
          <rect
            key={i}
            x={i * 8}
            y={40 - barH}
            width={7}
            height={barH}
            rx="2"
            fill={inRange ? '#1565a0' : '#e5e7eb'}
          />
        )
      })}
    </svg>
  )
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${checked ? 'border-primary bg-primary' : 'hover:border-primary border-gray-300 bg-white'}`}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && (
        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

/* ─── main content ──────────────────────────────────────── */

function CategoryContent() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()

  const [priceMin, setPriceMin] = useState(PRICE_MIN)
  const [priceMax, setPriceMax] = useState(PRICE_MAX)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [showAllTypes, setShowAllTypes] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const { data: navCategories = [] } = useNavCategories()
  const category = navCategories.find((c) => c.slug === slug)

  const { data, isLoading } = useProducts({
    categoryId: category?.id,
    isActive: true,
    limit: 100,
  })

  const allProducts = (data?.data ?? []).filter((p) => {
    if (priceMin > PRICE_MIN && p.price < priceMin) return false
    if (priceMax < PRICE_MAX && p.price > priceMax) return false
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brandId ?? '')) return false
    if (selectedTypes.length > 0 && !selectedTypes.includes(p.typeId ?? '')) return false
    return true
  })

  const brands = category?.brands ?? []
  const types = category?.types ?? []
  const visibleBrands = showAllBrands ? brands : brands.slice(0, 5)
  const visibleTypes = showAllTypes ? types : types.slice(0, 5)

  function toggleBrand(id: string) {
    setSelectedBrands((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }
  function toggleType(id: string) {
    setSelectedTypes((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const avgPrice = Math.round((priceMin + priceMax) / 2)
  const activeFilterCount =
    (priceMin > PRICE_MIN || priceMax < PRICE_MAX ? 1 : 0) +
    selectedBrands.length +
    selectedTypes.length

  const filtersContent = (
    <>
      {/* Price Range */}
      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Faixa de Preço</h3>
          <button
            onClick={() => {
              setPriceMin(PRICE_MIN)
              setPriceMax(PRICE_MAX)
            }}
            className="text-primary text-xs hover:underline"
          >
            Resetar
          </button>
        </div>
        <p className="mb-3 text-xs text-gray-400">Preço médio é {formatCurrency(avgPrice)}</p>
        <PriceHistogram minVal={priceMin} maxVal={priceMax} />
        <div className="mt-2 mb-3">
          <DualRangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            minVal={priceMin}
            maxVal={priceMax}
            onMinChange={setPriceMin}
            onMaxChange={setPriceMax}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
            {formatCurrency(priceMin)}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
            {formatCurrency(priceMax)}
          </span>
        </div>
      </div>

      {/* Estilos */}
      {types.length > 0 && (
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Estilo</h3>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-primary text-xs hover:underline"
              >
                Resetar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {visibleTypes.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-3"
                onClick={() => toggleType(t.id)}
              >
                <Checkbox
                  checked={selectedTypes.includes(t.id)}
                  onChange={() => toggleType(t.id)}
                />
                <span className="text-sm text-gray-700">{t.name}</span>
              </label>
            ))}
          </div>
          {types.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllTypes((v) => !v)}
              className="text-primary mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
            >
              {showAllTypes ? 'Ver menos' : 'Mais estilos'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showAllTypes ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      )}

      {/* Marcas */}
      {brands.length > 0 && (
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Marca</h3>
            {selectedBrands.length > 0 && (
              <button
                onClick={() => setSelectedBrands([])}
                className="text-primary text-xs hover:underline"
              >
                Resetar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {visibleBrands.map((b) => (
              <label
                key={b.id}
                className="flex cursor-pointer items-center gap-3"
                onClick={() => toggleBrand(b.id)}
              >
                <Checkbox
                  checked={selectedBrands.includes(b.id)}
                  onChange={() => toggleBrand(b.id)}
                />
                <span className="text-sm text-gray-700">{b.name}</span>
              </label>
            ))}
          </div>
          {brands.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="text-primary mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
            >
              {showAllBrands ? 'Ver menos' : 'Mais marcas'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showAllBrands ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{category?.name ?? slug}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {isLoading
              ? 'Carregando…'
              : `${allProducts.length} produto${allProducts.length !== 1 ? 's' : ''} encontrado${allProducts.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filtros mobile */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-[#1565a0]/40 hover:text-[#1565a0] lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1565a0] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">{filtersContent}</aside>

        {/* Product Grid */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-3/4 rounded-2xl" />
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold text-gray-700">Nenhum produto encontrado</p>
              <p className="mt-1 text-sm text-gray-400">Tente alterar os filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      {filterOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-gray-50 lg:hidden">
            <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Filtros</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#1565a0] px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPriceMin(PRICE_MIN)
                      setPriceMax(PRICE_MAX)
                      setSelectedBrands([])
                      setSelectedTypes([])
                    }}
                    className="text-sm text-[#1565a0] hover:underline"
                  >
                    Limpar tudo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-6">{filtersContent}</div>
            <div className="shrink-0 border-t bg-white px-4 py-4">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="w-full rounded-xl bg-[#1565a0] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Ver {allProducts.length} resultado{allProducts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryContent />
    </Suspense>
  )
}
