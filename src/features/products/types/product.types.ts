export interface Category {
  id: string
  name: string
  slug: string
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
  images: string[]
  categoryId: string
  stock: number
  isActive: boolean
  isFeatured: boolean
}
