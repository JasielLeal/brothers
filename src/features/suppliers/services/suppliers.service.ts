import { api } from '@/lib/api/axios'
import type {
  Supplier,
  SupplierInput,
  SupplierFilters,
} from '@/features/suppliers/types/supplier.types'
import type { PaginatedResponse } from '@/types/global.types'

export const suppliersService = {
  async getSuppliers(filters: SupplierFilters = {}): Promise<PaginatedResponse<Supplier>> {
    const params: Record<string, string | number | boolean> = {}
    if (filters.search) params.search = filters.search
    if (filters.isActive !== undefined) params.isActive = filters.isActive
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit

    const { data } = await api.get<PaginatedResponse<Supplier>>('/suppliers', { params })
    return data
  },

  async getSupplierById(id: string): Promise<Supplier> {
    const { data } = await api.get<Supplier>(`/suppliers/${id}`)
    return data
  },

  async createSupplier(input: SupplierInput): Promise<Supplier> {
    const { data } = await api.post<Supplier>('/suppliers', input)
    return data
  },

  async updateSupplier(id: string, input: Partial<SupplierInput>): Promise<Supplier> {
    const { data } = await api.put<Supplier>(`/suppliers/${id}`, input)
    return data
  },

  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`)
  },
}
