export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'SALARIES'
  | 'SUPPLIES'
  | 'MARKETING'
  | 'MAINTENANCE'
  | 'OTHER'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: 'Aluguel',
  UTILITIES: 'Contas (Luz/Água/Internet)',
  SALARIES: 'Salários',
  SUPPLIES: 'Insumos / Estoque',
  MARKETING: 'Marketing',
  MAINTENANCE: 'Manutenção',
  OTHER: 'Outros',
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateExpensePayload {
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string | null
}
