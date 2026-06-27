'use client'

import { useState, useEffect } from 'react'
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
  Truck,
  Banknote,
  QrCode,
  RotateCcw,
} from 'lucide-react'
import { checkoutSchema, type CheckoutInput } from '@/features/cart/schemas/checkout.schema'
import { useCheckout } from '@/features/cart/hooks/useCheckout'
import { useCart } from '@/features/cart/hooks/useCart'
import { formatCurrency } from '@/utils/formatCurrency'

const STORAGE_KEY = 'brothersoutlet_customer'

interface SavedCustomer {
  fullName: string
  phone: string
  zipCode: string
  street: string
  number: string
  complement?: string
  city: string
  state: string
}

const STEPS = [
  { label: 'Você', icon: User },
  { label: 'Entrega', icon: MapPin },
  { label: 'Frete', icon: Truck },
  { label: 'Pagamento', icon: CreditCard },
]

const PAYMENT_OPTIONS = [
  { value: 'credit_card', label: 'Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cash', label: 'Espécie', icon: Banknote },
] as const

interface ShippingOption {
  id: number
  name: string
  company: string
  price: number
  days: number
}

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

function DarkInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-[#111] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#4a9fd4] focus:outline-none${className ? ` ${className}` : ''}`}
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

  // Cliente salvo
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null)
  const [usingSavedAddress, setUsingSavedAddress] = useState<boolean | null>(null) // null = não decidiu ainda

  // Frete
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null)
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const [lastCepQueried, setLastCepQueried] = useState('')
  const [cepLocked, setCepLocked] = useState(false)
  const [originCep, setOriginCep] = useState<string | null>(null)

  const discountAmount = appliedCoupon?.discount ?? 0
  const shippingCost = selectedShipping?.price ?? 0
  const finalTotal = total - discountAmount + shippingCost

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryType: 'delivery' },
  })

  const paymentMethod = watch('paymentMethod')
  const deliveryType = watch('deliveryType')
  const zipCode = watch('zipCode')

  // Carrega dados salvos e CEP da loja no mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSavedCustomer(JSON.parse(raw))
    } catch {
      /* ignora */
    }

    fetch('/api/freight/origin')
      .then((r) => r.json())
      .then((d) => {
        if (d?.originCep) setOriginCep(d.originCep)
      })
      .catch(() => {})
  }, [])

  // Auto-frete grátis quando CEP == CEP da loja
  useEffect(() => {
    if (!originCep || !zipCode) return
    const clean = zipCode.replace(/\D/g, '')
    if (clean === originCep) {
      setSelectedShipping({
        id: 0,
        name: 'Entrega local',
        company: 'Brothers Outlet',
        price: 0,
        days: 1,
      })
      setShippingOptions([
        { id: 0, name: 'Entrega local', company: 'Brothers Outlet', price: 0, days: 1 },
      ])
      setShippingError('')
    }
  }, [zipCode, originCep])

  // Auto-calcula frete ao entrar no step 2
  useEffect(() => {
    if (step !== 2 || deliveryType !== 'delivery') return
    const cep = (zipCode ?? '').replace(/\D/g, '')
    if (cep.length !== 8 || cep === lastCepQueried) return
    if (cep === originCep) return // já tratado pelo efeito acima
    calculateShipping(cep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function applySavedCustomer() {
    if (!savedCustomer) return
    setValue('fullName', savedCustomer.fullName)
    setValue('phone', savedCustomer.phone)
  }

  function applySavedAddress() {
    if (!savedCustomer) return
    setValue('zipCode', savedCustomer.zipCode)
    setValue('street', savedCustomer.street)
    setValue('number', savedCustomer.number)
    setValue('complement', savedCustomer.complement ?? '')
    setValue('city', savedCustomer.city)
    setValue('state', savedCustomer.state)
    setCepLocked(true)
    setUsingSavedAddress(true)
  }

  function clearSavedAddress() {
    setValue('zipCode', '')
    setValue('street', '')
    setValue('number', '')
    setValue('complement', '')
    setValue('city', '')
    setValue('state', '')
    setCepLocked(false)
    setUsingSavedAddress(false)
    setShippingOptions(null)
    setSelectedShipping(null)
    setLastCepQueried('')
  }

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

  async function calculateShipping(cep?: string) {
    const cleanCep = (cep ?? zipCode ?? '').replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setShippingError('CEP inválido')
      return
    }
    if (cleanCep === lastCepQueried) return
    setShippingLoading(true)
    setShippingError('')
    setShippingOptions(null)
    setSelectedShipping(null)
    try {
      const res = await fetch('/api/freight/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cleanCep, totalValue: total }),
      })
      const json = await res.json()
      if (!res.ok) {
        setShippingError(json.error ?? 'Erro ao calcular frete')
        return
      }
      const opts: ShippingOption[] = Array.isArray(json) ? json : (json.data ?? [])
      setShippingOptions(opts)
      setLastCepQueried(cleanCep)
      if (opts.length === 1) setSelectedShipping(opts[0])
    } catch {
      setShippingError('Erro de conexão ao calcular frete')
    } finally {
      setShippingLoading(false)
    }
  }

  function getDisplayStep() {
    if (deliveryType === 'pickup' && step === 3) return 3
    return step
  }

  async function nextStep() {
    if (step === 0) {
      const valid = await trigger(['fullName', 'phone'])
      if (!valid) return
      setStep(1)
      return
    }

    if (step === 1) {
      const fields: (keyof CheckoutInput)[] = ['deliveryType']
      if (deliveryType === 'delivery') fields.push('zipCode', 'street', 'number', 'city', 'state')
      const valid = await trigger(fields)
      if (!valid) return
      setStep(deliveryType === 'pickup' ? 3 : 2)
      return
    }

    if (step === 2) {
      if (!selectedShipping) {
        setShippingError('Selecione uma opção de frete para continuar.')
        return
      }
      setStep(3)
      return
    }
  }

  function prevStep() {
    if (step === 3 && deliveryType === 'pickup') {
      setStep(1)
      return
    }
    setStep((s) => s - 1)
  }

  function saveCustomerData(data: CheckoutInput) {
    if (deliveryType !== 'delivery') return
    const toSave: SavedCustomer = {
      fullName: data.fullName,
      phone: data.phone,
      zipCode: data.zipCode ?? '',
      street: data.street ?? '',
      number: data.number ?? '',
      complement: data.complement ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      setSavedCustomer(toSave)
    } catch {
      /* ignora */
    }
  }

  if (isEmpty) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 text-center lg:px-10">
        <p className="text-white/40">Seu carrinho está vazio</p>
      </div>
    )
  }

  const displayStep = getDisplayStep()

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
              const isSkipped = deliveryType === 'pickup' && i === 2
              const done = isSkipped ? displayStep > 1 : i < displayStep
              const current = !isSkipped && i === displayStep
              return (
                <div key={i} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        isSkipped
                          ? 'border-white/10 bg-transparent text-white/10'
                          : done
                            ? 'border-[#4a9fd4] bg-[#4a9fd4] text-white'
                            : current
                              ? 'border-[#4a9fd4] bg-transparent text-[#4a9fd4]'
                              : 'border-white/10 bg-transparent text-white/20'
                      }`}
                    >
                      {done && !isSkipped ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[11px] font-medium ${
                        isSkipped
                          ? 'text-white/10'
                          : current
                            ? 'text-[#4a9fd4]'
                            : done
                              ? 'text-white/50'
                              : 'text-white/20'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 mb-5 h-0.5 flex-1 transition-colors ${i < displayStep && !isSkipped ? 'bg-[#4a9fd4]' : 'bg-white/10'}`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <form
            id="checkout-form"
            onSubmit={handleSubmit((data) => {
              saveCustomerData(data)
              checkout({
                data,
                couponCode: appliedCoupon?.code,
                discountAmount,
                shippingCost,
                shippingService: selectedShipping?.name,
              })
            })}
          >
            {/* Step 0: Identificação */}
            {step === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
                <h2 className="mb-1 text-base font-bold text-white">Quem está comprando?</h2>
                <p className="mb-5 text-sm text-white/40">Só precisamos do seu nome e contato.</p>

                {/* Banner cliente recorrente */}
                {savedCustomer && (
                  <div className="mb-5 flex items-center justify-between rounded-xl border border-[#4a9fd4]/30 bg-[#4a9fd4]/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#4a9fd4]">
                        Bem-vindo de volta, {savedCustomer.fullName.split(' ')[0]}!
                      </p>
                      <p className="text-xs text-[#4a9fd4]/70">Usar seus dados salvos?</p>
                    </div>
                    <button
                      type="button"
                      onClick={applySavedCustomer}
                      className="rounded-lg bg-[#4a9fd4] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    >
                      Sim, usar
                    </button>
                  </div>
                )}

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
                      { value: 'delivery', label: 'Entrega em casa' },
                      { value: 'pickup', label: 'Retirar na loja' },
                    ] as const
                  ).map(({ value, label }) => (
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
                      <span className="text-sm font-semibold text-white">{label}</span>
                    </label>
                  ))}
                </div>

                {deliveryType === 'delivery' && (
                  <div className="mt-6 space-y-4">
                    {/* Endereço salvo */}
                    {savedCustomer?.zipCode && usingSavedAddress === null && (
                      <div className="rounded-xl border border-white/10 bg-[#111] px-4 py-4">
                        <p className="mb-3 text-sm font-semibold text-white">
                          Enviar para o endereço salvo?
                        </p>
                        <p className="mb-4 text-xs text-white/50">
                          {savedCustomer.street}, {savedCustomer.number}
                          {savedCustomer.complement ? ` — ${savedCustomer.complement}` : ''} ·{' '}
                          {savedCustomer.city}/{savedCustomer.state} · {savedCustomer.zipCode}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={applySavedAddress}
                            className="flex-1 rounded-xl bg-[#4a9fd4] py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                          >
                            Sim, enviar aqui
                          </button>
                          <button
                            type="button"
                            onClick={() => setUsingSavedAddress(false)}
                            className="flex-1 rounded-xl border border-white/10 py-2 text-sm font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white"
                          >
                            Outro endereço
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botão para trocar endereço salvo que já foi aplicado */}
                    {usingSavedAddress === true && (
                      <button
                        type="button"
                        onClick={clearSavedAddress}
                        className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Usar outro endereço
                      </button>
                    )}

                    {/* Formulário de endereço */}
                    {(usingSavedAddress !== null || !savedCustomer?.zipCode) && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="CEP" error={errors.zipCode?.message}>
                            <DarkInput
                              placeholder="00000-000"
                              maxLength={9}
                              disabled={usingSavedAddress === true}
                              className={
                                usingSavedAddress === true ? 'cursor-not-allowed opacity-50' : ''
                              }
                              {...register('zipCode')}
                              onChange={async (e) => {
                                register('zipCode').onChange(e)
                                setShippingOptions(null)
                                setSelectedShipping(null)
                                setLastCepQueried('')
                                setShippingError('')
                                setCepLocked(false)
                                const cep = e.target.value.replace(/\D/g, '')
                                if (cep.length === 8) {
                                  // Frete grátis se CEP da loja
                                  if (originCep && cep === originCep) {
                                    setSelectedShipping({
                                      id: 0,
                                      name: 'Entrega local',
                                      company: 'Brothers Outlet',
                                      price: 0,
                                      days: 1,
                                    })
                                    setShippingOptions([
                                      {
                                        id: 0,
                                        name: 'Entrega local',
                                        company: 'Brothers Outlet',
                                        price: 0,
                                        days: 1,
                                      },
                                    ])
                                  }
                                  // Busca endereço ViaCEP
                                  try {
                                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                                    const json = await res.json()
                                    if (!json.erro) {
                                      if (json.localidade) setValue('city', json.localidade)
                                      if (json.uf) setValue('state', json.uf)
                                      if (json.logradouro) setValue('street', json.logradouro)
                                      setCepLocked(true)
                                    }
                                  } catch {
                                    /* ignora */
                                  }
                                }
                              }}
                            />
                          </Field>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <Field label="Rua" error={errors.street?.message}>
                            <DarkInput
                              placeholder="Nome da rua / avenida"
                              disabled={cepLocked || usingSavedAddress === true}
                              className={
                                cepLocked || usingSavedAddress === true
                                  ? 'cursor-not-allowed opacity-50'
                                  : ''
                              }
                              {...register('street')}
                            />
                          </Field>
                        </div>
                        <Field label="Número" error={errors.number?.message}>
                          <DarkInput
                            placeholder="Ex: 123"
                            disabled={usingSavedAddress === true}
                            className={
                              usingSavedAddress === true ? 'cursor-not-allowed opacity-50' : ''
                            }
                            {...register('number')}
                          />
                        </Field>
                        <Field label="Complemento">
                          <DarkInput
                            placeholder="Apto, bloco... (opcional)"
                            disabled={usingSavedAddress === true}
                            className={
                              usingSavedAddress === true ? 'cursor-not-allowed opacity-50' : ''
                            }
                            {...register('complement')}
                          />
                        </Field>
                        <Field label="Cidade" error={errors.city?.message}>
                          <DarkInput
                            disabled={cepLocked || usingSavedAddress === true}
                            className={
                              cepLocked || usingSavedAddress === true
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                            }
                            {...register('city')}
                          />
                        </Field>
                        <Field label="Estado" error={errors.state?.message}>
                          <DarkInput
                            placeholder="RN"
                            maxLength={2}
                            disabled={cepLocked || usingSavedAddress === true}
                            className={
                              cepLocked || usingSavedAddress === true
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                            }
                            {...register('state')}
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                )}

                {deliveryType === 'pickup' && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-[#111] px-4 py-3">
                    <p className="text-sm font-semibold text-white">Endereço da loja</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      Av. Paulista, 1000 — São Paulo, SP
                      <br />
                      Seg–Sáb: 9h–20h · Dom: 10h–16h
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Frete */}
            {step === 2 && (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
                <h2 className="mb-1 text-base font-bold text-white">Escolha o frete</h2>
                <p className="mb-5 text-sm text-white/40">
                  Opções disponíveis para o CEP <span className="text-white/60">{zipCode}</span>.
                </p>

                {shippingLoading && (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculando opções de frete...
                  </div>
                )}

                {shippingError && !shippingLoading && (
                  <div className="space-y-3">
                    <p className="text-sm text-red-400">{shippingError}</p>
                    <button
                      type="button"
                      onClick={() => calculateShipping()}
                      className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                    >
                      <Truck className="h-4 w-4" />
                      Tentar novamente
                    </button>
                  </div>
                )}

                {shippingOptions && shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                          selectedShipping?.id === opt.id
                            ? 'border-[#4a9fd4] bg-[#4a9fd4]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingOption"
                          className="sr-only"
                          checked={selectedShipping?.id === opt.id}
                          onChange={() => {
                            setSelectedShipping(opt)
                            setShippingError('')
                          }}
                        />
                        <div className="flex items-center gap-3">
                          <Truck className="h-4 w-4 text-white/40" />
                          <div>
                            <p className="text-sm font-semibold text-white">{opt.name}</p>
                            <p className="text-xs text-white/40">
                              {opt.company} · até {opt.days} dias úteis
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${opt.price === 0 ? 'text-green-400' : 'text-white'}`}
                        >
                          {opt.price === 0 ? 'Grátis' : formatCurrency(opt.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {!shippingLoading && !shippingOptions && !shippingError && (
                  <button
                    type="button"
                    onClick={() => calculateShipping()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#4a9fd4] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  >
                    <Truck className="h-4 w-4" />
                    Calcular frete
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Pagamento */}
            {step === 3 && (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
                <h2 className="mb-1 text-base font-bold text-white">Como quer pagar?</h2>
                <p className="mb-5 text-sm text-white/40">Escolha a forma de pagamento.</p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                        paymentMethod === value
                          ? 'border-[#4a9fd4] bg-[#4a9fd4]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register('paymentMethod')}
                        className="sr-only"
                      />
                      <Icon
                        className={`h-5 w-5 ${paymentMethod === value ? 'text-[#4a9fd4]' : 'text-white/30'}`}
                      />
                      <span className="text-sm font-semibold text-white">{label}</span>
                    </label>
                  ))}
                </div>

                {errors.paymentMethod && (
                  <p className="mt-2 text-xs text-red-400">{errors.paymentMethod.message}</p>
                )}

                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <div className="mt-5 rounded-xl border border-[#4a9fd4]/30 bg-[#4a9fd4]/10 px-4 py-3">
                    <p className="text-sm font-semibold text-[#4a9fd4]">
                      {paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4a9fd4]/70">
                      A máquina será levada na hora da entrega. Nenhum dado de cartão é necessário
                      agora.
                    </p>
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-green-400">Pagamento via PIX</p>
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
                  onClick={prevStep}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
              )}

              {step < 3 ? (
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
                  form="checkout-form"
                  disabled={isPending || !paymentMethod}
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
                Cupom aplicado — {formatCurrency(appliedCoupon.discount)} de desconto
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
                {selectedShipping ? (
                  <span
                    className={
                      selectedShipping.price === 0 ? 'font-semibold text-green-400' : 'text-white'
                    }
                  >
                    {selectedShipping.price === 0
                      ? 'Grátis'
                      : formatCurrency(selectedShipping.price)}
                  </span>
                ) : deliveryType === 'pickup' ? (
                  <span className="font-semibold text-green-400">Grátis</span>
                ) : (
                  <span className="text-xs text-white/30">a calcular</span>
                )}
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
          </div>
        </div>
      </div>
    </div>
  )
}
