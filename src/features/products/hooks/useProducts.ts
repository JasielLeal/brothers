import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/features/products/services/products.service'
import type {
  Product,
  ProductFilters,
  ProductInput,
  Brand,
  ProductType,
  NavCategory,
} from '@/features/products/types/product.types'
import type { ProductInput as ProductSchemaInput } from '@/features/products/schemas/product.schema'
import type { PaginatedResponse } from '@/types/global.types'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  bestSellers: (limit: number) => [...productKeys.all, 'bestsellers', limit] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  navCategories: () => [...productKeys.all, 'navCategories'] as const,
  brands: () => [...productKeys.all, 'brands'] as const,
  productTypes: () => [...productKeys.all, 'productTypes'] as const,
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsService.getProducts(filters),
  })
}

export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: [...productKeys.lists(), 'infinite', filters] as const,
    queryFn: ({ pageParam }) =>
      productsService.getProducts({ ...filters, page: pageParam as number, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const next = lastPage.page + 1
      return next <= lastPage.totalPages ? next : undefined
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getProductById(id),
    enabled: Boolean(id),
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: [...productKeys.all, 'slug', slug],
    queryFn: () => productsService.getProductBySlug(slug),
    enabled: Boolean(slug),
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: productsService.getFeaturedProducts,
  })
}

export function useBestSellers(limit = 4) {
  return useQuery({
    queryKey: productKeys.bestSellers(limit),
    queryFn: () => productsService.getBestSellers(limit),
  })
}

export function useNewArrivals(limit = 12) {
  return useQuery({
    queryKey: [...productKeys.all, 'newArrivals', limit] as const,
    queryFn: () => productsService.getNewArrivals(limit),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: productsService.getCategories,
  })
}

export function useNavCategories() {
  return useQuery<NavCategory[]>({
    queryKey: productKeys.navCategories(),
    queryFn: productsService.getNavCategories,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; slug: string }) => productsService.createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.categories() }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string } }) =>
      productsService.updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.categories() }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories() })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: productKeys.brands(),
    queryFn: productsService.getBrands,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; slug: string }) => productsService.createBrand(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.brands() }),
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string } }) =>
      productsService.updateBrand(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.brands() }),
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.deleteBrand(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.brands() }),
  })
}

export function useProductTypes() {
  return useQuery<ProductType[]>({
    queryKey: productKeys.productTypes(),
    queryFn: productsService.getProductTypes,
  })
}

export function useCreateProductType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; slug: string }) => productsService.createProductType(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.productTypes() }),
  })
}

export function useUpdateProductType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string } }) =>
      productsService.updateProductType(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.productTypes() }),
  })
}

export function useDeleteProductType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProductType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.productTypes() }),
  })
}

function schemaToInput(
  data: ProductSchemaInput
): ProductInput & {
  costPrice?: number | null
  marginPercent?: number | null
  supplierId?: string | null
} {
  return {
    name: data.name,
    slug: data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
    description: data.description,
    price: data.price,
    originalPrice: data.originalPrice ?? null,
    brandId: data.brandId ?? null,
    typeId: data.typeId ?? null,
    costPrice: data.costPrice ?? null,
    marginPercent: data.marginPercent ?? null,
    supplierId: data.supplierId ?? null,
    images: data.images,
    categoryId: data.categoryId,
    stock: data.stock,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
  }
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductSchemaInput) => productsService.createProduct(schemaToInput(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductSchemaInput> }) => {
      const input: Partial<ProductInput> & {
        costPrice?: number | null
        marginPercent?: number | null
        supplierId?: string | null
      } = {}
      if (data.name !== undefined) {
        input.name = data.name
        input.slug = data.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      }
      if (data.description !== undefined) input.description = data.description
      if (data.price !== undefined) input.price = data.price
      if ('originalPrice' in data) input.originalPrice = data.originalPrice ?? null
      if ('brandId' in data) input.brandId = data.brandId ?? null
      if ('typeId' in data) input.typeId = data.typeId ?? null
      if ('costPrice' in data) input.costPrice = data.costPrice ?? null
      if ('marginPercent' in data) input.marginPercent = data.marginPercent ?? null
      if ('supplierId' in data) input.supplierId = data.supplierId ?? null
      if (data.images !== undefined) input.images = data.images
      if (data.categoryId !== undefined) input.categoryId = data.categoryId
      if (data.stock !== undefined) input.stock = data.stock
      if (data.isActive !== undefined) input.isActive = data.isActive
      if (data.isFeatured !== undefined) input.isFeatured = data.isFeatured
      return productsService.updateProduct(id, input)
    },
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct)
      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}
