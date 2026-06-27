'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/features/cart/hooks/useCart'

export function CartItems() {
  const { items, removeItem, updateQuantity } = useCart()

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const displayImage = item.image ?? item.product.images[0]
        return (
          <div
            key={item.cartKey}
            className="flex gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4"
          >
            {/* Imagem */}
            <Link
              href={`/product/${item.product.id}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#111]"
            >
              <Image src={displayImage} alt={item.product.name} fill className="object-cover" />
            </Link>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/product/${item.product.id}`}
                    className="line-clamp-2 text-sm leading-snug font-semibold text-white hover:text-white/80"
                  >
                    {item.product.name}
                  </Link>
                  {/* Cor + Tamanho */}
                  {(item.color || item.size) && (
                    <div className="mt-1 flex items-center gap-2">
                      {item.color && (
                        <div className="flex items-center gap-1">
                          {item.colorHex && (
                            <div
                              className="h-3 w-3 rounded-full border border-white/20"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <span className="text-xs text-white/40">{item.color}</span>
                        </div>
                      )}
                      {item.color && item.size && <span className="text-white/20">·</span>}
                      {item.size && (
                        <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white/50">
                          {item.size}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.cartKey)}
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
                    onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    className="rounded-r-xl p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                    onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
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
        )
      })}
    </div>
  )
}
