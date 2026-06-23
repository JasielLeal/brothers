import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ordersService } from '@/features/orders/services/orders.service'
import { useCartStore } from '@/features/cart/store/cart.store'
import type { CheckoutInput } from '@/features/cart/schemas/checkout.schema'
import type { PaymentMethod, DeliveryType } from '@/features/orders/types/order.types'

const PAYMENT_MAP: Record<CheckoutInput['paymentMethod'], PaymentMethod> = {
  credit_card: 'CREDIT_CARD',
  debit_card: 'DEBIT_CARD',
  pix: 'PIX',
  cash: 'CASH',
}

interface CheckoutOptions {
  couponCode?: string | null
  discountAmount?: number
}

export function useCheckout() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()

  return useMutation({
    mutationFn: async ({
      data,
      couponCode,
      discountAmount = 0,
    }: { data: CheckoutInput } & CheckoutOptions) => {
      const isDelivery = data.deliveryType === 'delivery'
      const street = isDelivery
        ? `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''}`
        : null

      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const shipping = subtotal >= 299 ? 0 : 29.9
      const total = subtotal - discountAmount + shipping

      return ordersService.createOrder({
        customerName: data.fullName,
        customerPhone: data.phone,
        paymentMethod: PAYMENT_MAP[data.paymentMethod],
        deliveryType: data.deliveryType.toUpperCase() as DeliveryType,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total,
        discountAmount,
        couponCode: couponCode ?? null,
        street,
        city: isDelivery ? (data.city ?? null) : null,
        state: isDelivery ? (data.state ?? null) : null,
        zipCode: isDelivery ? (data.zipCode ?? null) : null,
      })
    },
    onSuccess: (order, { data }) => {
      clearCart()
      const name = encodeURIComponent(data.fullName)
      const method = encodeURIComponent(data.paymentMethod)
      router.push(`/checkout/success?orderId=${order.id}&name=${name}&method=${method}`)
    },
  })
}
