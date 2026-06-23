export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  product?: { images: string[] }
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

export interface CreateOrderPayload {
  customerName: string
  customerPhone: string
  paymentMethod: PaymentMethod
  deliveryType: DeliveryType
  items: Omit<OrderItem, 'id' | 'product'>[]
  total: number
  discountAmount?: number
  couponCode?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
}
