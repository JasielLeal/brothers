import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/features/cart/types/cart.types'
import type { Product } from '@/features/products/types/product.types'

interface AddItemOpts {
  size?: string
  color?: string
  colorHex?: string
  image?: string
}

interface CartStore {
  items: CartItem[]
  total: number
  itemCount: number
  addItem: (product: Product, quantity?: number, opts?: AddItemOpts) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, quantity: number) => void
  clearCart: () => void
}

function calculateTotals(items: CartItem[]) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { total, itemCount }
}

function makeKey(productId: string, opts?: AddItemOpts) {
  const color = opts?.color ?? ''
  const size = opts?.size ?? ''
  return `${productId}::${color}::${size}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1, opts) => {
        const cartKey = makeKey(product.id, opts)
        const { items } = get()
        const existing = items.find((i) => i.cartKey === cartKey)

        let updatedItems: CartItem[]
        if (existing) {
          updatedItems = items.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + quantity } : i
          )
        } else {
          updatedItems = [
            ...items,
            {
              cartKey,
              product,
              quantity,
              size: opts?.size,
              color: opts?.color,
              colorHex: opts?.colorHex,
              image: opts?.image,
            },
          ]
        }

        set({ items: updatedItems, ...calculateTotals(updatedItems) })
      },

      removeItem: (cartKey) => {
        const updatedItems = get().items.filter((i) => i.cartKey !== cartKey)
        set({ items: updatedItems, ...calculateTotals(updatedItems) })
      },

      updateQuantity: (cartKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartKey)
          return
        }
        const updatedItems = get().items.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity } : i
        )
        set({ items: updatedItems, ...calculateTotals(updatedItems) })
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 })
      },
    }),
    { name: 'cart-store' }
  )
)
