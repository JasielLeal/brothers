import { api } from '@/lib/api/axios'
import type {
  Boleto,
  BoletoInput,
  BoletoFilters,
  BoletoStatus,
} from '@/features/boletos/types/boleto.types'
import type { PaginatedResponse } from '@/types/global.types'

export const boletosService = {
  async getBoletos(filters: BoletoFilters = {}): Promise<PaginatedResponse<Boleto>> {
    const params: Record<string, string | number> = {}
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit

    const { data } = await api.get<PaginatedResponse<Boleto>>('/boletos', { params })
    return data
  },

  async getBoletoById(id: string): Promise<Boleto> {
    const { data } = await api.get<Boleto>(`/boletos/${id}`)
    return data
  },

  async createBoleto(input: BoletoInput): Promise<Boleto> {
    const { data } = await api.post<Boleto>('/boletos', input)
    return data
  },

  async updateBoletoStatus(id: string, status: BoletoStatus, paidAt?: string): Promise<Boleto> {
    const { data } = await api.patch<Boleto>(`/boletos/${id}`, { status, paidAt })
    return data
  },

  async deleteBoleto(id: string): Promise<void> {
    await api.delete(`/boletos/${id}`)
  },
}
