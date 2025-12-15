/**
 * Catalog Store
 * Handles categories, product listings, filters, sorting, pagination
 * SSR-safe for SEO
 */

import { defineStore } from 'pinia'
import type { 
  Category, 
  ProductListItem, 
  ProductFilter, 
  CatalogFilters,
  Pagination,
  Brand,
  VariantsResponse,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

interface CatalogState {
  categories: Category[]
  currentCategory: Category | null
  products: ProductListItem[]
  filters: ProductFilter
  availableFilters: CatalogFilters
  sorting: string
  pagination: Pagination
  brands: Brand[]
  loading: boolean
  error: string | null
}

export const useCatalogStore = defineStore('catalog', {
  state: (): CatalogState => ({
    categories: [],
    currentCategory: null,
    products: [],
    filters: {},
    availableFilters: {},
    sorting: 'newest',
    pagination: {
      page: 1,
      perPage: 20,
      total: 0,
      lastPage: 1,
    },
    brands: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Get root categories (no parent)
     */
    rootCategories: (state): Category[] => {
      if (!state.categories || !Array.isArray(state.categories)) {
        return []
      }
      return state.categories.filter(c => !c.parent_id)
    },

    /**
     * Check if there are products
     */
    hasProducts: (state): boolean => {
      return state.products.length > 0
    },

    /**
     * Check if filters are applied
     */
    hasActiveFilters: (state): boolean => {
      const filters = state.filters.filters
      if (!filters) return false
      return !!(
        filters.q ||
        filters.price_min ||
        filters.price_max ||
        filters.brands ||
        filters.categories ||
        (filters.attributes && filters.attributes.length > 0)
      )
    },

    /**
     * Get active filter count
     */
    activeFilterCount: (state): number => {
      const filters = state.filters.filters
      if (!filters) return 0
      let count = 0
      if (filters.q) count++
      if (filters.price_min || filters.price_max) count++
      if (filters.brands) count++
      if (filters.categories) count++
      if (filters.attributes) {
        count += filters.attributes.length
      }
      return count
    },
  },

  actions: {
    /**
     * Fetch all categories
     */
    async fetchCategories(): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<Category[] | { data: Category[] }>('/catalog/categories')
        
        // Handle both direct response and wrapped response
        let categories: Category[]
        if (Array.isArray(response)) {
          categories = response
        } else if (response && 'data' in response && Array.isArray(response.data)) {
          categories = response.data
        } else {
          console.warn('Unexpected categories response format:', response)
          categories = []
        }
        
        this.categories = categories
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch categories error:', error)
        this.categories = [] // Ensure it's always an array
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch single category by slug
     */
    async fetchCategory(slug: string, withProducts = false): Promise<Category | null> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const category = await api.get<Category>(`/catalog/categories/${slug}`, {
          withProducts: withProducts ? 'true' : undefined,
        })
        this.currentCategory = category
        return category
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch category error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch products with filters
     * Uses /api/v1/catalog/variants endpoint per YAML spec
     */
    async fetchProducts(params?: ProductFilter): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      // Merge with current filters
      const mergedParams = { ...this.filters, ...params }
      
      // Build query parameters according to YAML API spec
      const queryParams: Record<string, string | number | boolean | undefined> = {
        page: mergedParams.page || this.pagination.page,
        per_page: mergedParams.per_page || this.pagination.perPage,
        sort: mergedParams.sort || this.sorting || 'newest',
        include_facets: mergedParams.include_facets !== false, // Default to true
      }

      // Add filter parameters with filters.* prefix (exact YAML format)
      if (mergedParams.filters) {
        if (mergedParams.filters.q) {
          queryParams['filters.q'] = mergedParams.filters.q
        }
        if (mergedParams.filters.price_min !== undefined) {
          queryParams['filters.price_min'] = String(mergedParams.filters.price_min)
        }
        if (mergedParams.filters.price_max !== undefined) {
          queryParams['filters.price_max'] = String(mergedParams.filters.price_max)
        }
        if (mergedParams.filters.brands) {
          queryParams['filters.brands'] = mergedParams.filters.brands // Comma-separated: "1,3,5"
        }
        if (mergedParams.filters.categories) {
          queryParams['filters.categories'] = mergedParams.filters.categories // Comma-separated: "10,12"
        }
        if (mergedParams.filters.attributes && mergedParams.filters.attributes.length > 0) {
          // Attributes: filters.attributes[0]="4,5", filters.attributes[1]="7,8"
          mergedParams.filters.attributes.forEach((attrGroup, index) => {
            queryParams[`filters.attributes[${index}]`] = attrGroup
          })
        }
      }

      try {
        const response = await api.get<VariantsResponse>(
          '/catalog/variants',
          queryParams
        )

        // Response structure: { data: { items: [], facets: {} }, meta: { pagination: {} } }
        this.products = response.data.items || []
        this.pagination = {
          page: response.meta.pagination.current_page,
          perPage: response.meta.pagination.per_page,
          total: response.meta.pagination.total,
          lastPage: response.meta.pagination.last_page,
        }

        // Update available filters (facets) if returned
        if (response.data.facets) {
          const facets = response.data.facets
          this.availableFilters = {
            categories: facets.categories?.map(cat => ({
              value: String(cat.id),
              label: cat.title || '—',
              count: cat.count,
            })),
            attributes: facets.attributes?.map(attr => ({
              code: attr.code,
              name: attr.title,
              type: 'checkbox' as const,
              options: attr.values.map(val => ({
                value: String(val.id),
                label: val.label,
                count: val.count,
              })),
            })),
            price_range: facets.price ? {
              min: facets.price.min,
              max: facets.price.max,
            } : undefined,
          }
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch products error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch brands
     */
    async fetchBrands(): Promise<void> {
      const api = useApi()

      try {
        const brands = await api.get<Brand[]>('/catalog/brands')
        this.brands = brands
      } catch (error) {
        console.error('Fetch brands error:', error)
      }
    },

    /**
     * Apply filters and reload products
     */
    async applyFilters(filters: ProductFilter): Promise<void> {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // Reset to first page
      await this.fetchProducts()
    },

    /**
     * Apply sorting and reload products
     */
    async applySorting(sort: string): Promise<void> {
      this.sorting = sort
      this.pagination.page = 1
      await this.fetchProducts()
    },

    /**
     * Go to page
     */
    async goToPage(page: number): Promise<void> {
      this.pagination.page = page
      await this.fetchProducts()
    },

    /**
     * Reset filters
     */
    resetFilters(): void {
      this.filters = {}
      this.sorting = 'newest'
      this.pagination.page = 1
    },

    /**
     * Reset pagination
     */
    resetPagination(): void {
      this.pagination = {
        page: 1,
        perPage: 20,
        total: 0,
        lastPage: 1,
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.categories = []
      this.currentCategory = null
      this.products = []
      this.filters = {}
      this.availableFilters = {}
      this.sorting = 'newest'
      this.pagination = {
        page: 1,
        perPage: 20,
        total: 0,
        lastPage: 1,
      }
      this.brands = []
      this.loading = false
      this.error = null
    },
  },
})

