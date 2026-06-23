'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import type { Product } from '@/features/products/types/product.types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-[#1a1a1a] transition-colors hover:bg-[#222]"
    >
      {/* Imagem */}
      <div className="relative overflow-hidden rounded-t-2xl bg-[#111]">
        <div className="relative aspect-square">
          <Image
            src={product.images[selectedImage] ?? product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>

        {discount && (
          <span className="absolute top-3 left-3 rounded-full bg-[#1565a0] px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleItem(product)
          }}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110"
          aria-label="Favoritar"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              wishlisted ? 'fill-red-500 text-red-500' : 'text-white/60'
            }`}
          />
        </button>

        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {product.images.length > 1 && (
        <div className="flex gap-2 px-3 pt-3 pb-2">
          {product.images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSelectedImage(i)
              }}
              className={`relative h-10 w-10 overflow-hidden rounded-lg border-2 bg-[#111] transition-all ${
                selectedImage === i
                  ? 'border-white/60'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="40px" />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
          {product.category.name}
        </p>
        <h3 className="mb-3 line-clamp-2 text-sm leading-snug font-bold text-white/80 group-hover:text-white">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-col">
          {product.originalPrice && (
            <span className="text-xs text-white/30 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
          <span className="text-lg font-extrabold text-white">{formatCurrency(product.price)}</span>
        </div>
      </div>
    </Link>
  )
}
