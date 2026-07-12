'use client'

import { useState } from 'react'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'
import { Plus, Pencil, Trash2, Loader2, Search, Tag, Bookmark, Layers } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useProductTypes,
  useCreateProductType,
  useUpdateProductType,
  useDeleteProductType,
} from '@/features/products/hooks/useProducts'
import { SIZE_SET_LABELS, type SizeSetType } from '@/features/products/types/product.types'

/* ── helpers ────────────────────────────────────────────── */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

interface SimpleEntity {
  id: string
  name: string
  slug: string
  createdAt: string
  hasVariants?: boolean
  sizeSet?: SizeSetType
  showInNav?: boolean
  lowStockThreshold?: number | null
}

const NAV_LIMIT = 8

/* ── EntityModal ────────────────────────────────────────── */
function EntityModal({
  entity,
  label,
  isPending,
  showHasVariants,
  showNavToggle,
  navSelectedCount,
  showLowStockThreshold,
  onClose,
  onSubmit,
}: {
  entity: SimpleEntity | null
  label: string
  isPending: boolean
  showHasVariants?: boolean
  showNavToggle?: boolean
  navSelectedCount?: number
  showLowStockThreshold?: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    slug: string
    hasVariants?: boolean
    sizeSet?: SizeSetType
    showInNav?: boolean
    lowStockThreshold?: number | null
  }) => void
}) {
  const [name, setName] = useState(entity?.name ?? '')
  const [slug, setSlug] = useState(entity?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!entity)
  const [hasVariants, setHasVariants] = useState(entity?.hasVariants ?? true)
  const [sizeSet, setSizeSet] = useState<SizeSetType>(entity?.sizeSet ?? 'CLOTHING')
  const [showInNav, setShowInNav] = useState(entity?.showInNav ?? false)
  const [lowStockThreshold, setLowStockThreshold] = useState(
    entity?.lowStockThreshold != null ? String(entity.lowStockThreshold) : ''
  )
  const [error, setError] = useState('')

  const navLimitReached = !entity?.showInNav && (navSelectedCount ?? 0) >= NAV_LIMIT

  function handleNameChange(val: string) {
    setName(val)
    if (!slugTouched) setSlug(toSlug(val))
  }

  function handleSlugChange(val: string) {
    setSlugTouched(true)
    setSlug(toSlug(val))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    if (!slug.trim()) {
      setError('Slug é obrigatório')
      return
    }
    const trimmedThreshold = lowStockThreshold.trim()
    if (trimmedThreshold && (!/^\d+$/.test(trimmedThreshold) || Number(trimmedThreshold) < 0)) {
      setError('Limite de estoque baixo deve ser um número inteiro positivo')
      return
    }
    setError('')
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      ...(showHasVariants ? { hasVariants, sizeSet: hasVariants ? sizeSet : undefined } : {}),
      ...(showNavToggle ? { showInNav } : {}),
      ...(showLowStockThreshold
        ? { lowStockThreshold: trimmedThreshold ? Number(trimmedThreshold) : null }
        : {}),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-neutral-100">
            {entity ? `Editar ${label}` : `Nova ${label}`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={`Ex: ${label === 'categoria' ? 'Camisetas' : label === 'marca' ? 'Nike' : 'Oversize'}`}
              className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">Slug</label>
            <input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="gerado-automaticamente"
              className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <p className="text-[11px] text-gray-400 dark:text-neutral-500">
              Gerado automaticamente a partir do nome
            </p>
          </div>

          {showHasVariants && (
            <>
              <label className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 dark:border-neutral-700">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4A6CF7] focus:ring-[#4A6CF7]/20 dark:border-neutral-600"
                />
                <span className="text-sm text-gray-700 dark:text-neutral-200">
                  Produtos desta categoria têm variação de cor/tamanho
                  <span className="mt-0.5 block text-[11px] text-gray-400 dark:text-neutral-500">
                    Desmarque para categorias sem nenhuma variação, onde o produto tem apenas
                    quantidade em estoque.
                  </span>
                </span>
              </label>

              {hasVariants && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">
                    Tipo de tamanho
                  </label>
                  <select
                    value={sizeSet}
                    onChange={(e) => setSizeSet(e.target.value as SizeSetType)}
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="CLOTHING">Roupa (PP, P, M, G, GG, XGG)</option>
                    <option value="SHOE">Calçado (33 a 44)</option>
                    <option value="UNIQUE">Só cor (sem tamanho, ex: boné)</option>
                  </select>
                </div>
              )}
            </>
          )}

          {showNavToggle && (
            <label
              className={`flex items-start gap-2 rounded-lg border border-gray-200 p-3 dark:border-neutral-700 ${navLimitReached ? 'opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={showInNav}
                disabled={navLimitReached}
                onChange={(e) => setShowInNav(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4A6CF7] focus:ring-[#4A6CF7]/20 dark:border-neutral-600"
              />
              <span className="text-sm text-gray-700 dark:text-neutral-200">
                Mostrar na navbar
                <span className="mt-0.5 block text-[11px] text-gray-400 dark:text-neutral-500">
                  {navLimitReached
                    ? `Limite de ${NAV_LIMIT} categorias na navbar atingido. Desmarque outra para liberar espaço.`
                    : `Máximo de ${NAV_LIMIT} categorias podem aparecer na navbar (${navSelectedCount ?? 0}/${NAV_LIMIT} selecionadas).`}
                </span>
              </span>
            </label>
          )}

          {showLowStockThreshold && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-neutral-200">
                Limite de estoque baixo
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="Sem limite definido"
                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20 dark:border-neutral-700 dark:bg-neutral-900"
              />
              <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                Quando o estoque total desta categoria cair para este valor ou menos, ela aparece
                como estoque baixo no dashboard. Deixe em branco para não monitorar.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-[#4A6CF7] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3a5ce6] disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {entity ? 'Salvar' : `Criar ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── DeleteConfirm ──────────────────────────────────────── */
function DeleteConfirm({
  entity,
  label,
  isPending,
  onClose,
  onConfirm,
}: {
  entity: SimpleEntity
  label: string
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-neutral-100">
            Excluir {label}
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Tem certeza que deseja excluir{' '}
            <span className="font-semibold text-gray-700 dark:text-neutral-200">
              &ldquo;{entity.name}&rdquo;
            </span>
            ?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── EntityTable ────────────────────────────────────────── */
function EntityTable({
  label,
  labelPlural,
  EmptyIcon,
  items,
  isLoading,
  showHasVariants,
  showNavToggle,
  showLowStockThreshold,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}: {
  label: string
  labelPlural: string
  EmptyIcon: React.ElementType
  items: SimpleEntity[]
  isLoading: boolean
  showHasVariants?: boolean
  showNavToggle?: boolean
  showLowStockThreshold?: boolean
  onCreate: (data: {
    name: string
    slug: string
    hasVariants?: boolean
    sizeSet?: SizeSetType
    showInNav?: boolean
    lowStockThreshold?: number | null
  }) => void
  onUpdate: (
    id: string,
    data: {
      name: string
      slug: string
      hasVariants?: boolean
      sizeSet?: SizeSetType
      showInNav?: boolean
      lowStockThreshold?: number | null
    }
  ) => void
  onDelete: (id: string) => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SimpleEntity | null>(null)
  const [deleting, setDeleting] = useState<SimpleEntity | null>(null)

  const navSelectedCount = items.filter((item) => item.showInNav).length

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${labelPlural}...`}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-[#4A6CF7] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3a5ce6]"
        >
          <Plus className="h-4 w-4" />
          {`Nova ${label}`}
        </button>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:ring-neutral-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300 dark:text-neutral-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400 dark:text-neutral-500">
            <EmptyIcon className="h-8 w-8" />
            <p className="text-sm">
              {search ? `Nenhuma ${label} encontrada` : `Nenhuma ${label} ainda`}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
                className="mt-2 text-sm font-medium text-[#4A6CF7] hover:underline"
              >
                {`Criar primeira ${label}`}
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-neutral-800">
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500">
                  Nome
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500">
                  Slug
                </th>
                {showHasVariants && (
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500">
                    Variação
                  </th>
                )}
                {showNavToggle && (
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500">
                    Navbar
                  </th>
                )}
                {showLowStockThreshold && (
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500">
                    Limite baixo
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-neutral-500">
                  Criado em
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="group transition-colors hover:bg-gray-50/60 dark:hover:bg-neutral-800/60"
                >
                  <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-neutral-100">
                    {item.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {item.slug}
                    </span>
                  </td>
                  {showHasVariants && (
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          item.hasVariants
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}
                      >
                        {item.hasVariants
                          ? SIZE_SET_LABELS[item.sizeSet ?? 'CLOTHING']
                          : 'Só quantidade'}
                      </span>
                    </td>
                  )}
                  {showNavToggle && (
                    <td className="px-5 py-3.5">
                      {item.showInNav ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Visível
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-neutral-600">—</span>
                      )}
                    </td>
                  )}
                  {showLowStockThreshold && (
                    <td className="px-5 py-3.5 text-gray-500 dark:text-neutral-400">
                      {item.lowStockThreshold != null ? (
                        item.lowStockThreshold
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-neutral-600">
                          Não monitorado
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-gray-400 dark:text-neutral-500">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditing(item)
                          setModalOpen(true)
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-[#4A6CF7] dark:text-neutral-500 dark:hover:bg-neutral-800"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(item)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-neutral-500">
        {filtered.length} {filtered.length !== 1 ? labelPlural : label}
      </p>

      {modalOpen && (
        <EntityModal
          entity={editing}
          label={label}
          isPending={isCreating || isUpdating}
          showHasVariants={showHasVariants}
          showNavToggle={showNavToggle}
          navSelectedCount={navSelectedCount}
          showLowStockThreshold={showLowStockThreshold}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSubmit={(data) => {
            if (editing) {
              onUpdate(editing.id, data)
            } else {
              onCreate(data)
            }
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <DeleteConfirm
          entity={deleting}
          label={label}
          isPending={isDeleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            onDelete(deleting.id)
            setDeleting(null)
          }}
        />
      )}
    </div>
  )
}

/* ── page ───────────────────────────────────────────────── */
const TABS = [
  { key: 'categories', label: 'Categorias', icon: Tag },
  { key: 'brands', label: 'Marcas', icon: Bookmark },
  { key: 'types', label: 'Tipos', icon: Layers },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('categories')

  const { data: categories = [], isLoading: loadingCat } = useCategories()
  const { mutate: createCat, isPending: creatingCat } = useCreateCategory()
  const { mutate: updateCat, isPending: updatingCat } = useUpdateCategory()
  const { mutate: deleteCat, isPending: deletingCat } = useDeleteCategory()

  const { data: brands = [], isLoading: loadingBrand } = useBrands()
  const { mutate: createBrand, isPending: creatingBrand } = useCreateBrand()
  const { mutate: updateBrand, isPending: updatingBrand } = useUpdateBrand()
  const { mutate: deleteBrand, isPending: deletingBrand } = useDeleteBrand()

  const { data: types = [], isLoading: loadingType } = useProductTypes()
  const { mutate: createType, isPending: creatingType } = useCreateProductType()
  const { mutate: updateType, isPending: updatingType } = useUpdateProductType()
  const { mutate: deleteType, isPending: deletingType } = useDeleteProductType()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        <h1 className="text-xl font-bold text-gray-800 dark:text-neutral-100">Catálogo</h1>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-[#4A6CF7] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'categories' && (
        <EntityTable
          label="categoria"
          labelPlural="categorias"
          EmptyIcon={Tag}
          items={categories}
          isLoading={loadingCat}
          showHasVariants
          showNavToggle
          showLowStockThreshold
          onCreate={(data) => createCat(data)}
          onUpdate={(id, data) => updateCat({ id, data })}
          onDelete={(id) => deleteCat(id)}
          isCreating={creatingCat}
          isUpdating={updatingCat}
          isDeleting={deletingCat}
        />
      )}

      {activeTab === 'brands' && (
        <EntityTable
          label="marca"
          labelPlural="marcas"
          EmptyIcon={Bookmark}
          items={brands}
          isLoading={loadingBrand}
          onCreate={(data) => createBrand(data)}
          onUpdate={(id, data) => updateBrand({ id, data })}
          onDelete={(id) => deleteBrand(id)}
          isCreating={creatingBrand}
          isUpdating={updatingBrand}
          isDeleting={deletingBrand}
        />
      )}

      {activeTab === 'types' && (
        <EntityTable
          label="tipo"
          labelPlural="tipos"
          EmptyIcon={Layers}
          items={types}
          isLoading={loadingType}
          onCreate={(data) => createType(data)}
          onUpdate={(id, data) => updateType({ id, data })}
          onDelete={(id) => deleteType(id)}
          isCreating={creatingType}
          isUpdating={updatingType}
          isDeleting={deletingType}
        />
      )}
    </div>
  )
}
