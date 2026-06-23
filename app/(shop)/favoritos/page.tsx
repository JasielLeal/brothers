'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Trash2, ShoppingCart } from 'lucide-react'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import { useCart } from '@/features/cart/hooks/useCart'
import { formatCurrency } from '@/utils/formatCurrency'

export default function FavoritosPage() {
  const { items, removeItem, clear, isEmpty } = useWishlist()
  const { addItem } = useCart()

  if (isEmpty) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-screen-2xl flex-col items-center justify-center px-6 py-16 text-center lg:px-10">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
          <Heart className="h-12 w-12 text-red-300" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Nenhum favorito ainda</h1>
        <p className="mb-8 text-sm text-gray-400">
          Toque no coração dos produtos para salvá-los aqui.
        </p>
        <Link
          href="/"
          className="rounded-2xl bg-[#1565a0] px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
        >
          Explorar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favoritos</h1>
          <p className="mt-1 text-sm text-gray-400">
            {items.length} item{items.length !== 1 ? 's' : ''} salvos
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
          Limpar tudo
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((product) => {
          const discount = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null

          return (
            <div
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Imagem */}
              <Link
                href={`/product/${product.id}`}
                className="relative block overflow-hidden rounded-t-2xl bg-gray-50"
              >
                <div className="relative aspect-square">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                {discount && (
                  <span className="absolute top-3 left-3 rounded-full bg-[#1565a0] px-2 py-0.5 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                )}
                {/* Remover dos favoritos */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeItem(product.id)
                  }}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
                  aria-label="Remover dos favoritos"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>

                {product.stock === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900">
                      Indisponível
                    </span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                  {product.category.name}
                </p>
                <Link href={`/product/${product.id}`}>
                  <h3 className="mb-3 line-clamp-2 text-sm leading-snug font-bold text-gray-900 hover:text-[#1565a0]">
                    {product.name}
                  </h3>
                </Link>
                <div className="mt-auto mb-4 flex flex-col">
                  {product.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                  <span className="text-lg font-extrabold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={product.stock === 0}
                  onClick={() => addItem(product)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1565a0] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {product.stock === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
