import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService, type OrderFilters } from '@/features/orders/services/orders.service'
import type { CreateOrderPayload, Order, OrderStatus } from '@/features/orders/types/order.types'
import type { PaginatedResponse } from '@/types/global.types'
import { productKeys } from '@/features/products/hooks/useProducts'

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters?: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
}

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => ordersService.getOrders(filters),
  })
}

export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => ordersService.getOrders(filters),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersService.getOrderById(id),
    enabled: Boolean(id),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersService.createOrder(payload),
    onSuccess: (newOrder) => {
      queryClient.setQueriesData<PaginatedResponse<Order>>(
        { queryKey: ['orders', 'list'] },
        (old) => {
          if (!old) return old
          return { ...old, data: [newOrder, ...old.data], total: old.total + 1 }
        }
      )
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.setQueriesData<PaginatedResponse<Order>>(
        { queryKey: ['orders', 'list'] },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((o) =>
              o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o
            ),
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
