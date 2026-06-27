import type { Product } from '@/features/products/types/product.types'

export interface CartItem {
  cartKey: string
  product: Product
  quantity: number
  size?: string
  color?: string
  colorHex?: string
  image?: string
}

export interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}
