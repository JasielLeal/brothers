'use client'

import { use } from 'react'
import { useProduct } from '@/features/products/hooks/useProducts'
import { ProductDetails } from '@/features/products/components/ProductDetails'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params)
  const { data: product, isLoading, error } = useProduct(id)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-center px-4 py-16">
        <p className="text-lg font-medium text-white/40">Produto não encontrado</p>
        <Link href="/" className="mt-4 text-sm text-[#4a9fd4] hover:underline">
          Voltar à loja
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 px-4 py-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-white/40 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

      <ProductDetails product={product} />
    </div>
  )
}
