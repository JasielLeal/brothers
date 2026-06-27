'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import { formatCurrency } from '@/utils/formatCurrency'

export default function FavoritosPage() {
  const { items, removeItem, clear, isEmpty } = useWishlist()

  if (isEmpty) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <Heart className="h-9 w-9 text-white/20" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Nenhum favorito ainda</h1>
        <p className="mb-8 max-w-xs text-sm text-white/40">
          Toque no coração dos produtos para salvá-los aqui e encontrá-los facilmente depois.
        </p>
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
    <div className="mx-auto max-w-screen-xl px-6 py-10 lg:px-10">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-white/30 uppercase">
            Minha Lista
          </p>
          <h1 className="text-3xl font-bold text-white">Favoritos</h1>
          <p className="mt-1.5 text-sm text-white/40">
            {items.length} {items.length === 1 ? 'produto salvo' : 'produtos salvos'}
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/40 transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar tudo
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((product) => {
          const discount = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null
          const outOfStock = product.stock === 0

          return (
            <div
              key={product.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/4 transition-all hover:border-white/10 hover:bg-white/6"
            >
              {/* Imagem */}
              <Link href={`/product/${product.id}`} className="relative block overflow-hidden">
                <div className="relative aspect-[4/5] w-full bg-white/5">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className={`object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-40' : ''}`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-white/10" />
                    </div>
                  )}

                  {/* Overlay esgotado */}
                  {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/60 backdrop-blur-sm">
                        Esgotado
                      </span>
                    </div>
                  )}

                  {/* Badge desconto */}
                  {discount && !outOfStock && (
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-[#4a9fd4] px-2 py-0.5 text-[10px] font-bold text-white">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Hover overlay com "Ver produto" */}
                <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-xl bg-white/90 px-4 py-2 text-xs font-bold text-black backdrop-blur-sm">
                    Ver produto
                  </span>
                </div>
              </Link>

              {/* Remover */}
              <button
                type="button"
                onClick={() => removeItem(product.id)}
                className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:bg-red-500/80"
                aria-label="Remover dos favoritos"
              >
                <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
              </button>

              {/* Info */}
              <div className="flex flex-1 flex-col p-3">
                <p className="mb-0.5 text-[9px] font-semibold tracking-widest text-white/30 uppercase">
                  {product.category.name}
                </p>
                <Link href={`/product/${product.id}`}>
                  <h3 className="mb-2 line-clamp-2 text-xs leading-snug font-semibold text-white/80 hover:text-white">
                    {product.name}
                  </h3>
                </Link>
                <div className="mt-auto flex items-end gap-1.5">
                  {product.originalPrice && (
                    <span className="text-[10px] text-white/30 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                  <span
                    className={`text-sm font-extrabold ${outOfStock ? 'text-white/30' : 'text-white'}`}
                  >
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
