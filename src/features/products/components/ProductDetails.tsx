'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Heart, ChevronDown, MapPin, Truck, ShieldCheck, Loader2, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/features/cart/hooks/useCart'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import type { Product, ProductVariant, SizeLabel } from '@/features/products/types/product.types'
import { SIZE_SETS } from '@/features/products/types/product.types'
interface ShippingOption {
  id: number
  name: string
  company: string
  price: number
  days: number
}

/* ── accordion ── */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-t border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

interface ProductDetailsProps {
  product: Product
}

const CEP_KEY = 'brothers_user_cep'

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

function formatDeliveryDate(date: Date): string {
  const str = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
  return str.replace(/(\w+)$/, (m) => m.charAt(0).toUpperCase() + m.slice(1))
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const hasVariants = product.category.hasVariants
  const isUniqueSize = product.category.sizeSet === 'UNIQUE'
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [variantsLoading, setVariantsLoading] = useState(hasVariants)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [prevVariantId, setPrevVariantId] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<SizeLabel | ''>('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if ((selectedVariant?.id ?? null) !== prevVariantId) {
    setPrevVariantId(selectedVariant?.id ?? null)
    setSelectedSize(isUniqueSize ? SIZE_SETS.UNIQUE[0] : '')
    setSelectedImageIndex(0)
  }

  // ── Frete ──────────────────────────────────────────────────────────────────
  const [cep, setCep] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(CEP_KEY) ?? '') : ''
  )
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const didAutoCalc = useRef(false)

  // Auto-calculate if saved CEP exists
  useEffect(() => {
    if (cep.replace(/\D/g, '').length === 8 && !didAutoCalc.current) {
      didAutoCalc.current = true
      calculateShipping(cep)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep])

  async function calculateShipping(rawCep = cep) {
    const digits = rawCep.replace(/\D/g, '')
    if (digits.length !== 8) {
      setShippingError('CEP inválido')
      return
    }
    setShippingLoading(true)
    setShippingError('')
    setShippingOptions([])
    try {
      const res = await fetch('/api/freight/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: digits, totalValue: product.price }),
      })
      const data = await res.json()
      if (!res.ok) {
        setShippingError(data.error ?? 'Erro ao calcular frete')
        return
      }
      setShippingOptions(data)
      localStorage.setItem(CEP_KEY, formatCep(digits))
    } catch {
      setShippingError('Erro ao calcular frete')
    } finally {
      setShippingLoading(false)
    }
  }

  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const { addItem } = useCart()
  const router = useRouter()

  useEffect(() => {
    if (!hasVariants) return
    fetch(`/api/products/${product.id}/variants`)
      .then((r) => r.json())
      .then((d) => {
        const list: ProductVariant[] = Array.isArray(d) ? d : (d.data ?? [])
        setVariants(list)
        if (list.length > 0) setSelectedVariant(list[0])
      })
      .catch(() => {})
      .finally(() => setVariantsLoading(false))
  }, [product.id, hasVariants])

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const displayImages = selectedVariant?.images.length ? selectedVariant.images : product.images

  const availableSizes = selectedVariant
    ? SIZE_SETS[product.category.sizeSet].filter((s) => {
        const sizeStock = selectedVariant.sizes.find((sz) => sz.size === s)
        return sizeStock && sizeStock.stock > 0
      })
    : []

  const stockForSelectedSize =
    selectedSize && selectedVariant
      ? (selectedVariant.sizes.find((sz) => sz.size === selectedSize)?.stock ?? 0)
      : 0

  const canAdd = hasVariants
    ? !!selectedVariant && !!selectedSize && stockForSelectedSize > 0
    : product.stock > 0

  function handleAddToCart() {
    if (!canAdd) return
    if (!hasVariants) {
      addItem(product, quantity, { image: displayImages[0] })
      return
    }
    if (!selectedVariant) return
    addItem(product, 1, {
      color: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex ?? undefined,
      size: selectedSize,
      image: displayImages[0],
    })
  }

  function handleBuyNow() {
    handleAddToCart()
    router.push('/checkout')
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1.5fr_300px] lg:items-start">
      {/* ── Galeria ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Miniaturas: coluna à esquerda no desktop */}
        {displayImages.length > 1 && (
          <div className="order-2 flex flex-row gap-2 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all lg:h-20 lg:w-20 ${
                  i === selectedImageIndex
                    ? 'border-white'
                    : 'border-white/20 opacity-50 hover:opacity-80'
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}

        <div
          className="relative order-1 min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#1a1a1a] lg:order-2"
          style={{ aspectRatio: '1 / 1' }}
        >
          {displayImages[selectedImageIndex] && (
            <Image
              src={displayImages[selectedImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          )}
          {discount && (
            <span className="absolute top-3 left-3 rounded-full bg-[#4a9fd4] px-2.5 py-0.5 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleItem(product)}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${wishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </button>
        </div>
      </div>

      {/* ── Info ──────────────────────────────────────── */}
      <div className="flex flex-col">
        <p className="mb-1 text-xs font-semibold tracking-widest text-white/40 uppercase">
          {product.category.name}
        </p>
        <h1 className="mb-4 text-2xl leading-tight font-bold text-white">{product.name}</h1>

        <div className="mb-5">
          {product.originalPrice && (
            <p className="text-sm text-white/40 line-through">
              {formatCurrency(product.originalPrice)}
            </p>
          )}
          <p className="text-3xl font-extrabold text-white">{formatCurrency(product.price)}</p>
        </div>

        {/* Cores */}
        {!hasVariants ? null : variantsLoading ? (
          <div className="mb-5 space-y-2.5">
            <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="flex gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        ) : variants.length > 0 ? (
          <div className="mb-5">
            <p className="mb-2.5 text-sm font-semibold text-white">
              Cor:{' '}
              <span className="font-normal text-white/50">{selectedVariant?.colorName ?? ''}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  title={v.colorName}
                  className={`relative h-9 w-9 rounded-full transition-all ${
                    selectedVariant?.id === v.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  style={{ backgroundColor: v.colorHex ?? '#888' }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Tamanhos */}
        {!hasVariants || isUniqueSize ? null : variantsLoading ? (
          <div className="mb-6 space-y-2.5">
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-11 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        ) : variants.length > 0 ? (
          <div className="mb-6">
            <p className="mb-2.5 text-sm font-semibold text-white">
              Tamanho: <span className="font-normal text-white/50">{selectedSize}</span>
            </p>
            {availableSizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 min-w-11 rounded-full px-4 text-sm font-semibold transition-all ${
                      selectedSize === size
                        ? 'bg-[#4a9fd4] text-white'
                        : 'border border-white/10 bg-transparent text-white/60 hover:border-white/30'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30">
                {selectedVariant ? 'Sem estoque disponível para esta cor' : 'Selecione uma cor'}
              </p>
            )}
          </div>
        ) : null}

        {/* Quantidade (produtos sem variação de cor/tamanho) */}
        {!hasVariants && (
          <div className="mb-6">
            <p className="mb-2.5 text-sm font-semibold text-white">Quantidade</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-lg text-white/70 hover:text-white"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-lg text-white/70 hover:text-white"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-white/40">
                {product.stock > 0 ? `${product.stock} disponíveis` : 'Sem estoque'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar de Compra ─────────────────────────── */}
      <div className="flex flex-col gap-5 lg:border-l lg:border-white/20 lg:pl-6">
        {/* Calcular frete */}
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-white/40" />
            <p className="text-xs font-semibold text-white/70">Calcular frete</p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && calculateShipping()}
                className="w-full rounded-xl border border-white/10 bg-transparent py-2 pr-3 pl-8 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none"
              />
            </div>
            <button
              onClick={() => calculateShipping()}
              disabled={shippingLoading}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {shippingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
            </button>
          </div>

          {shippingError && <p className="text-xs text-red-400">{shippingError}</p>}

          {shippingOptions.length > 0 &&
            (() => {
              const pac = shippingOptions.find((o) => o.name.toLowerCase().includes('pac'))
              if (!pac) return null
              const today = new Date()
              const minDate = formatDeliveryDate(addBusinessDays(today, Math.max(1, pac.days - 2)))
              const maxDate = formatDeliveryDate(addBusinessDays(today, pac.days))
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Chegará entre <span className="text-green-400">{minDate}</span> e{' '}
                      <span className="text-green-400">{maxDate}</span>
                    </p>
                    <p className="text-[11px] text-white/40">
                      {pac.price === 0 ? 'Grátis' : `por ${formatCurrency(pac.price)}`}
                    </p>
                  </div>
                </div>
              )
            })()}
        </div>

        {/* Botões de compra */}
        <div className="space-y-2">
          <button
            disabled={variantsLoading || !canAdd}
            onClick={handleBuyNow}
            className="w-full rounded-xl bg-[#4a9fd4] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {!canAdd
              ? variantsLoading
                ? 'Carregando...'
                : !hasVariants
                  ? 'Sem estoque'
                  : !selectedVariant
                    ? 'Selecione uma cor'
                    : isUniqueSize
                      ? 'Sem estoque'
                      : 'Selecione um tamanho'
              : 'Comprar agora'}
          </button>
          <button
            disabled={variantsLoading || !canAdd}
            onClick={handleAddToCart}
            className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/80 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Adicionar ao carrinho
          </button>
        </div>

        {/* Garantias */}
        <div className="space-y-3 pt-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="text-xs font-semibold text-white">Compra garantida</p>
              <p className="text-[11px] text-white/40">Receba o produto ou seu dinheiro de volta</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
            <div>
              <p className="text-xs font-semibold text-white">Devolução fácil</p>
              <p className="text-[11px] text-white/40">30 dias para devolver</p>
            </div>
          </div>
        </div>

        <Accordion title="Descrição &amp; Composição">
          <p className="text-sm leading-relaxed text-white/60">{product.description}</p>
        </Accordion>
      </div>
    </div>
  )
}
