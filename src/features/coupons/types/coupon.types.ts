export type CouponType = 'PERCENTAGE' | 'FIXED'

export interface CouponProductRef {
  productId: string
  product?: {
    id: string
    name: string
    images: string[]
    price: number
  }
}

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrderValue?: number | null
  minQuantity?: number | null
  maxUses?: number | null
  usedCount: number
  expiresAt?: string | null
  isActive: boolean
  products: CouponProductRef[]
  createdAt: string
  updatedAt: string
}

export interface CreateCouponPayload {
  code: string
  type: CouponType
  value: number
  minOrderValue?: number | null
  maxUses?: number | null
  expiresAt?: string | null
  isActive?: boolean
  productIds?: string[]
  minQuantity?: number | null
}
