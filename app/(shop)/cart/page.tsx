'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { CartItems } from '@/features/cart/components/CartItems'
import { CartSummary } from '@/features/cart/components/CartSummary'
import { useCart } from '@/features/cart/hooks/useCart'

export default function CartPage() {
  const { items } = useCart()

  if (!items.length) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
          <ShoppingBag className="h-9 w-9 text-white/20" />
        </div>
        <p className="mb-1 text-xl font-bold text-white">Seu carrinho está vazio</p>
        <p className="mb-8 text-sm text-white/40">Adicione produtos para continuar comprando</p>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-bold text-black transition-opacity hover:opacity-80"
        >
          Explorar produtos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-10 lg:px-10">
      <h1 className="mb-8 text-2xl font-bold text-white">Meu Carrinho</h1>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <CartItems />
        </div>
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
