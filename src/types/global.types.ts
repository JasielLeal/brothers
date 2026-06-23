export type ID = string | number

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  suggestedProducts?: T[]
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface SortParams {
  sortBy?: string
  sortOrder?: SortOrder
}
