'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { boletosService } from '@/features/boletos/services/boletos.service'
import type {
  BoletoInput,
  BoletoFilters,
  BoletoStatus,
} from '@/features/boletos/types/boleto.types'

export const boletoKeys = {
  all: ['boletos'] as const,
  list: (filters: BoletoFilters) => ['boletos', 'list', filters] as const,
  detail: (id: string) => ['boletos', id] as const,
}

export function useBoletos(filters: BoletoFilters = {}) {
  return useQuery({
    queryKey: boletoKeys.list(filters),
    queryFn: () => boletosService.getBoletos(filters),
  })
}

export function useBoleto(id: string) {
  return useQuery({
    queryKey: boletoKeys.detail(id),
    queryFn: () => boletosService.getBoletoById(id),
    enabled: !!id,
  })
}

export function useCreateBoleto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BoletoInput) => boletosService.createBoleto(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: boletoKeys.all }),
  })
}

export function useUpdateBoletoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, paidAt }: { id: string; status: BoletoStatus; paidAt?: string }) =>
      boletosService.updateBoletoStatus(id, status, paidAt),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: boletoKeys.all })
      qc.invalidateQueries({ queryKey: boletoKeys.detail(id) })
    },
  })
}

export function useDeleteBoleto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => boletosService.deleteBoleto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: boletoKeys.all }),
  })
}
