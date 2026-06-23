'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersService } from '@/features/suppliers/services/suppliers.service'
import type { SupplierInput, SupplierFilters } from '@/features/suppliers/types/supplier.types'

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (filters: SupplierFilters) => ['suppliers', 'list', filters] as const,
  detail: (id: string) => ['suppliers', id] as const,
}

export function useSuppliers(filters: SupplierFilters = {}) {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => suppliersService.getSuppliers(filters),
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersService.getSupplierById(id),
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SupplierInput) => suppliersService.createSupplier(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SupplierInput> }) =>
      suppliersService.updateSupplier(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: supplierKeys.all })
      qc.invalidateQueries({ queryKey: supplierKeys.detail(id) })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => suppliersService.deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  })
}
