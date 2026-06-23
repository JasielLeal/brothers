import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import type { Coupon, CreateCouponPayload } from '../types/coupon.types'

const couponKeys = {
  all: ['coupons'] as const,
  list: () => [...couponKeys.all, 'list'] as const,
}

async function getCoupons(): Promise<Coupon[]> {
  const { data } = await api.get('/coupons')
  return data.data
}

async function createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
  const { data } = await api.post('/coupons', payload)
  return data
}

async function toggleCoupon(id: string, isActive: boolean): Promise<Coupon> {
  const { data } = await api.patch(`/coupons/${id}`, { isActive })
  return data
}

async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/coupons/${id}`)
}

export function useCoupons() {
  return useQuery({ queryKey: couponKeys.list(), queryFn: getCoupons })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: (newCoupon) => {
      queryClient.setQueryData<Coupon[]>(couponKeys.list(), (old) =>
        old ? [newCoupon, ...old] : [newCoupon]
      )
    },
  })
}

export function useToggleCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleCoupon(id, isActive),
    onSuccess: (updated) => {
      queryClient.setQueryData<Coupon[]>(couponKeys.list(), (old) =>
        old?.map((c) => (c.id === updated.id ? updated : c))
      )
    },
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Coupon[]>(couponKeys.list(), (old) =>
        old?.filter((c) => c.id !== id)
      )
    },
  })
}
