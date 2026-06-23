'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/features/cart/hooks/useCart'

export function CartItems() {
  const { items, removeItem, updateQuantity } = useCart()

  if (!items.length) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
          <ShoppingBag className="h-9 w-9 text-white/20" />
        </div>
        <p className="text-lg font-bold text-white">Seu carrinho está vazio</p>
        <p className="mt-1 mb-6 text-sm text-white/40">
          Adicione produtos para continuar comprando
        </p>
        <Link
          href="/search"
          className="rounded-xl bg-[#4a9fd4] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
        >
          Explorar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.product.id}
          className="flex gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4"
        >
          {/* Imagem */}
          <Link
            href={`/product/${item.product.id}`}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#111]"
          >
            <Image
              src={item.product.images[0]}
              alt={item.product.name}
              fill
              className="object-cover"
            />
          </Link>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/product/${item.product.id}`}
                className="line-clamp-2 text-sm leading-snug font-semibold text-white hover:text-white/80"
              >
                {item.product.name}
              </Link>
              <button
                onClick={() => removeItem(item.product.id)}
                className="shrink-0 rounded-lg p-1.5 text-white/20 transition-colors hover:bg-white/5 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              {/* Quantidade */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#111]">
                <button
                  className="rounded-l-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-20"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-white">
                  {item.quantity}
                </span>
                <button
                  className="rounded-r-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Preço */}
              <div className="text-right">
                {item.product.originalPrice && (
                  <p className="text-xs text-white/30 line-through">
                    {formatCurrency(item.product.originalPrice * item.quantity)}
                  </p>
                )}
                <p className="text-base font-bold text-white">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
