'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ImagePlus,
  Trash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Product, ProductVariant, SizeLabel } from '@/features/products/types/product.types'
import { SIZES } from '@/features/products/types/product.types'

interface ProductVariantModalProps {
  product: Product
  onClose: () => void
}

interface VariantFormState {
  colorName: string
  colorHex: string
  images: string[]
  sizes: Record<SizeLabel, number>
}

const EMPTY_FORM: VariantFormState = {
  colorName: '',
  colorHex: '#000000',
  images: [],
  sizes: { PP: 0, P: 0, M: 0, G: 0, GG: 0, XGG: 0 },
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve((e.target?.result as string) ?? '')
    reader.readAsDataURL(file)
  })
}

export function ProductVariantModal({ product, onClose }: ProductVariantModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<VariantFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  useEffect(() => {
    fetch(`/api/products/${product.id}/variants`)
      .then((r) => r.json())
      .then((d) => setVariants(Array.isArray(d) ? d : (d.data ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const dataUrls = (await Promise.all(Array.from(files).map(readFileAsDataURL))).filter(Boolean)
    setForm((f) => ({ ...f, images: [...f.images, ...dataUrls] }))
  }

  function removeImage(i: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
  }

  function onDragStart(i: number) {
    dragIndex.current = i
  }
  function onDrop(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return
    const next = [...form.images]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(i, 0, moved)
    setForm((f) => ({ ...f, images: next }))
    dragIndex.current = null
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(v: ProductVariant) {
    const sizes = { PP: 0, P: 0, M: 0, G: 0, GG: 0, XGG: 0 } as Record<SizeLabel, number>
    v.sizes.forEach((s) => {
      sizes[s.size] = s.stock
    })
    setForm({ colorName: v.colorName, colorHex: v.colorHex ?? '#000000', images: v.images, sizes })
    setEditingId(v.id)
    setError('')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSave() {
    if (!form.colorName.trim()) {
      setError('Informe o nome da cor')
      return
    }
    if (form.images.length === 0) {
      setError('Adicione pelo menos uma foto')
      return
    }

    setSaving(true)
    setError('')
    try {
      const body = {
        colorName: form.colorName.trim(),
        colorHex: form.colorHex,
        images: form.images,
        sizes: SIZES.map((s) => ({ size: s, stock: form.sizes[s] })),
      }

      const url = editingId
        ? `/api/products/${product.id}/variants/${editingId}`
        : `/api/products/${product.id}/variants`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao salvar')
        return
      }

      if (editingId) {
        setVariants((vs) => vs.map((v) => (v.id === editingId ? json : v)))
      } else {
        setVariants((vs) => [...vs, json])
      }
      cancelForm()
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/products/${product.id}/variants/${id}`, { method: 'DELETE' })
      setVariants((vs) => vs.filter((v) => v.id !== id))
    } catch {
      /* ignora */
    } finally {
      setDeletingId(null)
    }
  }

  const totalStock = variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0),
    0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Cores &amp; Tamanhos — {product.name}
            </h2>
            <p className="text-xs text-gray-400">
              {variants.length} {variants.length === 1 ? 'cor' : 'cores'} · {totalStock} peças no
              total
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted rounded-md p-1.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <>
              {/* Lista de variantes */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                    >
                      {/* Cor + fotos */}
                      <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <div
                          className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: v.colorHex ?? '#ccc' }}
                        />
                        <p className="max-w-[56px] text-center text-[10px] leading-tight font-semibold text-gray-500">
                          {v.colorName}
                        </p>
                      </div>

                      {/* Miniaturas */}
                      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                        {v.images.slice(0, 4).map((img, i) => (
                          <div
                            key={i}
                            className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-200"
                          >
                            <Image
                              src={img}
                              alt={`${v.colorName} ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ))}
                        {v.images.length > 4 && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-xs font-semibold text-gray-500">
                            +{v.images.length - 4}
                          </div>
                        )}
                      </div>

                      {/* Tamanhos */}
                      <div className="shrink-0 text-right">
                        {v.sizes.length > 0 ? (
                          <div className="flex flex-wrap justify-end gap-1">
                            {v.sizes.map((s) => (
                              <span
                                key={s.id}
                                className="rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700"
                              >
                                {s.size}: {s.stock}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">sem estoque</span>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          onClick={() => openEdit(v)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-[#4A6CF7]"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deletingId === v.id}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                          title="Excluir"
                        >
                          {deletingId === v.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão nova cor */}
              {!showForm && (
                <button
                  onClick={openCreate}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3.5 text-sm font-semibold text-gray-500 transition-colors hover:border-[#4A6CF7]/40 hover:text-[#4A6CF7]"
                >
                  <Plus className="h-4 w-4" />
                  {variants.length === 0 ? 'Adicionar primeira cor' : 'Adicionar outra cor'}
                </button>
              )}

              {/* Formulário inline */}
              {showForm && (
                <div className="space-y-4 rounded-xl border border-[#4A6CF7]/20 bg-[#4A6CF7]/3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {editingId ? 'Editar cor' : 'Nova cor'}
                    </h3>
                    <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Nome + seletor de cor */}
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">
                        Nome da cor *
                      </label>
                      <input
                        value={form.colorName}
                        onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))}
                        placeholder="Ex: Azul Royal, Preto, Branco Gelo..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#4A6CF7] focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">Cor</label>
                      <input
                        type="color"
                        value={form.colorHex}
                        onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))}
                        className="h-[38px] w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
                      />
                    </div>
                  </div>

                  {/* Fotos */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500">
                      Fotos desta cor *
                    </label>
                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.images.map((src, i) => (
                          <div
                            key={i}
                            draggable
                            onDragStart={() => onDragStart(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDrop(i)}
                            className="group relative h-16 w-16 cursor-grab overflow-hidden rounded-lg border border-gray-200 active:cursor-grabbing"
                          >
                            <Image
                              src={src}
                              alt={`foto ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            <span className="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                              {i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        handleFiles(e.dataTransfer.files)
                      }}
                      className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center transition-colors hover:border-[#4A6CF7]/50 hover:bg-[#4A6CF7]/4"
                    >
                      <ImagePlus className="h-5 w-5 text-gray-400" />
                      <p className="text-xs font-medium text-gray-500">
                        Clique ou arraste as fotos
                      </p>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>

                  {/* Tamanhos e estoque */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500">
                      Estoque por tamanho
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {SIZES.map((size) => (
                        <div key={size} className="space-y-1 text-center">
                          <span className="block text-xs font-bold text-gray-600">{size}</span>
                          <input
                            type="number"
                            min={0}
                            value={form.sizes[size] || ''}
                            placeholder="0"
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                sizes: {
                                  ...f.sizes,
                                  [size]: Math.max(0, parseInt(e.target.value) || 0),
                                },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-center text-sm font-semibold text-gray-700 focus:border-[#4A6CF7] focus:ring-1 focus:ring-[#4A6CF7]/30 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Total desta cor: {Object.values(form.sizes).reduce((a, b) => a + b, 0)} peças
                    </p>
                  </div>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4A6CF7] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a5ce5] disabled:opacity-50"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editingId ? 'Salvar alterações' : 'Adicionar cor'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
