import { api } from '@/lib/api/axios'
import type { Expense, CreateExpensePayload } from '../types/expense.types'

export interface ExpenseFilters {
  month?: string
  year?: string
}

export const expensesService = {
  async getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    const params = new URLSearchParams()
    if (filters.month) params.set('month', filters.month)
    if (filters.year) params.set('year', filters.year)
    const { data } = await api.get(`/expenses?${params}`)
    return data.data
  },

  async createExpense(payload: CreateExpensePayload): Promise<Expense> {
    const { data } = await api.post('/expenses', payload)
    return data.data
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`)
  },
}
