'use client'

import { useState, useRef, useEffect } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import Image from 'next/image'
import {
  Loader2,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  X,
  ChevronRight,
  ChevronLeft,
  Package,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Printer,
  MessageCircle,
} from 'lucide-react'
import {
  useAdminOrders,
  useUpdateOrderStatus,
  useCreateOrder,
} from '@/features/orders/hooks/useOrders'
import { useProducts } from '@/features/products/hooks/useProducts'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import type {
  Order,
  OrderStatus,
  PaymentMethod,
  DeliveryType,
} from '@/features/orders/types/order.types'
import type { Product } from '@/features/products/types/product.types'

const PAGE_SIZE = 5

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  SHIPPED: {
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  DELIVERED: {
    label: 'Confirmado',
    bg: 'bg-green-50',
    text: 'text-green-600',
    dot: 'bg-green-500',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: 'bg-red-50',
    text: 'text-red-500',
    dot: 'bg-red-400',
    icon: XCircle,
  },
}

const FILTER_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'DELIVERED', label: 'Confirmados' },
  { key: 'CANCELLED', label: 'Cancelados' },
]

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  CASH: 'Dinheiro',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

/* ── New Order Modal ──────────────────────────────────────── */
interface CartItem {
  cartKey: string
  productId: string
  productName: string
  price: number
  quantity: number
  image?: string
  color?: string
  colorHex?: string
  size?: string
}

interface VariantInfo {
  id: string
  colorName: string
  colorHex?: string | null
  images: string[]
  sizes: { size: string; stock: number }[]
}

