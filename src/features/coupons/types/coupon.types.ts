export type CouponType = 'PERCENTAGE' | 'FIXED'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrderValue?: number | null
  maxUses?: number | null
  usedCount: number
  expiresAt?: string | null
  isActive: boolean
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
}
