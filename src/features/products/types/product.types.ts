export const CLOTHING_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG'] as const
export const SHOE_SIZES = [
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
] as const
export const UNIQUE_SIZES = ['Único'] as const

export type SizeSetType = 'CLOTHING' | 'SHOE' | 'UNIQUE'

export const SIZE_SETS: Record<SizeSetType, readonly string[]> = {
  CLOTHING: CLOTHING_SIZES,
  SHOE: SHOE_SIZES,
  UNIQUE: UNIQUE_SIZES,
}

export const SIZE_SET_LABELS: Record<SizeSetType, string> = {
  CLOTHING: 'Roupa',
  SHOE: 'Calçado',
  UNIQUE: 'Só cor',
}

/** @deprecated use SIZE_SETS.CLOTHING */
export const SIZES = CLOTHING_SIZES
export type SizeLabel = string

export interface VariantSizeStock {
  id: string
  size: SizeLabel
  stock: number
}

export interface ProductVariant {
  id: string
  productId: string
  colorName: string
  colorHex?: string | null
  images: string[]
  barcode?: string | null
  sizes: VariantSizeStock[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  hasVariants: boolean
  sizeSet: SizeSetType
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface ProductType {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number | null
  images: string[]
  categoryId: string
  category: Category
  stock: number
  rating: number
  reviewsCount: number
  barcode?: string | null
  brandId?: string | null
  brand?: Brand | null
  typeId?: string | null
  type?: ProductType | null
  costPrice?: number | null
  marginPercent?: number | null
  supplierId?: string | null
  supplier?: { id: string; name: string } | null
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface NavCategory {
  id: string
  name: string
  slug: string
  brands: { id: string; name: string; slug: string }[]
  types: { id: string; name: string; slug: string }[]
}

export interface PopularCategory {
  id: string
  name: string
  slug: string
  count: number
  image: string | null
}

export interface DealProduct {
  id: string
  name: string
  slug: string
  price: number
  originalPrice: number
  stock: number
  images: string[]
}

export interface ProductFilters {
  search?: string
  categoryId?: string
  brandId?: string
  typeId?: string
  minPrice?: number
  maxPrice?: number
  isFeatured?: boolean
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ProductInput {
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number | null
  brandId?: string | null
  typeId?: string | null
  costPrice?: number | null
  marginPercent?: number | null
  supplierId?: string | null
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  images: string[]
  categoryId: string
  stock: number
  isActive: boolean
  isFeatured: boolean
}
