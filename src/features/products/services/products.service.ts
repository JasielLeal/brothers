import { api } from '@/lib/api/axios'
import type {
  Product,
  ProductFilters,
  ProductInput,
  Category,
  Brand,
  ProductType,
  NavCategory,
  PopularCategory,
  StockByCategory,
  DealProduct,
  SizeSetType,
} from '@/features/products/types/product.types'
import type { PaginatedResponse } from '@/types/global.types'

function toParams(filters: ProductFilters) {
  const params: Record<string, string | number | boolean> = {}
  if (filters.search) params.search = filters.search
  if (filters.categoryId) params.categoryId = filters.categoryId
  if (filters.brandId) params.brandId = filters.brandId
  if (filters.typeId) params.typeId = filters.typeId
  if (filters.isFeatured !== undefined) params.isFeatured = filters.isFeatured
  if (filters.isActive !== undefined) params.isActive = filters.isActive
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.minPrice !== undefined) params.minPrice = filters.minPrice
  if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice
  return params
}

export const productsService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', {
      params: toParams(filters),
    })
    return data
  },

  async getProductById(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`)
    return data
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${slug}`, { params: { by: 'slug' } })
    return data
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', {
      params: { isFeatured: true, isActive: true, limit: 8 },
    })
    return data.data
  },

  async getBestSellers(limit = 4): Promise<Product[]> {
    const { data } = await api.get<Product[]>('/products/bestsellers', { params: { limit } })
    return data
  },

  async getNewArrivals(limit = 10): Promise<Product[]> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', {
      params: { isActive: true, limit },
    })
    return data.data
  },

  async getCategories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories')
    return data
  },

  async getNavCategories(): Promise<NavCategory[]> {
    const { data } = await api.get<NavCategory[]>('/catalog/nav')
    return data
  },

  async getPopularCategories(limit = 6): Promise<PopularCategory[]> {
    const { data } = await api.get<PopularCategory[]>('/catalog/popular-categories', {
      params: { limit },
    })
    return data
  },

  async getStockByCategory(): Promise<StockByCategory[]> {
    const { data } = await api.get<StockByCategory[]>('/catalog/stock-by-category')
    return data
  },

  async getDeals(limit = 6): Promise<DealProduct[]> {
    const { data } = await api.get<DealProduct[]>('/products/deals', { params: { limit } })
    return data
  },

  async createCategory(input: {
    name: string
    slug: string
    hasVariants?: boolean
    sizeSet?: SizeSetType
    showInNav?: boolean
    lowStockThreshold?: number | null
  }): Promise<Category> {
    const { data } = await api.post<Category>('/categories', input)
    return data
  },

  async updateCategory(
    id: string,
    input: {
      name?: string
      slug?: string
      hasVariants?: boolean
      sizeSet?: SizeSetType
      showInNav?: boolean
      lowStockThreshold?: number | null
    }
  ): Promise<Category> {
    const { data } = await api.put<Category>(`/categories/${id}`, input)
    return data
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`)
  },

  async getBrands(): Promise<Brand[]> {
    const { data } = await api.get<Brand[]>('/brands')
    return data
  },

  async createBrand(input: { name: string; slug: string }): Promise<Brand> {
    const { data } = await api.post<Brand>('/brands', input)
    return data
  },

  async updateBrand(id: string, input: { name?: string; slug?: string }): Promise<Brand> {
    const { data } = await api.put<Brand>(`/brands/${id}`, input)
    return data
  },

  async deleteBrand(id: string): Promise<void> {
    await api.delete(`/brands/${id}`)
  },

  async getProductTypes(): Promise<ProductType[]> {
    const { data } = await api.get<ProductType[]>('/product-types')
    return data
  },

  async createProductType(input: { name: string; slug: string }): Promise<ProductType> {
    const { data } = await api.post<ProductType>('/product-types', input)
    return data
  },

  async updateProductType(
    id: string,
    input: { name?: string; slug?: string }
  ): Promise<ProductType> {
    const { data } = await api.put<ProductType>(`/product-types/${id}`, input)
    return data
  },

  async deleteProductType(id: string): Promise<void> {
    await api.delete(`/product-types/${id}`)
  },

  async createProduct(input: ProductInput): Promise<Product> {
    const { data } = await api.post<Product>('/products', input)
    return data
  },

  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const { data } = await api.put<Product>(`/products/${id}`, input)
    return data
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
  },
}
