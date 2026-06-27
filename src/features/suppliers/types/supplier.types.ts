export interface Supplier {
  id: string
  name: string
  contactName: string
  phone: string
  categories: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierInput {
  name: string
  contactName: string
  phone: string
  categories: string[]
  isActive: boolean
}

export interface SupplierFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}
