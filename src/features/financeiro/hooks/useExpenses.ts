import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesService, type ExpenseFilters } from '../services/expenses.service'
import type { CreateExpensePayload, Expense } from '../types/expense.types'

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.all, 'list', filters] as const,
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expensesService.getExpenses(filters),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesService.createExpense(payload),
    onSuccess: (newExpense) => {
      queryClient.setQueriesData<Expense[]>({ queryKey: expenseKeys.all }, (old) =>
        old ? [newExpense, ...old] : [newExpense]
      )
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(id),
    onSuccess: (_, id) => {
      queryClient.setQueriesData<Expense[]>({ queryKey: expenseKeys.all }, (old) =>
        old?.filter((e) => e.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
