'use client'

import Link from 'next/link'
import { Truck } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/features/cart/hooks/useCart'

const FREE_SHIPPING_THRESHOLD = 299

export function CartSummary() {
  const { items, total, itemCount, isEmpty } = useCart()

  if (isEmpty) return null

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 29.9
  const finalTotal = total + shipping
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
      <h2 className="mb-5 text-base font-bold text-white">Resumo do pedido</h2>

      {/* Frete grátis progress */}
      <div className="mb-5 rounded-xl border border-white/10 bg-[#111] p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <Truck
            className={`h-4 w-4 shrink-0 ${shipping === 0 ? 'text-green-400' : 'text-white/30'}`}
          />
          <p className="text-xs text-white/50">
            {shipping === 0 ? (
              <span className="font-semibold text-green-400">Frete grátis desbloqueado!</span>
            ) : (
              <>
                Faltam <span className="font-semibold text-white">{formatCurrency(remaining)}</span>{' '}
                para frete grátis
              </>
            )}
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#4a9fd4] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Valores */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/50">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
          </span>
          <span className="text-white">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Frete</span>
          <span className={shipping === 0 ? 'font-semibold text-green-400' : 'text-white'}>
            {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
          </span>
        </div>

        <div className="my-1 border-t border-white/10" />

        <div className="flex justify-between">
          <span className="font-bold text-white">Total</span>
          <span className="text-xl font-black text-white">{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Botões */}
      <div className="mt-6 space-y-2">
        {isEmpty ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-white/10 py-3.5 text-sm font-bold text-white/30"
          >
            Finalizar compra
          </button>
        ) : (
          <Link
            href="/checkout"
            className="block w-full rounded-xl bg-[#4a9fd4] py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-80"
          >
            Finalizar compra
          </Link>
        )}
        <Link
          href="/search"
          className="block w-full rounded-xl border border-white/10 py-2.5 text-center text-sm font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  )
}
