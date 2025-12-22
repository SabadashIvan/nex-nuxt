/**
 * Catalog Store
 * Handles categories, product listings, filters, sorting, pagination
 * SSR-safe for SEO
 */

import { defineStore } from 'pinia'
import type { 
  Category, 
  CategoryResponse,
  ProductListItem, 
  ProductFilter, 
  CatalogFilters,
  Pagination,
  Brand,
  VariantsResponse,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

interface CatalogState {
  categories: Category[]
  currentCategory: Category | null
  products: ProductListItem[]
  filters: ProductFilter
  availableFilters: CatalogFilters
  sorting: SortOption
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
     * @param providedApi - Optional API instance (to preserve context after await)
     */
    async fetchCategories(providedApi?: ReturnType<typeof useApi>): Promise<void> {
      // Use provided API if available, otherwise create new one (for client-side calls)
      const api = providedApi || useApi()
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
     * @param slug - Category slug
     * @param withProducts - Include products in response
     * @param providedApi - Optional API instance (to preserve context after await)
     */
    async fetchCategory(slug: string, withProducts = false, providedApi?: ReturnType<typeof useApi>): Promise<Category | null> {
      // Use provided API if available, otherwise create new one (for client-side calls)
      const api = providedApi || useApi()
      this.loading = true
      this.error = null

      try {
        console.log('Fetching category with slug:', slug)
        const response = await api.get<CategoryResponse | Category>(`/catalog/categories/${slug}`, {
          withProducts: withProducts ? 'true' : undefined,
        })
        
        console.log('Category API response:', response)
        
        if (!response) {
          console.warn('Category API returned null/undefined for slug:', slug)
          return null
        }
        
        // Handle both wrapped (data) and direct response
        let category: Category
        if (response && typeof response === 'object' && 'data' in response) {
          const dataResponse = response as CategoryResponse
          console.log('Response has data wrapper, extracting:', dataResponse.data)
          if (dataResponse.data) {
            category = dataResponse.data
          } else {
            console.warn('Category response has data property but data is null/undefined')
            return null
          }
        } else {
          console.log('Response is direct category object')
          category = response as Category
        }
        
        // Validate category has required fields
        if (!category || !category.slug) {
          console.warn('Invalid category response - missing slug:', category)
          return null
        }
        
        // Ensure name field for backward compatibility
        if (!category.name && category.title) {
          category.name = category.title
        }
        
        console.log('Successfully parsed category:', category)
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
     * @param params - Filter parameters
     * @param providedApi - Optional API instance (to preserve context after await)
     */
    async fetchProducts(params?: ProductFilter, providedApi?: ReturnType<typeof useApi>): Promise<void> {
      // Use provided API if available, otherwise create new one (for client-side calls)
      const api = providedApi || useApi()
      this.loading = true
      this.error = null

      // Merge with current filters
      // Deep merge filters: if params.filters is provided, merge it with this.filters.filters
      // This allows adding new filters while preserving existing ones (e.g., adding brand filter to category filter)
      const mergedParams: ProductFilter = { ...this.filters, ...params }
      
      // Deep merge filters object if both exist
      if (mergedParams.filters && this.filters.filters) {
        mergedParams.filters = { ...this.filters.filters, ...mergedParams.filters }
      } else if (mergedParams.filters === undefined) {
        // If params.filters is not provided, use existing filters
        mergedParams.filters = this.filters.filters
      }
      
      // Validate and normalize sort value
      const validSorts: SortOption[] = ['newest', 'price_asc', 'price_desc']
      const sortValue = mergedParams.sort || this.sorting || 'newest'
      const normalizedSort: SortOption = validSorts.includes(sortValue as SortOption) 
        ? (sortValue as SortOption) 
        : 'newest'
      
      // Build query parameters according to YAML API spec
      const queryParams: Record<string, string | number | string[] | undefined> = {
        page: mergedParams.page || this.pagination.page,
        per_page: mergedParams.per_page || this.pagination.perPage,
        sort: normalizedSort,
        include_facets: mergedParams.include_facets !== undefined ? mergedParams.include_facets : 1, // Default to 1
      }

      // Add filter parameters with filters[] format
      if (mergedParams.filters) {
        if (mergedParams.filters.q) {
          queryParams['filters[q]'] = mergedParams.filters.q
        }
        if (mergedParams.filters.price_min !== undefined) {
          queryParams['filters[price_min]'] = String(mergedParams.filters.price_min)
        }
        if (mergedParams.filters.price_max !== undefined) {
          queryParams['filters[price_max]'] = String(mergedParams.filters.price_max)
        }
        if (mergedParams.filters.brands) {
          queryParams['filters[brands]'] = mergedParams.filters.brands // Comma-separated: "1,3,5"
        }
        if (mergedParams.filters.categories) {
          queryParams['filters[categories]'] = mergedParams.filters.categories // Comma-separated: "10,12"
        }
        if (mergedParams.filters.attributes && mergedParams.filters.attributes.length > 0) {
          // Attributes: filters[attributes][]=value1, filters[attributes][]=value2
          mergedParams.filters.attributes.forEach((attrGroup) => {
            // For arrays, we need to append multiple values with the same key
            // URLSearchParams will handle this correctly
            const key = 'filters[attributes][]'
            if (queryParams[key]) {
              // If key already exists, convert to array and append
              const existing = Array.isArray(queryParams[key]) 
                ? queryParams[key] as string[]
                : [String(queryParams[key])]
              existing.push(attrGroup)
              queryParams[key] = existing
            } else {
              queryParams[key] = attrGroup
            }
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
            brands: facets.brands?.map(brand => ({
              value: String(brand.id),
              label: brand.title || '—',
              count: brand.count,
            })),
            attributes: facets.attributes?.map(attr => ({
              code: attr.code,
              name: attr.title,
              type: 'checkbox' as const,
              options: attr.values?.map(val => ({
                value: String(val.id),
                label: val.label,
                count: val.count,
              })) || [],
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
     * @param providedApi - Optional API instance (to preserve context after await)
     */
    async fetchBrands(providedApi?: ReturnType<typeof useApi>): Promise<void> {
      // Use provided API if available, otherwise create new one (for client-side calls)
      const api = providedApi || useApi()

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
      // Deep merge filters object
      if (filters.filters) {
        this.filters = {
          ...this.filters,
          ...filters,
          filters: {
            ...this.filters.filters,
            ...filters.filters,
          }
        }
      } else {
        this.filters = { ...this.filters, ...filters }
      }
      this.pagination.page = 1 // Reset to first page
      await this.fetchProducts()
    },

    /**
     * Apply sorting and reload products
     */
    async applySorting(sort: string): Promise<void> {
      const validSorts: SortOption[] = ['newest', 'price_asc', 'price_desc']
      const normalizedSort: SortOption = validSorts.includes(sort as SortOption) 
        ? (sort as SortOption) 
        : 'newest'
      this.sorting = normalizedSort
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

