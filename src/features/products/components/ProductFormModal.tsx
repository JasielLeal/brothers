'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Loader2,
  X,
  ImagePlus,
  Trash2,
  Calculator,
  Plus,
  Trash,
  Palette,
  Pencil,
  Upload,
} from 'lucide-react'
import { uploadToCloudinary } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { productSchema, type ProductInput } from '@/features/products/schemas/product.schema'
import {
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useBrands,
  useProductTypes,
} from '@/features/products/hooks/useProducts'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import type { Product } from '@/features/products/types/product.types'
import { SIZES, type SizeLabel } from '@/features/products/types/product.types'

interface ProductFormModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
}

interface LocalVariant {
  id?: string
  colorName: string
  colorHex: string
  images: string[]
  sizes: Record<SizeLabel, number>
  _deleted?: boolean
}

const EMPTY_VARIANT: LocalVariant = {
  colorName: '',
  colorHex: '#000000',
  images: [],
  sizes: { PP: 0, P: 0, M: 0, G: 0, GG: 0, XGG: 0 },
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ProductFormModal({ open, product, onClose }: ProductFormModalProps) {
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: productTypes } = useProductTypes()
  const { data: suppliersData } = useSuppliers({ isActive: true, limit: 100 })
  const suppliers = suppliersData?.data ?? []

  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct()
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct()
  const isPending = isCreating || isUpdating

  const variantFileInputRef = useRef<HTMLInputElement>(null)
  const variantDragIndex = useRef<number | null>(null)

  // ── Variants ─────────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<LocalVariant[]>([])
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(null)
  const [variantForm, setVariantForm] = useState<LocalVariant>(EMPTY_VARIANT)
  const [variantError, setVariantError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!product?.id) return
    fetch(`/api/products/${product.id}/variants`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setVariants(
          list.map((v: any) => {
            const sizes = { PP: 0, P: 0, M: 0, G: 0, GG: 0, XGG: 0 } as Record<SizeLabel, number>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            v.sizes?.forEach((s: any) => {
              sizes[s.size as SizeLabel] = s.stock
            })
            return {
              id: v.id,
              colorName: v.colorName,
              colorHex: v.colorHex ?? '#000000',
              images: v.images,
              sizes,
            }
          })
        )
      })
      .catch(() => {})
  }, [product?.id])

  // ── Main form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice ?? undefined,
          brandId: product.brandId ?? undefined,
          typeId: product.typeId ?? undefined,
          costPrice: product.costPrice ?? undefined,
          marginPercent: product.marginPercent ?? undefined,
          supplierId: product.supplierId ?? undefined,
          categoryId: product.category.id,
          stock: product.stock,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          images: product.images,
        }
      : { isActive: true, isFeatured: false, images: [], stock: 0 },
  })

  const costPrice = useWatch({ control, name: 'costPrice' })
  const marginPercent = useWatch({ control, name: 'marginPercent' })

  const cost = Number(costPrice)
  const margin = Number(marginPercent)
  const hasPriceCalc = cost > 0 && margin >= 0

  useEffect(() => {
    if (cost > 0 && margin >= 0) {
      setValue('price', Math.round(cost * (1 + margin / 100) * 100) / 100, { shouldValidate: true })
    }
  }, [cost, margin, setValue])

  // ── Variant image helpers ────────────────────────────────────────────────────
  const MAX_VARIANT_IMAGES = 5
  const [uploadingImages, setUploadingImages] = useState(false)

  async function handleVariantFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const slots = MAX_VARIANT_IMAGES - variantForm.images.length
    if (slots <= 0) return
    const selected = Array.from(files).slice(0, slots)
    setUploadingImages(true)
    try {
      const urls = await Promise.all(
        selected.map((f) => uploadToCloudinary(f, 'brothers-outlet/products'))
      )
      setVariantForm((f) => ({ ...f, images: [...f.images, ...urls.filter(Boolean)] }))
    } catch {
      // upload error — silently ignore partial failures
    } finally {
      setUploadingImages(false)
    }
  }

  function removeVariantImage(i: number) {
    setVariantForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
  }

  function onVariantDragStart(i: number) {
    variantDragIndex.current = i
  }
  function onVariantDrop(i: number) {
    if (variantDragIndex.current === null || variantDragIndex.current === i) return
    const next = [...variantForm.images]
    const [moved] = next.splice(variantDragIndex.current, 1)
    next.splice(i, 0, moved)
    setVariantForm((f) => ({ ...f, images: next }))
    variantDragIndex.current = null
  }

  // ── Variant list helpers ─────────────────────────────────────────────────────
  const visibleVariants = variants.filter((v) => !v._deleted)

  function openAddVariant() {
    setVariantForm(EMPTY_VARIANT)
    setEditingVariantIdx(variants.length)
    setVariantError('')
  }

  function openEditVariant(idx: number) {
    setVariantForm({ ...variants[idx] })
    setEditingVariantIdx(idx)
    setVariantError('')
  }

  function cancelVariantForm() {
    setEditingVariantIdx(null)
    setVariantForm(EMPTY_VARIANT)
    setVariantError('')
  }

  function confirmVariant() {
    if (!variantForm.colorName.trim()) {
      setVariantError('Informe o nome da cor')
      return
    }
    if (variantForm.images.length === 0) {
      setVariantError('Adicione pelo menos uma foto desta cor')
      return
    }
    if (editingVariantIdx === null) return

    setVariants((vs) => {
      const next = [...vs]
      const entry: LocalVariant = { ...variantForm, colorName: variantForm.colorName.trim() }
      if (editingVariantIdx < next.length) {
        entry.id = next[editingVariantIdx].id
        next[editingVariantIdx] = entry
      } else {
        next.push(entry)
      }
      return next
    })
    cancelVariantForm()
  }

  function deleteVariant(idx: number) {
    setVariants((vs) => {
      const next = [...vs]
      if (next[idx].id) {
        next[idx] = { ...next[idx], _deleted: true }
      } else {
        next.splice(idx, 1)
      }
      return next
    })
    if (editingVariantIdx === idx) cancelVariantForm()
  }

  // ── Sync variants after product save ────────────────────────────────────────
  async function syncVariants(productId: string) {
    const toDelete = variants.filter((v) => v._deleted && v.id)
    const toCreate = variants.filter((v) => !v._deleted && !v.id)
    const toUpdate = variants.filter((v) => !v._deleted && !!v.id)
    const sizesPayload = (v: LocalVariant) => SIZES.map((s) => ({ size: s, stock: v.sizes[s] }))

    const responses = await Promise.all([
      ...toDelete.map((v) =>
        fetch(`/api/products/${productId}/variants/${v.id}`, { method: 'DELETE' })
      ),
      ...toCreate.map((v) =>
        fetch(`/api/products/${productId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colorName: v.colorName,
            colorHex: v.colorHex,
            images: v.images,
            sizes: sizesPayload(v),
          }),
        })
      ),
      ...toUpdate.map((v) =>
        fetch(`/api/products/${productId}/variants/${v.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colorName: v.colorName,
            colorHex: v.colorHex,
            images: v.images,
            sizes: sizesPayload(v),
          }),
        })
      ),
    ])

    const failed = responses.filter((r) => !r.ok)
    if (failed.length > 0) {
      const detail = await failed[0].text().catch(() => '')
      throw new Error(`Erro ao salvar cor: ${detail || failed[0].status}`)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function onSubmit(data: ProductInput) {
    // Stock = soma de todos os tamanhos de todas as cores
    const totalStock = visibleVariants.reduce(
      (sum, v) => sum + Object.values(v.sizes).reduce((a, b) => a + b, 0),
      0
    )
    // Images = fotos da primeira cor (capa do produto)
    const coverImages = visibleVariants[0]?.images ?? []

    const payload: ProductInput = { ...data, stock: totalStock, images: coverImages }

    setSyncError('')
    setIsSyncing(true)
    try {
      let productId: string
      if (product) {
        const updated = await updateProduct({ id: product.id, data: payload })
        productId = updated.id
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }
      await syncVariants(productId)
      onClose()
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Erro ao salvar cores')
    } finally {
      setIsSyncing(false)
    }
  }

  const submitting = isPending || isSyncing

  // Stock preview computed live
  const liveStock = visibleVariants.reduce(
    (sum, v) => sum + Object.values(v.sizes).reduce((a, b) => a + b, 0),
    0
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="hover:bg-muted rounded-md p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            {/* ── 2-column: info + pricing ────────────────────────────────── */}
            <div className="grid grid-cols-[1fr_1px_1fr]">
              {/* LEFT */}
              <div className="space-y-4 p-6">
                <div className="space-y-1">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    rows={5}
                    className="placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm transition-colors focus-visible:border-[#4A6CF7] focus-visible:bg-white focus-visible:ring-1 focus-visible:outline-none"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-destructive text-xs">{errors.description.message}</p>
                  )}
                </div>

                {/* Marca + Tipo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Marca</Label>
                    <Controller
                      name="brandId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sem marca" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sem marca</SelectItem>
                            {brands?.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Controller
                      name="typeId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sem tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sem tipo</SelectItem>
                            {productTypes?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Fornecedor + Categoria */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Fornecedor</Label>
                    <Controller
                      name="supplierId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sem fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sem fornecedor</SelectItem>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.categoryId && (
                      <p className="text-destructive text-xs">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-5 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded" />
                    Ativo
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register('isFeatured')}
                      className="h-4 w-4 rounded"
                    />
                    Destaque
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="bg-border" />

              {/* RIGHT: pricing */}
              <div className="space-y-4 p-6">
                {/* Precificação */}
                <div className="space-y-3 rounded-xl border border-dashed border-[#4A6CF7]/40 bg-[#4A6CF7]/3 p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#4A6CF7]" />
                    <span className="text-sm font-medium text-[#4A6CF7]">Precificação</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="costPrice">Custo</Label>
                      <Controller
                        name="costPrice"
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id="costPrice"
                            placeholder="R$ 0,00"
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                          />
                        )}
                      />
                      {errors.costPrice && (
                        <p className="text-destructive text-xs">{errors.costPrice.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="marginPercent">Margem (%)</Label>
                      <Input
                        id="marginPercent"
                        type="number"
                        step="0.1"
                        placeholder="ex: 50"
                        {...register('marginPercent')}
                      />
                    </div>
                  </div>

                  {hasPriceCalc && (
                    <div className="flex items-center justify-between rounded-lg bg-[#4A6CF7]/10 px-3 py-2">
                      <span className="text-xs text-gray-500">
                        R$ {cost.toFixed(2).replace('.', ',')} + {margin}% =
                      </span>
                      <span className="text-sm font-bold text-[#4A6CF7]">
                        R$ {(cost * (1 + margin / 100)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="price">
                        Preço de venda
                        {hasPriceCalc && (
                          <span className="ml-1 text-[10px] text-[#4A6CF7]">auto</span>
                        )}
                      </Label>
                      <Controller
                        name="price"
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id="price"
                            placeholder="R$ 0,00"
                            value={field.value ?? ''}
                            onValueChange={(v) => field.onChange(v ?? 0)}
                          />
                        )}
                      />
                      {errors.price && (
                        <p className="text-destructive text-xs">{errors.price.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="originalPrice">Preço &quot;De&quot;</Label>
                      <Controller
                        name="originalPrice"
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id="originalPrice"
                            placeholder="R$ 0,00 (opcional)"
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Estoque calculado */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Estoque total
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Calculado automaticamente pelas cores
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold ${liveStock === 0 ? 'text-red-400' : liveStock <= 10 ? 'text-amber-500' : 'text-green-600'}`}
                      >
                        {liveStock}
                      </span>
                      <p className="text-xs text-gray-400">peças</p>
                    </div>
                  </div>
                  {visibleVariants.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3">
                      {visibleVariants.map((v, i) => {
                        const total = Object.values(v.sizes).reduce((a, b) => a + b, 0)
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: v.colorHex }}
                            />
                            <span className="flex-1 truncate text-xs text-gray-600">
                              {v.colorName}
                            </span>
                            <div className="flex gap-1">
                              {SIZES.filter((s) => v.sizes[s] > 0).map((s) => (
                                <span key={s} className="text-[10px] font-semibold text-gray-500">
                                  {s}:{v.sizes[s]}
                                </span>
                              ))}
                            </div>
                            <span className="w-6 text-right text-xs font-bold text-gray-700">
                              {total}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Cores & Tamanhos (full-width) ───────────────────────────── */}
            <div className="space-y-4 border-t px-6 py-5">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">Cores &amp; Tamanhos</span>
                {visibleVariants.length > 0 && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-600">
                    {visibleVariants.length} {visibleVariants.length === 1 ? 'cor' : 'cores'}
                  </span>
                )}
              </div>

              {/* Variant cards */}
              {visibleVariants.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {variants.map((v, idx) => {
                    if (v._deleted) return null
                    const total = Object.values(v.sizes).reduce((a, b) => a + b, 0)
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                      >
                        {/* Swatch */}
                        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                          <div
                            className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <p className="max-w-13 text-center text-[10px] leading-tight font-semibold text-gray-500">
                            {v.colorName}
                          </p>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex flex-1 flex-wrap gap-1.5">
                          {v.images.slice(0, 3).map((img, i) => (
                            <div
                              key={i}
                              className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-200"
                            >
                              <Image src={img} alt="" fill className="object-cover" sizes="40px" />
                            </div>
                          ))}
                          {v.images.length > 3 && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-[11px] font-semibold text-gray-500">
                              +{v.images.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Sizes + total */}
                        <div className="shrink-0 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {SIZES.filter((s) => v.sizes[s] > 0).map((s) => (
                              <span
                                key={s}
                                className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-700"
                              >
                                {s}:{v.sizes[s]}
                              </span>
                            ))}
                          </div>
                          {total > 0 && (
                            <p className="mt-1 text-xs font-bold text-gray-500">{total} peças</p>
                          )}
                          {total === 0 && (
                            <span className="text-[11px] text-gray-400">sem estoque</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => openEditVariant(idx)}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-[#4A6CF7]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteVariant(idx)}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add button */}
              {editingVariantIdx === null && (
                <button
                  type="button"
                  onClick={openAddVariant}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-semibold text-gray-500 transition-colors hover:border-purple-300 hover:text-purple-500"
                >
                  <Plus className="h-4 w-4" />
                  {visibleVariants.length === 0
                    ? 'Adicionar cores e tamanhos'
                    : 'Adicionar outra cor'}
                </button>
              )}

              {/* Inline variant form */}
              {editingVariantIdx !== null && (
                <div className="space-y-4 rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {variants[editingVariantIdx]?.id ? 'Editar cor' : 'Nova cor'}
                    </p>
                    <button
                      type="button"
                      onClick={cancelVariantForm}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Color name + hex */}
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <Label>Nome da cor *</Label>
                      <input
                        value={variantForm.colorName}
                        onChange={(e) =>
                          setVariantForm((f) => ({ ...f, colorName: e.target.value }))
                        }
                        placeholder="Ex: Azul Royal, Preto, Branco Gelo..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-300/30 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Cor</Label>
                      <input
                        type="color"
                        value={variantForm.colorHex}
                        onChange={(e) =>
                          setVariantForm((f) => ({ ...f, colorHex: e.target.value }))
                        }
                        className="h-9.5 w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
                      />
                    </div>
                  </div>

                  {/* Variant images */}
                  <div className="space-y-2">
                    <Label>Fotos desta cor *</Label>
                    {variantForm.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {variantForm.images.map((src, i) => (
                          <div
                            key={i}
                            draggable
                            onDragStart={() => onVariantDragStart(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onVariantDrop(i)}
                            className="group relative h-14 w-14 cursor-grab overflow-hidden rounded-lg border border-gray-200 active:cursor-grabbing"
                          >
                            <Image
                              src={src}
                              alt={`foto ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                            <span className="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                              {i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeVariantImage(i)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {variantForm.images.length < MAX_VARIANT_IMAGES ? (
                      <button
                        type="button"
                        onClick={() => !uploadingImages && variantFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          handleVariantFiles(e.dataTransfer.files)
                        }}
                        disabled={uploadingImages}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-3 text-sm text-gray-500 transition-colors hover:border-purple-300 hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingImages ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Enviando para Cloudinary...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" /> Clique ou arraste ·{' '}
                            {variantForm.images.length}/{MAX_VARIANT_IMAGES} fotos
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-center text-xs text-gray-400">
                        Limite de {MAX_VARIANT_IMAGES} fotos atingido · Remova uma para adicionar
                        outra
                      </p>
                    )}
                    <input
                      ref={variantFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleVariantFiles(e.target.files)}
                    />
                  </div>

                  {/* Sizes */}
                  <div className="space-y-2">
                    <Label>Estoque por tamanho</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {SIZES.map((size) => (
                        <div key={size} className="space-y-1 text-center">
                          <span className="block text-xs font-bold text-gray-600">{size}</span>
                          <input
                            type="number"
                            min={0}
                            value={variantForm.sizes[size] || ''}
                            placeholder="0"
                            onChange={(e) =>
                              setVariantForm((f) => ({
                                ...f,
                                sizes: {
                                  ...f.sizes,
                                  [size]: Math.max(0, parseInt(e.target.value) || 0),
                                },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-1 py-2 text-center text-sm font-semibold text-gray-700 focus:border-purple-400 focus:ring-1 focus:ring-purple-300/30 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Total desta cor: {Object.values(variantForm.sizes).reduce((a, b) => a + b, 0)}{' '}
                      peças
                    </p>
                  </div>

                  {variantError && <p className="text-xs text-red-500">{variantError}</p>}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelVariantForm}
                      className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmVariant}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-600"
                    >
                      Confirmar cor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-3 border-t px-6 py-4">
            {syncError && <p className="text-center text-sm text-red-500">{syncError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || editingVariantIdx !== null}>
                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {product ? 'Salvar alterações' : 'Criar produto'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
