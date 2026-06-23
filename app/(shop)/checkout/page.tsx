'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Loader2,
  Tag,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  User,
  CreditCard,
  Check,
  MapPin,
} from 'lucide-react'
import { checkoutSchema, type CheckoutInput } from '@/features/cart/schemas/checkout.schema'
import { useCheckout } from '@/features/cart/hooks/useCheckout'
import { useCart } from '@/features/cart/hooks/useCart'
import { formatCurrency } from '@/utils/formatCurrency'

const STEPS = [
  { label: 'Você', icon: User },
  { label: 'Entrega', icon: MapPin },
  { label: 'Pagamento', icon: CreditCard },
]

const PAYMENT_OPTIONS = [
  { value: 'credit_card', label: '💳 Cartão de Crédito' },
  { value: 'debit_card', label: '🏦 Cartão de Débito' },
  { value: 'pix', label: '⚡ PIX' },
  { value: 'cash', label: '💵 Espécie (dinheiro)' },
] as const

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-wider text-white/40 uppercase">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function DarkInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-[#111] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#4a9fd4] focus:outline-none"
    />
  )
}

export default function CheckoutPage() {
  const { mutate: checkout, isPending, error } = useCheckout()
  const { items, total, isEmpty } = useCart()

  const [step, setStep] = useState(0)
  const [needsChange, setNeedsChange] = useState<boolean | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  )
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const discountAmount = appliedCoupon?.discount ?? 0
  const shipping = total >= 299 ? 0 : 29.9
  const finalTotal = total - discountAmount + shipping

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'credit_card', deliveryType: 'delivery' },
  })

  const paymentMethod = watch('paymentMethod')
  const deliveryType = watch('deliveryType')

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal: total }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCouponError(json.error ?? 'Cupom inválido')
        setAppliedCoupon(null)
      } else {
        setAppliedCoupon({ code, discount: json.discount })
      }
    } catch {
      setCouponError('Erro ao validar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  async function nextStep() {
    let fields: (keyof CheckoutInput)[] = []
    if (step === 0) fields = ['fullName', 'phone']
    if (step === 1) {
      fields = ['deliveryType']
      if (deliveryType === 'delivery')
        fields = [...fields, 'zipCode', 'street', 'number', 'city', 'state']
    }
    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  if (isEmpty) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 text-center lg:px-10">
        <p className="text-white/40">Seu carrinho está vazio</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-6 py-8 lg:px-10">
      <h1 className="mb-8 text-2xl font-bold text-white">Finalizar Compra</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Form ── */}
        <div className="lg:col-span-2">
          {/* Step indicator */}
          <div className="mb-8 flex items-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const done = i < step
              const current = i === step
              return (
                <div key={i} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        done
                          ? 'border-[#4a9fd4] bg-[#4a9fd4] text-white'
                          : current
                            ? 'border-[#4a9fd4] bg-transparent text-[#4a9fd4]'
                            : 'border-white/10 bg-transparent text-white/20'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span
                      className={`mt-1.5 text-[11px] font-medium ${
                        current ? 'text-[#4a9fd4]' : done ? 'text-white/50' : 'text-white/20'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 mb-5 h-0.5 flex-1 transition-colors ${i < step ? 'bg-[#4a9fd4]' : 'bg-white/10'}`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <form
            id="checkout-form"
            onSubmit={handleSubmit((data) =>
              checkout({ data, couponCode: appliedCoupon?.code, discountAmount })
            )}
          >
            {/* Step 0: Identificação */}
            {step === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
                <h2 className="mb-1 text-base font-bold text-white">Quem está comprando?</h2>
                <p className="mb-5 text-sm text-white/40">Só precisamos do seu nome e contato.</p>
                <div className="space-y-4">
                  <Field label="Nome completo" error={errors.fullName?.message}>
                    <DarkInput placeholder="Seu nome completo" {...register('fullName')} />
                  </Field>
                  <Field label="Telefone / WhatsApp" error={errors.phone?.message}>
                    <DarkInput placeholder="(84) 99999-9999" {...register('phone')} />
                  </Field>
                </div>
              </div>
            )}

            {/* Step 1: Entrega */}
            {step === 1 && (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
                <h2 className="mb-1 text-base font-bold text-white">Como quer receber?</h2>
                <p className="mb-5 text-sm text-white/40">Entrega em casa ou retirada na loja.</p>

                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: 'delivery', label: 'Entrega em casa', emoji: '🚚' },
                      { value: 'pickup', label: 'Retirar na loja', emoji: '🏪' },
                    ] as const
                  ).map(({ value, label, emoji }) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                        deliveryType === value
                          ? 'border-[#4a9fd4] bg-[#4a9fd4]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register('deliveryType')}
                        className="sr-only"
                      />
                      <span className="text-xl leading-none">{emoji}</span>
                      <span className="text-sm font-semibold text-white">{label}</span>
                    </label>
                  ))}
                </div>

                {deliveryType === 'delivery' && (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="CEP" error={errors.zipCode?.message}>
                      <DarkInput placeholder="00000-000" {...register('zipCode')} />
                    </Field>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Field label="Rua" error={errors.street?.message}>
                        <DarkInput placeholder="Nome da rua / avenida" {...register('street')} />
                      </Field>
                    </div>
                    <Field label="Número" error={errors.number?.message}>
                      <DarkInput placeholder="Ex: 123" {...register('number')} />
                    </Field>
                    <Field label="Complemento">
                      <DarkInput
                        placeholder="Apto, bloco... (opcional)"
                        {...register('complement')}
                      />
                    </Field>
                    <Field label="Cidade" error={errors.city?.message}>
                      <DarkInput {...register('city')} />
                    </Field>
                    <Field label="Estado" error={errors.state?.message}>
                      <DarkInput placeholder="RN" maxLength={2} {...register('state')} />
                    </Field>
                  </div>
                )}

                {deliveryType === 'pickup' && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-[#111] px-4 py-3">
                    <p className="text-sm font-semibold text-white">📍 Endereço da loja</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      Av. Paulista, 1000 — São Paulo, SP
                      <br />
                      Seg–Sáb: 9h–20h · Dom: 10h–16h
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Pagamento */}
            {step === 2 && (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
                <h2 className="mb-1 text-base font-bold text-white">Como quer pagar?</h2>
                <p className="mb-5 text-sm text-white/40">Escolha a forma de pagamento.</p>

                <Field label="Forma de pagamento" error={errors.paymentMethod?.message}>
                  <select
                    {...register('paymentMethod')}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-3.5 py-2.5 text-sm text-white focus:border-[#4a9fd4] focus:outline-none"
                  >
                    {PAYMENT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-[#111]">
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <div className="mt-5 rounded-xl border border-[#4a9fd4]/30 bg-[#4a9fd4]/10 px-4 py-3">
                    <p className="text-sm font-semibold text-[#4a9fd4]">
                      {paymentMethod === 'credit_card'
                        ? '💳 Cartão de Crédito'
                        : '🏦 Cartão de Débito'}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4a9fd4]/70">
                      A máquina será levada na hora da entrega. Nenhum dado de cartão é necessário
                      agora.
                    </p>
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-green-400">⚡ Pagamento via PIX</p>
                    <p className="mt-0.5 text-xs text-green-400/70">
                      Após confirmar o pedido, o atendente enviará a chave PIX pelo WhatsApp.
                    </p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm font-semibold text-white">Vai precisar de troco?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { label: 'Sim, preciso', value: true },
                          { label: 'Não, tenho o valor', value: false },
                        ] as const
                      ).map(({ label, value }) => (
                        <button
                          key={String(value)}
                          type="button"
                          onClick={() => setNeedsChange(value)}
                          className={`flex items-center justify-center rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                            needsChange === value
                              ? 'border-[#4a9fd4] bg-[#4a9fd4]/10 text-[#4a9fd4]'
                              : 'border-white/10 text-white/50 hover:border-white/20'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {needsChange === true && (
                      <Field label="Troco para quanto?">
                        <DarkInput placeholder="Ex: R$ 100,00" {...register('changeFor')} />
                      </Field>
                    )}
                    {needsChange === false && (
                      <p className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-xs text-white/40">
                        Ótimo! Nenhum troco necessário.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {(error as Error).message}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-5 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#4a9fd4] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#4a9fd4] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? 'Processando...' : 'Confirmar pedido'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Resumo do pedido ── */}
        <div className="h-fit rounded-2xl border border-white/10 bg-[#1a1a1a]">
          <div className="p-6">
            <h2 className="mb-5 text-base font-bold text-white">Seu pedido</h2>

            <div className="mb-5 space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.product.name}</p>
                    <p className="mt-0.5 text-xs text-white/30">{item.quantity}x</p>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cupom */}
            <div
              className={`mb-1 flex items-center gap-2 rounded-xl border bg-[#111] px-3 py-2.5 ${appliedCoupon ? 'border-green-500/40' : 'border-white/10'}`}
            >
              <Tag
                className={`h-4 w-4 shrink-0 ${appliedCoupon ? 'text-green-400' : 'text-white/20'}`}
              />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  setCouponError('')
                  setAppliedCoupon(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                placeholder="Código de desconto"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null)
                    setCouponCode('')
                  }}
                  className="text-xs font-semibold text-white/30 transition-opacity hover:text-white/60"
                >
                  Remover
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="text-sm font-semibold text-[#4a9fd4] transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
              )}
            </div>
            {couponError && <p className="mb-3 text-xs text-red-400">{couponError}</p>}
            {appliedCoupon && (
              <p className="mb-3 text-xs text-green-400">
                ✓ Cupom aplicado — {formatCurrency(appliedCoupon.discount)} de desconto
              </p>
            )}
            {!couponError && !appliedCoupon && <div className="mb-3" />}

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Subtotal</span>
                <span className="text-white">{formatCurrency(total)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/40">Desconto</span>
                  <span className="font-medium text-green-400">
                    −{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">Frete</span>
                <span className={shipping === 0 ? 'font-semibold text-green-400' : 'text-white'}>
                  {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="my-1 h-px bg-white/10" />
              <div className="flex justify-between">
                <span className="font-bold text-white">Total</span>
                <span className="text-lg font-black text-white">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white/20" />
              <span className="text-sm font-semibold text-white/50">Checkout Seguro — SSL</span>
            </div>
            <p className="mt-0.5 text-xs text-white/25">
              Seus dados estão protegidos durante toda a transação.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
