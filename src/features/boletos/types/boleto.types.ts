export type BoletoStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface Boleto {
  id: string
  code: string
  supplierId?: string | null
  supplierName: string
  description: string
  amount: number
  dueDate: string
  paidAt?: string | null
  status: BoletoStatus
  createdAt: string
  updatedAt: string
}

export interface BoletoInput {
  code: string
  supplierId?: string | null
  supplierName: string
  description: string
  amount: number
  dueDate: string
}

export interface BoletoFilters {
  search?: string
  status?: BoletoStatus
  page?: number
  limit?: number
}
