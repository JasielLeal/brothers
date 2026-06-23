import { api } from '@/lib/api/axios'
import type { Order, CreateOrderPayload, OrderStatus } from '@/features/orders/types/order.types'
import type { PaginatedResponse } from '@/types/global.types'

export interface OrderFilters {
  search?: string
  status?: OrderStatus
  page?: number
  limit?: number
}

export const ordersService = {
  async getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params: Record<string, string | number> = {}
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit

    const { data } = await api.get<PaginatedResponse<Order>>('/orders', { params })
    return data
  },

  async getOrderById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>('/orders', payload)
    return data
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}`, { status })
    return data
  },
}
