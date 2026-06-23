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
}

/* ── EntityModal ────────────────────────────────────────── */
function EntityModal({
  entity,
  label,
  isPending,
  onClose,
  onSubmit,
}: {
  entity: SimpleEntity | null
  label: string
  isPending: boolean
  onClose: () => void
  onSubmit: (data: { name: string; slug: string }) => void
}) {
  const [name, setName] = useState(entity?.name ?? '')
  const [slug, setSlug] = useState(entity?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!entity)
  const [error, setError] = useState('')

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
    setError('')
    onSubmit({ name: name.trim(), slug: slug.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            {entity ? `Editar ${label}` : `Nova ${label}`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={`Ex: ${label === 'categoria' ? 'Camisetas' : label === 'marca' ? 'Nike' : 'Oversize'}`}
              className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Slug</label>
            <input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="gerado-automaticamente"
              className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20"
            />
            <p className="text-[11px] text-gray-400">Gerado automaticamente a partir do nome</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
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
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Excluir {label}</h3>
          <p className="text-sm text-gray-500">
            Tem certeza que deseja excluir{' '}
            <span className="font-semibold text-gray-700">&ldquo;{entity.name}&rdquo;</span>?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
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
  onCreate: (data: { name: string; slug: string }) => void
  onUpdate: (id: string, data: { name: string; slug: string }) => void
  onDelete: (id: string) => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SimpleEntity | null>(null)
  const [deleting, setDeleting] = useState<SimpleEntity | null>(null)

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
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${labelPlural}...`}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm transition outline-none focus:border-[#4A6CF7] focus:ring-2 focus:ring-[#4A6CF7]/20"
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
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
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
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Nome
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Slug
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Criado em
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{item.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                      {item.slug}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditing(item)
                          setModalOpen(true)
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-[#4A6CF7]"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(item)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
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

      <p className="text-xs text-gray-400">
        {filtered.length} {filtered.length !== 1 ? labelPlural : label}
      </p>

      {modalOpen && (
        <EntityModal
          entity={editing}
          label={label}
          isPending={isCreating || isUpdating}
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
        <h1 className="text-xl font-bold text-gray-800">Catálogo</h1>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-[#4A6CF7] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
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