function makeCartKey(productId: string, color?: string, size?: string) {
  return `${productId}::${color ?? ''}::${size ?? ''}`
}

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('PICKUP')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [notes, setNotes] = useState('')

  // ── Variant picker ───────────────────────────────────────
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [variantsCache, setVariantsCache] = useState<Record<string, VariantInfo[]>>({})
  const [loadingVariants, setLoadingVariants] = useState<string | null>(null)
  const [pickedVariant, setPickedVariant] = useState<VariantInfo | null>(null)

  // ── Barcode lookup ───────────────────────────────────────
  const [barcodeHit, setBarcodeHit] = useState<{
    product: { id: string; name: string; price: number; stock: number; images: string[] }
    color: string
    colorHex: string | null
    image: string | null
    sizes: { size: string; stock: number }[]
  } | null>(null)
  const [barcodeChecking, setBarcodeChecking] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Barcode lookup effect — runs when debouncedSearch changes
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBarcodeHit(null)
      return
    }
    let cancelled = false
    setBarcodeChecking(true)
    fetch(`/api/products/barcode?code=${encodeURIComponent(debouncedSearch.trim())}`)
      .then(async (r) => {
        if (cancelled) return
        if (r.ok) {
          const d = await r.json()
          setBarcodeHit(d.data ?? d)
        } else {
          setBarcodeHit(null)
        }
      })
      .catch(() => {
        if (!cancelled) setBarcodeHit(null)
      })
      .finally(() => {
        if (!cancelled) setBarcodeChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  const { data: productsData, isLoading: loadingProducts } = useProducts({
    search: debouncedSearch || undefined,
    isActive: true,
    limit: 8,
  })
  const products = productsData?.data ?? []

  const { mutate: createOrder, isPending } = useCreateOrder()

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  function maskPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits.length ? `(${digits}` : ''
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const rawPhone = customerPhone.replace(/\D/g, '')
  const canSubmit =
    customerName.trim().length >= 3 &&
    rawPhone.length >= 10 &&
    cart.length > 0 &&
    (deliveryType === 'PICKUP' || street.trim().length > 0)

  async function handleProductClick(product: Product) {
    if (expandedProductId === product.id) {
      setExpandedProductId(null)
      setPickedVariant(null)
      return
    }
    setExpandedProductId(product.id)
    setPickedVariant(null)

    if (!variantsCache[product.id]) {
      setLoadingVariants(product.id)
      try {
        const res = await fetch(`/api/products/${product.id}/variants`)
        const d = await res.json()
        const list: VariantInfo[] = Array.isArray(d) ? d : (d.data ?? [])
        setVariantsCache((c) => ({ ...c, [product.id]: list }))
        if (list.length > 0) setPickedVariant(list[0])
      } finally {
        setLoadingVariants(null)
      }
    } else {
      const list = variantsCache[product.id]
      if (list.length > 0) setPickedVariant(list[0])
    }
  }

  function addToCartWithVariant(product: Product, variant: VariantInfo | null, size: string) {
    const color = variant?.colorName
    const colorHex = variant?.colorHex ?? undefined
    const image = variant?.images[0] ?? product.images[0]
    const cartKey = makeCartKey(product.id, color, size)

    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey)
      if (existing)
        return prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i))
      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          image,
          color,
          colorHex,
          size,
        },
      ]
    })
    setExpandedProductId(null)
    setPickedVariant(null)
  }

  function updateQty(cartKey: string, qty: number) {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.cartKey !== cartKey))
    else setCart((prev) => prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i)))
  }

  function handleSubmit() {
    if (!canSubmit) return
    createOrder(
      {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        deliveryType,
        items: cart.map(({ productId, productName, quantity, color, size }) => ({
          productId,
          productName,
          quantity,
          color: color ?? null,
          size: size ?? null,
        })),
        street: deliveryType === 'DELIVERY' ? street.trim() || null : null,
        city: deliveryType === 'DELIVERY' ? city.trim() || null : null,
        state: deliveryType === 'DELIVERY' ? uf.trim() || null : null,
        zipCode: deliveryType === 'DELIVERY' ? zipCode.trim() || null : null,
        notes: notes.trim() || null,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4A6CF7]/10">
              <ShoppingCart className="h-4 w-4 text-[#4A6CF7]" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Novo Pedido</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted rounded-md p-1.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_1px_1fr] lg:overflow-hidden">
          {/* LEFT — produtos + carrinho */}
          <div className="flex flex-col overflow-hidden">
            {/* Busca */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produto ou digitar barcode..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 py-2 pr-4 pl-9 text-sm text-gray-700 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Resultados */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {/* Barcode hit banner */}
              {barcodeHit && (
                <div className="mb-2 space-y-2 rounded-xl border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {barcodeHit.image && (
                        <Image
                          src={barcodeHit.image}
                          alt={barcodeHit.product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-green-800">
                        {barcodeHit.product.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        {barcodeHit.colorHex && (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-green-300"
                            style={{ backgroundColor: barcodeHit.colorHex }}
                          />
                        )}
                        {barcodeHit.color} — selecione o tamanho:
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBarcodeHit(null)
                        setSearch('')
                      }}
                      className="text-green-400 hover:text-green-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {barcodeHit.sizes
                      .filter((s) => s.stock > 0)
                      .map((s) => (
                        <button
                          key={s.size}
                          type="button"
                          onClick={() => {
                            const hit = barcodeHit
                            const cartKey = makeCartKey(hit.product.id, hit.color, s.size)
                            setCart((prev) => {
                              const existing = prev.find((i) => i.cartKey === cartKey)
                              if (existing)
                                return prev.map((i) =>
                                  i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
                                )
                              return [
                                ...prev,
                                {
                                  cartKey,
                                  productId: hit.product.id,
                                  productName: hit.product.name,
                                  price: hit.product.price,
                                  quantity: 1,
                                  image: hit.image ?? undefined,
                                  color: hit.color,
                                  colorHex: hit.colorHex ?? undefined,
                                  size: s.size,
                                },
                              ]
                            })
                            setSearch('')
                            setBarcodeHit(null)
                          }}
                          className="flex items-center gap-1 rounded-lg border border-green-300 bg-white px-2.5 py-1 text-xs font-bold text-green-700 transition-colors hover:bg-green-600 hover:text-white"
                        >
                          {s.size} <span className="opacity-60">({s.stock})</span>
                        </button>
                      ))}
                    {barcodeHit.sizes.every((s) => s.stock === 0) && (
                      <p className="text-xs text-red-500">Sem estoque disponível</p>
                    )}
                  </div>
                </div>
              )}

              {barcodeChecking ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : loadingProducts ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : products.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  {search ? 'Nenhum produto encontrado.' : 'Digite para buscar produtos.'}
                </p>
              ) : (
                <div className="space-y-1.5 pb-2">
                  {products.map((p) => {
                    const inCart = cart.filter((i) => i.productId === p.id)
                    const totalQty = inCart.reduce((s, i) => s + i.quantity, 0)
                    const isExpanded = expandedProductId === p.id
                    const pVariants = variantsCache[p.id] ?? []
                    const availSizes = pickedVariant
                      ? pickedVariant.sizes.filter((s) => s.stock > 0)
                      : []

                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl border transition-colors ${isExpanded ? 'border-[#4A6CF7]/40 bg-[#4A6CF7]/3' : 'border-gray-100 bg-white'}`}
                      >
                        {/* Product row */}
                        <button
                          type="button"
                          onClick={() => handleProductClick(p)}
                          className="flex w-full items-center gap-3 p-2.5 text-left"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {p.images[0] && (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">
                              {formatCurrency(p.price)} · Estoque: {p.stock}
                            </p>
                          </div>
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${totalQty > 0 ? 'bg-[#4A6CF7] text-white' : 'bg-gray-100 text-gray-400'}`}
                          >
                            {totalQty > 0 ? totalQty : <Plus className="h-3 w-3" />}
                          </div>
                        </button>

                        {/* Inline variant picker */}
                        {isExpanded && (
                          <div className="space-y-2 border-t border-[#4A6CF7]/10 px-3 pt-2 pb-3">
                            {loadingVariants === p.id ? (
                              <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                              </div>
                            ) : pVariants.length === 0 ? (
                              <p className="py-1 text-center text-xs text-gray-400">
                                Sem variantes — produto sem cor/tamanho
                              </p>
                            ) : (
                              <>
                                {/* Cores */}
                                <div className="flex flex-wrap gap-1.5">
                                  {pVariants.map((v) => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => setPickedVariant(v)}
                                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-all ${pickedVariant?.id === v.id ? 'border-[#4A6CF7] bg-[#4A6CF7]/10 text-[#4A6CF7]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                                    >
                                      <div
                                        className="h-2.5 w-2.5 rounded-full border border-gray-300"
                                        style={{ backgroundColor: v.colorHex ?? '#888' }}
                                      />
                                      {v.colorName}
                                    </button>
                                  ))}
                                </div>

                                {/* Tamanhos */}
                                {pickedVariant && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {availSizes.length > 0 ? (
                                      availSizes.map((s) => (
                                        <button
                                          key={s.size}
                                          type="button"
                                          onClick={() =>
                                            addToCartWithVariant(p, pickedVariant, s.size)
                                          }
                                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 transition-all hover:border-[#4A6CF7] hover:bg-[#4A6CF7] hover:text-white"
                                        >
                                          {s.size} <span className="opacity-50">({s.stock})</span>
                                        </button>
                                      ))
                                    ) : (
                                      <p className="text-xs text-red-400">
                                        Sem estoque para esta cor
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Carrinho */}
              {cart.length > 0 && (
                <div className="mt-3 mb-2">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Itens no pedido
                  </p>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.cartKey}
                        className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5"
                      >
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-gray-800">
                            {item.productName}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            <p className="text-xs text-gray-400">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                            {item.color && (
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                {item.colorHex && (
                                  <span
                                    className="inline-block h-2 w-2 rounded-full border border-gray-300"
                                    style={{ backgroundColor: item.colorHex }}
                                  />
                                )}
                                {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="rounded border border-gray-200 px-1 text-[10px] font-bold text-gray-500">
                                {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item.cartKey, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-semibold text-gray-700">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.cartKey, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden bg-gray-100 lg:block" />

          {/* RIGHT — dados do cliente */}
          <div className="space-y-4 overflow-y-auto p-4">
            {/* Cliente */}
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Cliente
              </p>
              <div className="space-y-2">
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Pagamento */}
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Pagamento
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${paymentMethod === m ? 'border-[#4A6CF7] bg-[#4A6CF7]/10 text-[#4A6CF7]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}
                  >
                    {PAYMENT_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Entrega */}
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Tipo de entrega
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['PICKUP', 'DELIVERY'] as DeliveryType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDeliveryType(t)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${deliveryType === t ? 'border-[#4A6CF7] bg-[#4A6CF7]/10 text-[#4A6CF7]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}
                  >
                    {t === 'PICKUP' ? 'Retirada na loja' : 'Entrega'}
                  </button>
                ))}
              </div>
            </div>

            {/* Endereço (só se DELIVERY) */}
            {deliveryType === 'DELIVERY' && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Endereço de entrega
                </p>
                <div className="space-y-2">
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua, número, bairro *"
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cidade"
                      className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                    />
                    <input
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      placeholder="UF"
                      className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                    />
                  </div>
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="CEP"
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Observações
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Opcional"
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div>
            <p className="text-xs text-gray-400">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </p>
            <p className="text-lg font-bold text-[#4A6CF7]">{formatCurrency(total)}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="flex items-center gap-2 rounded-xl bg-[#4A6CF7] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Print Receipt ───────────────────────────────────────── */
function printReceipt(order: Order) {
  const PAYMENT_LABELS: Record<string, string> = {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    CASH: 'Dinheiro',
  }
  const address = order.street
    ? `${order.street}${order.city ? `, ${order.city}` : ''}${order.state ? ` — ${order.state}` : ''}${order.zipCode ? `, ${order.zipCode}` : ''}`
    : 'Retirada na loja'

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const createdAt = new Date(order.createdAt)
  const dateStr = createdAt.toLocaleDateString('pt-BR')
  const timeStr = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = order.discountAmount ?? 0
  const docNum = order.id.slice(-6).toUpperCase()
  const logoUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png`

  const itemRows = order.items
    .map(
      (item, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f9f9'}">
      <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px">${String(idx + 1).padStart(3, '0')}</td>
      <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px">${item.productName}</td>
      <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:center">UN</td>
      <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:center">${item.quantity}</td>
      <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:right">${fmt(item.price)}</td>
      <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:right;font-weight:600">${fmt(item.price * item.quantity)}</td>
    </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Comprovante Nº ${docNum} — Brothers Outlet</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
    .page { max-width: 900px; margin: 0 auto; padding: 16px; }
    .label { font-size: 9px; color: #555; text-transform: uppercase; display: block; margin-bottom: 1px; }
    .value { font-size: 11px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    .section-title { font-size: 11px; font-weight: 700; background: #f0f0f0; border: 1px solid #ccc; padding: 4px 8px; margin-top: 8px; }
    @media print {
      body { margin: 0; }
      .page { padding: 8px; }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- TOPO: aviso de recebimento -->
  <table style="border:1px solid #333;margin-bottom:8px">
    <tr>
      <td style="padding:6px 10px;font-size:10px;border-right:1px solid #333;width:75%">
        RECEBEMOS OS PRODUTOS/SERVIÇOS CONSTANTES DO COMPROVANTE INDICADO AO LADO
        <br/><br/>
        <table style="width:100%">
          <tr>
            <td style="font-size:9px;color:#555;width:140px">Data de recebimento</td>
            <td style="font-size:9px;color:#555">Identificação e assinatura do recebedor</td>
          </tr>
        </table>
      </td>
      <td style="padding:6px 10px;text-align:center;vertical-align:middle">
        <div style="font-size:10px;font-weight:700">Comprovante</div>
        <div style="font-size:18px;font-weight:900">Nº ${docNum}</div>
        <div style="font-size:10px;color:#555">${dateStr}</div>
      </td>
    </tr>
  </table>

  <!-- CABEÇALHO -->
  <table style="border:1px solid #333;margin-bottom:8px">
    <tr>
      <!-- Logo + loja -->
      <td style="padding:12px 16px;border-right:1px solid #ccc;width:240px;vertical-align:middle">
        <img src="${logoUrl}" style="height:60px;object-fit:contain;display:block;margin-bottom:8px" onerror="this.style.display='none'" />
        <div style="font-size:14px;font-weight:900;letter-spacing:1px">BROTHERS OUTLET</div>
        <div style="font-size:10px;color:#555">brothersoutlet.com.br</div>
      </td>
      <!-- Título do documento -->
      <td style="padding:12px 16px;border-right:1px solid #ccc;text-align:center;vertical-align:middle;width:240px">
        <div style="font-size:18px;font-weight:900;margin-bottom:4px">COMPROVANTE DE PEDIDO</div>
        <div style="font-size:10px;color:#555;margin-bottom:10px">Documento de compra — Brothers Outlet</div>
        <div style="font-size:13px;font-weight:700">Nº ${docNum}</div>
        <div style="font-size:10px;color:#555">Página: 1 de 1</div>
      </td>
      <!-- Info resumida -->
      <td style="padding:12px 16px;vertical-align:middle">
        <div style="margin-bottom:8px">
          <span class="label">Data do pedido</span>
          <span class="value">${dateStr} às ${timeStr}</span>
        </div>
        <div style="margin-bottom:8px">
          <span class="label">Forma de pagamento</span>
          <span class="value">${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
        </div>
        <div>
          <span class="label">Tipo de entrega</span>
          <span class="value">${order.deliveryType === 'DELIVERY' ? 'Entrega em domicílio' : 'Retirada na loja'}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- NATUREZA DA OPERAÇÃO -->
  <table style="border:1px solid #ccc;margin-bottom:2px">
    <tr>
      <td style="padding:4px 8px;border-right:1px solid #ccc;width:50%">
        <span class="label">Natureza da operação</span>
        <span class="value">Venda de mercadorias</span>
      </td>
      <td style="padding:4px 8px">
        <span class="label">Número do pedido</span>
        <span class="value" style="font-family:monospace">${order.id.toUpperCase()}</span>
      </td>
    </tr>
  </table>

  <!-- DESTINATÁRIO -->
  <div class="section-title">Dados do Cliente</div>
  <table style="border:1px solid #ccc;margin-bottom:2px">
    <tr>
      <td style="padding:4px 8px;border-right:1px solid #ccc;width:50%;border-bottom:1px solid #ccc">
        <span class="label">Nome completo</span>
        <span class="value">${order.customerName}</span>
      </td>
      <td style="padding:4px 8px;border-right:1px solid #ccc;border-bottom:1px solid #ccc;width:25%">
        <span class="label">Telefone</span>
        <span class="value">${order.customerPhone}</span>
      </td>
      <td style="padding:4px 8px;border-right:1px solid #ccc;border-bottom:1px solid #ccc;width:15%">
        <span class="label">Data emissão</span>
        <span class="value">${dateStr}</span>
      </td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;width:10%">
        <span class="label">Hora</span>
        <span class="value">${timeStr}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:4px 8px;border-right:1px solid #ccc" colspan="2">
        <span class="label">Endereço de entrega</span>
        <span class="value">${address}</span>
      </td>
      <td style="padding:4px 8px;border-right:1px solid #ccc">
        <span class="label">Forma de pagamento</span>
        <span class="value">${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
      </td>
      <td style="padding:4px 8px">
        ${order.couponCode ? `<span class="label">Cupom aplicado</span><span class="value" style="color:#16a34a">${order.couponCode}</span>` : ''}
      </td>
    </tr>
  </table>

  <!-- ITENS -->
  <div class="section-title">Itens do Pedido</div>
  <table style="border:1px solid #ccc;margin-bottom:2px">
    <thead>
      <tr style="background:#f0f0f0">
        <th style="padding:5px 6px;border:1px solid #ccc;font-size:10px;text-align:left;width:40px">Cód.</th>
        <th style="padding:5px 6px;border:1px solid #ccc;font-size:10px;text-align:left">Descrição do produto</th>
        <th style="padding:5px 6px;border:1px solid #ccc;font-size:10px;text-align:center;width:40px">UN</th>
        <th style="padding:5px 6px;border:1px solid #ccc;font-size:10px;text-align:center;width:50px">Qtde</th>
        <th style="padding:5px 6px;border:1px solid #ccc;font-size:10px;text-align:right;width:100px">Preço un.</th>
        <th style="padding:5px 6px;border:1px solid #ccc;font-size:10px;text-align:right;width:110px">Preço total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- TOTAIS -->
  <div class="section-title">Resumo Financeiro</div>
  <table style="border:1px solid #ccc;margin-bottom:2px">
    <tr>
      <td style="padding:5px 10px;border-right:1px solid #ccc;width:25%">
        <span class="label">Subtotal dos produtos</span>
        <span class="value">${fmt(subtotal)}</span>
      </td>
      ${
        (order.shippingCost ?? 0) > 0
          ? `<td style="padding:5px 10px;border-right:1px solid #ccc;width:25%">
        <span class="label">Frete${order.shippingService ? ` — ${order.shippingService}` : ''}</span>
        <span class="value">+ ${fmt(order.shippingCost ?? 0)}</span>
      </td>`
          : `<td style="padding:5px 10px;border-right:1px solid #ccc;width:25%">
        <span class="label">Frete</span>
        <span class="value">Grátis</span>
      </td>`
      }
      ${
        discount > 0
          ? `<td style="padding:5px 10px;border-right:1px solid #ccc;width:25%">
        <span class="label">Desconto — cupom ${order.couponCode}</span>
        <span class="value" style="color:#16a34a">- ${fmt(discount)}</span>
      </td>`
          : `<td style="padding:5px 10px;border-right:1px solid #ccc;width:25%">
        <span class="label">Desconto</span>
        <span class="value">—</span>
      </td>`
      }
      <td style="padding:5px 10px;background:#f5f5f5">
        <span class="label">Valor total pago</span>
        <span style="font-size:15px;font-weight:900">${fmt(order.total)}</span>
      </td>
    </tr>
  </table>

  <!-- OBSERVAÇÕES -->
  <div class="section-title">Observações</div>
  <table style="border:1px solid #ccc;margin-bottom:16px">
    <tr>
      <td style="padding:8px 10px;vertical-align:top">
        <div style="font-size:11px">
          Pedido confirmado em ${dateStr} às ${timeStr}.<br/>
          Este comprovante não possui valor fiscal. Para fins de garantia, guarde este documento.<br/>
          Em caso de dúvidas, entre em contato pelo site: brothersoutlet.com.br
        </div>
      </td>
    </tr>
  </table>

  <!-- RODAPÉ -->
  <div style="text-align:center;font-size:9px;color:#888;border-top:1px solid #eee;padding-top:8px">
    Brothers Outlet — brothersoutlet.com.br &nbsp;|&nbsp; ${dateStr} ${timeStr}
    &nbsp;&nbsp;<span style="font-weight:600">Obrigado pela preferência!</span>
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=980,height=800')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

/* ── Order Drawer ─────────────────────────────────────────── */
function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus()

  const canConfirm = order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
  const canCancel = order.status !== 'CANCELLED'

  function handleConfirm() {
    updateStatus({ id: order.id, status: 'DELIVERED' }, { onSuccess: onClose })
  }

  function handleCancel() {
    updateStatus({ id: order.id, status: 'CANCELLED' }, { onSuccess: onClose })
  }

  const address = order.street
    ? `${order.street}${order.city ? `, ${order.city}` : ''}${order.state ? ` — ${order.state}` : ''}${order.zipCode ? `, ${order.zipCode}` : ''}`
    : 'Retirada na loja'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4A6CF7]/10">
              <Package className="h-4 w-4 text-[#4A6CF7]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Cliente
            </p>
            <p className="text-sm font-semibold text-gray-800">{order.customerName}</p>
            <p className="text-xs text-gray-500">{order.customerPhone}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Status
            </p>
            <StatusBadge status={order.status} />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Itens do pedido
            </p>
            <div className="divide-y divide-gray-50 rounded-xl bg-gray-50/70">
              {order.items.map((item, i) => {
                const img = item.product?.images?.[0]
                return (
                  <div key={item.id ?? i} className="flex items-center gap-3 px-3 py-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                      {img && (
                        <Image
                          src={img}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {item.productName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-400">
                          Qtd: {item.quantity} · {formatCurrency(item.price)} un.
                        </span>
                        {item.color && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-bold text-gray-600">
                            {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5 rounded-xl bg-[#4A6CF7]/5 px-4 py-3">
            {(() => {
              const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
              const shipping = order.shippingCost ?? 0
              const discount = order.discountAmount ?? 0
              const hasBreakdown = discount > 0 || shipping > 0
              return (
                <>
                  {hasBreakdown && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">{formatCurrency(subtotal)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Frete{order.shippingService ? ` · ${order.shippingService}` : ''}
                      </span>
                      <span className="text-gray-700">{formatCurrency(shipping)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Desconto{order.couponCode ? ` (${order.couponCode})` : ''}
                      </span>
                      <span className="font-medium text-green-600">
                        −{formatCurrency(discount)}
                      </span>
                    </div>
                  )}
                  {hasBreakdown && <div className="h-px bg-[#4A6CF7]/10" />}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Total</p>
                    <p className="text-base font-bold text-[#4A6CF7]">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Endereço
            </p>
            <div className="flex items-start gap-2 rounded-xl bg-gray-50/70 px-4 py-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">Última atualização: {formatDate(order.updatedAt)}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4">
          {order.status === 'DELIVERED' && (
            <button
              onClick={() => printReceipt(order)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Printer className="h-4 w-4" />
              Imprimir nota fiscal
            </button>
          )}
          {canConfirm && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4A6CF7] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5] disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirmar pedido
              </button>
              <a
                href={(() => {
                  const id = `#${order.id.slice(0, 8).toUpperCase()}`
                  const itemLines = order.items
                    .map(
                      (i) =>
                        `  • ${i.productName} x ${i.quantity} - ${formatCurrency(i.price * i.quantity)}`
                    )
                    .join('\n')
                  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
                  const payment =
                    PAYMENT_LABELS[order.paymentMethod as PaymentMethod] ?? order.paymentMethod
                  const delivery =
                    order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada na loja'
                  const address = order.street
                    ? `${order.street}${order.city ? `, ${order.city}` : ''}${order.state ? ` — ${order.state}` : ''}${order.zipCode ? `, ${order.zipCode}` : ''}`
                    : ''
                  const addressLine =
                    order.deliveryType === 'DELIVERY' && address ? `*Endereço:* ${address}\n` : ''
                  const discountLine =
                    order.discountAmount > 0
                      ? `Desconto${order.couponCode ? ` (${order.couponCode})` : ''}: -${formatCurrency(order.discountAmount)}\n`
                      : ''
                  const subtotalLine =
                    subtotal !== order.total
                      ? `Subtotal: ${formatCurrency(subtotal)}\n${discountLine}`
                      : ''
                  const msg =
                    `Olá, ${order.customerName}!\n\n` +
                    `Seu pedido *${id}* foi recebido na *Brothers Outlet*.\n\n` +
                    `*Itens do pedido:*\n${itemLines}\n\n` +
                    `*Pagamento:* ${payment}\n` +
                    `*Entrega:* ${delivery}\n` +
                    `${addressLine}` +
                    `${subtotalLine}` +
                    `*Total: ${formatCurrency(order.total)}*\n\n` +
                    `Em breve entraremos em contato para confirmar. Obrigado!`
                  return `https://wa.me/55${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
                })()}
                target="_blank"
                rel="noopener noreferrer"
                title="Contatar no WhatsApp"
                className="flex items-center justify-center rounded-xl bg-[#25D366] px-3 py-2.5 text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Stats Carousel ───────────────────────────────────────── */
function StatsCarousel({ stats }: { stats: { label: string; value: number; accent: string }[] }) {
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
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
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
            className={`h-1.5 rounded-full transition-all duration-300 ${dot === i ? 'w-4 bg-[#4A6CF7]' : 'w-1.5 bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)

  const { data, isLoading } = useAdminOrders({
    status: activeFilter === 'all' ? undefined : activeFilter,
    page,
    limit: PAGE_SIZE,
  })

  const orders = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const { data: allData } = useAdminOrders({ limit: 1000 })
  const allOrders = allData?.data ?? []

  const pending = allOrders.filter((o) => o.status === 'PENDING').length
  const delivered = allOrders.filter((o) => o.status === 'DELIVERED').length

  const stats = [
    { label: 'Total de Pedidos', value: allData?.total ?? 0, accent: '#4A6CF7' },
    { label: 'Pendentes', value: pending, accent: '#F5A623' },
    { label: 'Entregues', value: delivered, accent: '#22C55E' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <h1 className="text-xl font-bold text-gray-800">Pedidos</h1>
        </div>
        <button
          onClick={() => setIsNewOrderOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5]"
        >
          <Plus className="h-4 w-4" />
          Novo pedido
        </button>
      </div>

      <div className="lg:hidden">
        <StatsCarousel stats={stats} />
      </div>
      <div className="hidden grid-cols-3 gap-4 lg:grid">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
            <div className="mt-3 h-1 w-10 rounded-full" style={{ backgroundColor: s.accent }} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 p-4 sm:flex sm:flex-wrap sm:gap-2">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? (allData?.total ?? 0)
                : allOrders.filter((o) => o.status === tab.key).length
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveFilter(tab.key)
                  setPage(1)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${isActive ? 'bg-[#4A6CF7] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Nenhum pedido encontrado.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const address = order.street
                  ? `${order.city ?? ''} — ${order.state ?? ''}`
                  : 'Retirada na loja'
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group w-full px-6 py-4 text-left transition-colors hover:bg-gray-50/60"
                  >
                    <div className="space-y-2 lg:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4A6CF7]/10">
                            <ShoppingBag className="h-3.5 w-3.5 text-[#4A6CF7]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {order.customerName}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={order.status} />
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, i) => (
                          <span
                            key={item.id ?? i}
                            className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500"
                          >
                            {item.productName}{' '}
                            <span className="text-gray-400">×{item.quantity}</span>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 text-gray-300" />
                        <p className="text-[11px] text-gray-400">{address}</p>
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4A6CF7]/10">
                            <ShoppingBag className="h-4 w-4 text-[#4A6CF7]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(order.total)}
                            </p>
                            {(order.shippingCost ?? 0) > 0 && (
                              <p className="text-[11px] text-gray-400">
                                frete: {formatCurrency(order.shippingCost!)}
                              </p>
                            )}
                            {order.couponCode && (
                              <p className="text-[11px] text-green-600">
                                cupom: {order.couponCode}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={order.status} />
                          <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 pl-12">
                        {order.items.map((item, i) => (
                          <div
                            key={item.id ?? i}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex flex-wrap items-center gap-1 text-gray-500">
                              {item.productName}
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-400">
                                ×{item.quantity}
                              </span>
                              {item.color && (
                                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                                  {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span className="rounded border border-gray-200 px-1 py-0.5 text-[10px] font-bold text-gray-500">
                                  {item.size}
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-gray-700">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 pl-12">
                        <MapPin className="h-3 w-3 shrink-0 text-gray-300" />
                        <p className="text-xs text-gray-400">{address}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <p className="text-xs text-gray-400">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}{' '}
                  pedidos
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-[#4A6CF7] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {isNewOrderOpen && <NewOrderModal onClose={() => setIsNewOrderOpen(false)} />}
    </div>
  )
}
