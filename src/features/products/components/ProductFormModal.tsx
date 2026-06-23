'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, X, ImagePlus, Trash2, Calculator } from 'lucide-react'
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

interface ProductFormModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
}

export function ProductFormModal({ open, product, onClose }: ProductFormModalProps) {
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: productTypes } = useProductTypes()
  const { data: suppliersData } = useSuppliers({ isActive: true, limit: 100 })
  const suppliers = suppliersData?.data ?? []

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct()
  const isPending = isCreating || isUpdating

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

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

  const previews = useWatch({ control, name: 'images' }) ?? []
  const costPrice = useWatch({ control, name: 'costPrice' })
  const marginPercent = useWatch({ control, name: 'marginPercent' })

  useEffect(() => {
    const cost = Number(costPrice)
    const margin = Number(marginPercent)
    if (cost > 0 && margin >= 0) {
      setValue('price', Math.round(cost * (1 + margin / 100) * 100) / 100, { shouldValidate: true })
    }
  }, [costPrice, marginPercent, setValue])

  function readFileAsDataURL(file: File) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) ?? '')
      reader.readAsDataURL(file)
    })
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const dataUrls = (await Promise.all(Array.from(files).map(readFileAsDataURL))).filter(Boolean)
    setValue('images', [...previews, ...dataUrls], { shouldValidate: true })
  }

  function removeImage(index: number) {
    setValue(
      'images',
      previews.filter((_, i) => i !== index),
      { shouldValidate: true }
    )
  }

  function onDragStart(i: number) {
    dragIndex.current = i
  }
  function onDrop(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return
    const next = [...previews]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(i, 0, moved)
    setValue('images', next, { shouldValidate: true })
    dragIndex.current = null
  }

  function onSubmit(data: ProductInput) {
    if (product) {
      updateProduct({ id: product.id, data }, { onSuccess: onClose })
    } else {
      createProduct(data, { onSuccess: onClose })
    }
  }

  const cost = Number(costPrice)
  const margin = Number(marginPercent)
  const hasPriceCalc = cost > 0 && margin >= 0

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="hover:bg-muted rounded-md p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — two columns */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-[1fr_1px_1fr] overflow-y-auto">
            {/* ── LEFT: info + images ─────────────────────── */}
            <div className="space-y-4 overflow-y-auto p-6">
              <div className="space-y-1">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  rows={4}
                  className="placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm transition-colors focus-visible:border-[#4A6CF7] focus-visible:bg-white focus-visible:ring-1 focus-visible:outline-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-destructive text-xs">{errors.description.message}</p>
                )}
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Imagens</Label>
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(i)}
                        className="group relative h-20 w-20 cursor-grab overflow-hidden rounded-lg border border-gray-200 active:cursor-grabbing"
                      >
                        <Image
                          src={src}
                          alt={`Imagem ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
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
                  className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center transition-colors hover:border-[#4A6CF7]/50 hover:bg-[#4A6CF7]/4"
                >
                  <ImagePlus className="h-5 w-5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">Clique ou arraste as imagens</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WEBP — múltiplas</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {errors.images && (
                  <p className="text-destructive text-xs">{errors.images.message as string}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="bg-border" />

            {/* ── RIGHT: pricing + metadata ───────────────── */}
            <div className="space-y-4 overflow-y-auto p-6">
              {/* Fornecedor */}
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

              {/* Categoria + Estoque */}
              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input id="stock" type="number" {...register('stock')} />
                  {errors.stock && (
                    <p className="text-destructive text-xs">{errors.stock.message}</p>
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
                  <input type="checkbox" {...register('isFeatured')} className="h-4 w-4 rounded" />
                  Destaque
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {product ? 'Salvar alterações' : 'Criar produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
