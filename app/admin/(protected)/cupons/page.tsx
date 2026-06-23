'use client'

import { useState } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import {
  useCoupons,
  useCreateCoupon,
  useToggleCoupon,
  useDeleteCoupon,
} from '@/features/coupons/hooks/useCoupons'
import { formatCurrency } from '@/utils/formatCurrency'
import type { CouponType, CreateCouponPayload } from '@/features/coupons/types/coupon.types'
import { Plus, X, Loader2, Trash2, Copy, Check, Tag } from 'lucide-react'

/* ── Create Modal ─────────────────────────────────────── */
function CreateCouponModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('')
  const [type, setType] = useState<CouponType>('PERCENTAGE')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')

  const { mutate: create, isPending } = useCreateCoupon()

  const canSubmit = code.trim().length >= 3 && Number(value) > 0

  function handleSubmit() {
    if (!canSubmit) return
    const payload: CreateCouponPayload = {
      code: code.trim(),
      type,
      value: Number(value),
      minOrderValue: minOrder ? Number(minOrder) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
    }
    create(payload, {
      onSuccess: onClose,
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
        setError(msg ?? 'Erro ao criar cupom')
      },
    })
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#4A6CF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4A6CF7]/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Novo Cupom</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">{error}</p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
              Código do cupom *
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: PROMO10"
              className={inputCls}
              maxLength={20}
            />
            <p className="mt-1 text-[11px] text-gray-400">Mínimo 3 caracteres, sem espaços</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
              Tipo de desconto *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['PERCENTAGE', 'FIXED'] as CouponType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${type === t ? 'border-[#4A6CF7] bg-[#4A6CF7]/10 text-[#4A6CF7]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}
                >
                  {t === 'PERCENTAGE' ? 'Porcentagem (%)' : 'Valor fixo (R$)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                {type === 'PERCENTAGE' ? 'Desconto (%) *' : 'Desconto (R$) *'}
              </label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder={type === 'PERCENTAGE' ? '10' : '20,00'}
                inputMode="decimal"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Pedido mínimo (R$)
              </label>
              <input
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Opcional"
                inputMode="decimal"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Limite de usos
              </label>
              <input
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ''))}
                placeholder="Ilimitado"
                inputMode="numeric"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">Validade</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="flex items-center gap-2 rounded-xl bg-[#4A6CF7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3a5ce5] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar cupom
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Copy button ─────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function CuponsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: coupons = [], isLoading } = useCoupons()
  const { mutate: toggle } = useToggleCoupon()
  const { mutate: remove, isPending: deleting } = useDeleteCoupon()

  const active = coupons.filter((c) => c.isActive)
  const inactive = coupons.filter((c) => !c.isActive)

  function isExpired(c: { expiresAt?: string | null }) {
    return c.expiresAt ? new Date() > new Date(c.expiresAt) : false
  }
  function isExhausted(c: { maxUses?: number | null; usedCount: number }) {
    return c.maxUses !== null && c.maxUses !== undefined && c.usedCount >= c.maxUses
  }

  function statusLabel(c: (typeof coupons)[0]) {
    if (isExpired(c)) return { text: 'Expirado', cls: 'bg-red-50 text-red-400' }
    if (isExhausted(c)) return { text: 'Esgotado', cls: 'bg-orange-50 text-orange-400' }
    if (!c.isActive) return { text: 'Inativo', cls: 'bg-gray-100 text-gray-400' }
    return { text: 'Ativo', cls: 'bg-green-50 text-green-600' }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <h1 className="text-xl font-bold text-gray-800">Cupons</h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#4A6CF7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a5ce5]"
        >
          <Plus className="h-4 w-4" /> Novo cupom
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: coupons.length, color: 'text-gray-800' },
          { label: 'Ativos', value: active.length, color: 'text-green-600' },
          { label: 'Inativos', value: inactive.length, color: 'text-gray-400' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100"
          >
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Tag className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Nenhum cupom criado ainda</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="px-5 py-3.5 font-semibold">Código</th>
                    <th className="px-5 py-3.5 font-semibold">Desconto</th>
                    <th className="px-5 py-3.5 font-semibold">Mín. pedido</th>
                    <th className="px-5 py-3.5 font-semibold">Usos</th>
                    <th className="px-5 py-3.5 font-semibold">Validade</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((c) => {
                    const status = statusLabel(c)
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold tracking-wider text-gray-800">
                              {c.code}
                            </span>
                            <CopyButton text={c.code} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#4A6CF7]">
                          {c.type === 'PERCENTAGE' ? `${c.value}%` : formatCurrency(c.value)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {c.minOrderValue ? formatCurrency(c.minOrderValue) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {c.usedCount}
                          {c.maxUses ? `/${c.maxUses}` : ''}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggle({ id: c.id, isActive: !c.isActive })}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${c.isActive ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              {c.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => remove(c.id)}
                              disabled={deleting}
                              className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-50 lg:hidden">
              {coupons.map((c) => {
                const status = statusLabel(c)
                return (
                  <div key={c.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold tracking-wider text-gray-800">
                          {c.code}
                        </span>
                        <CopyButton text={c.code} />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}
                      >
                        {status.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="font-semibold text-[#4A6CF7]">
                        {c.type === 'PERCENTAGE'
                          ? `${c.value}% off`
                          : `${formatCurrency(c.value)} off`}
                      </span>
                      {c.minOrderValue && <span>Mín: {formatCurrency(c.minOrderValue)}</span>}
                      <span>
                        {c.usedCount}
                        {c.maxUses ? `/${c.maxUses}` : ''} usos
                      </span>
                      {c.expiresAt && (
                        <span>Até {new Date(c.expiresAt).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => toggle({ id: c.id, isActive: !c.isActive })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${c.isActive ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}
                      >
                        {c.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        disabled={deleting}
                        className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {createOpen && <CreateCouponModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
