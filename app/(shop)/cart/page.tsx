import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carrinho',
}

import { CartItems } from '@/features/cart/components/CartItems'
import { CartSummary } from '@/features/cart/components/CartSummary'

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-6 py-8 lg:px-10">
      <h1 className="mb-8 text-2xl font-bold text-white">Meu Carrinho</h1>

      <div className="flex flex-1 flex-col gap-8 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="flex flex-1 flex-col lg:col-span-2">
          <CartItems />
        </div>
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
