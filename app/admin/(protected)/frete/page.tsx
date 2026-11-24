'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Save, Loader2, Package, MapPin, Truck, CheckCircle2, AlertCircle } from 'lucide-react'

interface FreightConfig {
  id?: string
  originCep: string
  defaultWeight: number
  defaultHeight: number
  defaultWidth: number
  defaultLength: number
  freeAbove: number | null
}

const EMPTY: FreightConfig = {
  originCep: '',
  defaultWeight: 0.5,
  defaultHeight: 10,
  defaultWidth: 15,
  defaultLength: 20,
  freeAbove: null,
}

function InputField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold tracking-wide text-neutral-400 uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>}
    </div>
  )
}

const cls =
  'w-full rounded-xl border-0 bg-white/4 px-4 py-2.5 text-sm text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none'

export default function AdminFretePage() {
  const [form, setForm] = useState<FreightConfig>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testCep, setTestCep] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<
    { id?: number; name: string; company: string; price: number; days: number }[] | null
  >(null)
  const [testError, setTestError] = useState('')

  useEffect(() => {
    fetch('/api/admin/freight')
      .then((r) => r.json())
      .then((d) => {
        if (d) setForm(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/admin/freight', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao salvar')
        return
      }
      setForm(json)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    const cep = testCep.replace(/\D/g, '')
    if (cep.length !== 8) {
      setTestError('CEP inválido')
      return
    }
    setTesting(true)
    setTestError('')
    setTestResult(null)
    try {
      const res = await fetch('/api/freight/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep, totalValue: 150 }),
      })
      const json = await res.json()
      if (!res.ok) {
        setTestError(json.error ?? 'Erro')
        return
      }
      setTestResult(Array.isArray(json) ? json : (json.data ?? []))
    } catch {
      setTestError('Erro de conexão')
    } finally {
      setTesting(false)
    }
  }

  function set(key: keyof FreightConfig, value: string | number | null) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <PageHeader
        title="Frete"
        subtitle="Defina as regras e valores de frete da loja"
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? 'Salvo!' : 'Salvar configurações'}
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Origem ────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-[#141414] p-6 ring-1 ring-white/6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
              <MapPin className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">CEP de Origem</h2>
              <p className="text-xs text-neutral-500">Endereço de onde saem os pedidos</p>
            </div>
          </div>
          <InputField label="CEP da loja *" hint="CEP de onde os pedidos são despachados">
            <input
              value={form.originCep}
              onChange={(e) => set('originCep', e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={cls}
            />
          </InputField>
        </div>

        {/* ── Melhor Envio ──────────────────────────────────────────── */}
        <div className="rounded-3xl bg-[#141414] p-6 ring-1 ring-white/6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
              <Truck className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">Melhor Envio</h2>
              <p className="text-xs text-neutral-500">Configurações da API de cotação</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-white/4 px-4 py-3 ring-1 ring-white/6">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              <p className="text-xs text-neutral-400">
                O token da API está configurado via variável de ambiente{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                  MELHOR_ENVIO_TOKEN
                </code>{' '}
                no servidor.
              </p>
            </div>
            <InputField
              label="Frete grátis acima de (R$)"
              hint="Deixe vazio para desativar frete grátis automático"
            >
              <input
                type="number"
                value={form.freeAbove ?? ''}
                onChange={(e) =>
                  set('freeAbove', e.target.value === '' ? null : Number(e.target.value))
                }
                placeholder="Ex: 299"
                min={0}
                className={cls}
              />
            </InputField>
          </div>
        </div>

        {/* ── Dimensões padrão ──────────────────────────────────────── */}
        <div className="rounded-3xl bg-[#141414] p-6 ring-1 ring-white/6 lg:col-span-3">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
              <Package className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">Dimensões e Peso Padrão</h2>
              <p className="text-xs text-neutral-500">
                Usados para calcular o frete quando o produto não tem dimensões cadastradas
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InputField label="Peso (kg)">
              <input
                type="number"
                value={form.defaultWeight}
                onChange={(e) => set('defaultWeight', Number(e.target.value))}
                step={0.1}
                min={0.1}
                className={cls}
              />
            </InputField>
            <InputField label="Altura (cm)">
              <input
                type="number"
                value={form.defaultHeight}
                onChange={(e) => set('defaultHeight', Number(e.target.value))}
                min={1}
                className={cls}
              />
            </InputField>
            <InputField label="Largura (cm)">
              <input
                type="number"
                value={form.defaultWidth}
                onChange={(e) => set('defaultWidth', Number(e.target.value))}
                min={1}
                className={cls}
              />
            </InputField>
            <InputField label="Comprimento (cm)">
              <input
                type="number"
                value={form.defaultLength}
                onChange={(e) => set('defaultLength', Number(e.target.value))}
                min={1}
                className={cls}
              />
            </InputField>
          </div>
        </div>

        {/* ── Testar cotação ────────────────────────────────────────── */}
        <div className="rounded-3xl bg-[#141414] p-6 ring-1 ring-white/6 lg:col-span-3">
          <h2 className="mb-1 text-sm font-bold text-neutral-100">Testar Cotação</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Digite um CEP de destino para simular as opções de frete com as configurações atuais
          </p>
          <div className="flex gap-3">
            <input
              value={testCep}
              onChange={(e) => {
                setTestCep(e.target.value)
                setTestResult(null)
                setTestError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
              placeholder="CEP de destino"
              maxLength={9}
              className="flex-1 rounded-xl border-0 bg-white/4 px-4 py-2.5 text-sm text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-white/20 focus:outline-none"
            />
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Cotar
            </button>
          </div>

          {testError && <p className="mt-3 text-sm text-red-400">{testError}</p>}

          {testResult && testResult.length > 0 && (
            <div className="mt-4 space-y-2">
              {testResult.map((opt, i) => (
                <div
                  key={opt.id ?? i}
                  className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3 ring-1 ring-white/6"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-100">{opt.name}</p>
                    <p className="text-xs text-neutral-500">
                      {opt.company} · {opt.days} dias úteis
                    </p>
                  </div>
                  <span className="text-sm font-bold text-neutral-100">
                    {opt.price === 0 ? 'Grátis' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
