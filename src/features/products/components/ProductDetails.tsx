'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCart } from '@/features/cart/hooks/useCart'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import type { Product } from '@/features/products/types/product.types'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

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

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('M')
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const { addItem } = useCart()
  const router = useRouter()

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ── Galeria ───────────────────────────────────── */}
      <div className="flex gap-3">
        {/* Miniaturas empilhadas à esquerda */}
        {product.images.length > 1 && (
          <div className="flex flex-col gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  i === selectedImageIndex
                    ? 'border-white'
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Imagem principal */}
        <div
          className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#111]"
          style={{ aspectRatio: '1/1' }}
        >
          <Image
            src={product.images[selectedImageIndex]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {discount && (
            <span className="absolute top-3 left-3 rounded-full bg-[#4a9fd4] px-2.5 py-0.5 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* ── Info ──────────────────────────────────────── */}
      <div className="flex flex-col">
        {/* Categoria */}
        <p className="mb-1 text-xs font-semibold tracking-widest text-white/40 uppercase">
          {product.category.name}
        </p>

        {/* Nome */}
        <h1 className="mb-4 text-2xl leading-tight font-bold text-white">{product.name}</h1>

        {/* Preço */}
        <div className="mb-4">
          {product.originalPrice && (
            <p className="text-sm text-white/40 line-through">
              {formatCurrency(product.originalPrice)}
            </p>
          )}
          <p className="text-3xl font-extrabold text-white">{formatCurrency(product.price)}</p>
        </div>

        {/* Tamanho */}
        <div className="mb-6">
          <p className="mb-2.5 text-sm font-semibold text-white">
            Tamanho: <span className="font-normal text-white/50">{selectedSize}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
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
        </div>

        {/* Botões */}
        <div className="mb-6 flex gap-3">
          <button
            disabled={product.stock === 0}
            onClick={() => {
              addItem(product)
              router.push('/cart')
            }}
            className="flex-1 rounded-2xl bg-[#4a9fd4] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {product.stock === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}
          </button>
          <button
            type="button"
            onClick={() => toggleItem(product)}
            className="flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a1a] transition-colors hover:border-white/20"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                wishlisted ? 'fill-red-500 text-red-500' : 'text-white/30'
              }`}
            />
          </button>
        </div>

        {/* Acordeão: Descrição */}
        <Accordion title="Descrição &amp; Composição">
          <p className="text-sm leading-relaxed text-white/60">{product.description}</p>
        </Accordion>
      </div>
    </div>
  )
}
