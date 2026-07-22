export interface OrderItem {
  id: string
  productId: string | null
  productName: string
  quantity: number
  price: number
  size?: string | null
  color?: string | null
  product?: { images: string[] } | null
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH'
export type DeliveryType = 'DELIVERY' | 'PICKUP'

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  paymentMethod: PaymentMethod
  deliveryType: DeliveryType
  items: OrderItem[]
  total: number
  discountAmount: number
  shippingCost?: number
  shippingService?: string | null
  couponCode?: string | null
  status: OrderStatus
  street?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderItemPayload {
  productId: string
  productName: string
  quantity: number
  size?: string | null
  color?: string | null
  // price intentionally omitted — server reads from DB
}

export interface CreateOrderPayload {
  customerName: string
  customerPhone: string
  paymentMethod: PaymentMethod
  deliveryType: DeliveryType
  items: CreateOrderItemPayload[]
  couponCode?: string | null
  /** Manual discount (venda presencial) — mutually exclusive with couponCode */
  discountType?: 'PERCENTAGE' | 'FIXED' | null
  discountValue?: number | null
  shippingCost?: number
  shippingService?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
}
