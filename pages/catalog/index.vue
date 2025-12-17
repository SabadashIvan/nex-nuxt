<script setup lang="ts">
/**
 * Catalog page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'
import type { ProductFilter } from '~/types'

const route = useRoute()

// Create a computed for route query to use in watch
const routeQuery = computed(() => route.query)

// Fetch products with SSR - access store inside callback
const { pending, refresh } = await useAsyncData(
  'catalog-products',
  async () => {
    const catalogStore = useCatalogStore()
    
    // Get query params directly from route inside async callback
    const query = route.query
    const initialFilters = {
      q: query.q as string | undefined,
      sort: query.sort as string | undefined,
      page: query.page ? parseInt(query.page as string) : 1,
      categories: query.categories as string | undefined,
      brands: query.brands as string | undefined,
      price_min: query.price_min ? Number(query.price_min) : undefined,
      price_max: query.price_max ? Number(query.price_max) : undefined,
      attributes: query.attributes ? (query.attributes as string).split(',') : undefined,
    }
    
    // Build filters object from URL params only
    // On /catalog page, we don't add categories filter unless explicitly in URL
    const filters: any = {
      page: initialFilters.page,
    }
    
    // Only add filters object if there are any filters in URL
    if (initialFilters.q || 
        initialFilters.categories || 
        initialFilters.brands || 
        initialFilters.price_min !== undefined || 
        initialFilters.price_max !== undefined ||
        initialFilters.attributes) {
      filters.filters = {}
      
      if (initialFilters.q) {
        filters.filters.q = initialFilters.q
      }
      // Only add categories if explicitly in URL - don't add by default on /catalog
      if (initialFilters.categories) {
        filters.filters.categories = initialFilters.categories
      }
      if (initialFilters.brands) {
        filters.filters.brands = initialFilters.brands
      }
      if (initialFilters.price_min !== undefined) {
        filters.filters.price_min = initialFilters.price_min
      }
      if (initialFilters.price_max !== undefined) {
        filters.filters.price_max = initialFilters.price_max
      }
      if (initialFilters.attributes && initialFilters.attributes.length > 0) {
        filters.filters.attributes = initialFilters.attributes
      }
    }
    // If no filters in URL, ensure filters object is not created (to avoid sending empty filters)
    
    await catalogStore.fetchProducts(filters)
    
    // Apply filters to store so they're available for ActiveFilters component
    // Only set filters if they exist - don't preserve old filters from store
    catalogStore.filters = filters
    
    if (initialFilters.sort) {
      // Validate sort value before setting
      const validSorts = ['newest', 'price_asc', 'price_desc']
      const sortValue = initialFilters.sort
      if (validSorts.includes(sortValue)) {
        catalogStore.sorting = sortValue as 'newest' | 'price_asc' | 'price_desc'
      }
    } else {
      // Reset to default if no sort in URL
      catalogStore.sorting = 'newest'
    }
    return catalogStore.products
  },
  { 
    watch: [routeQuery] 
  }
)

// Fetch categories - access store inside callback
await useAsyncData('catalog-categories', async () => {
  const catalogStore = useCatalogStore()
  if (catalogStore.categories.length === 0) {
    await catalogStore.fetchCategories()
  }
  return catalogStore.categories
})

// Computed values - access store inside computed
const products = computed(() => {
  try {
    return useCatalogStore().products
  } catch {
    return []
  }
})
const pagination = computed(() => {
  try {
    return useCatalogStore().pagination
  } catch {
    return { page: 1, perPage: 20, total: 0, lastPage: 1 }
  }
})
const sorting = computed(() => {
  try {
    return useCatalogStore().sorting
  } catch {
    return 'newest'
  }
})
const availableFilters = computed(() => {
  try {
    return useCatalogStore().availableFilters
  } catch {
    return {}
  }
})
const activeFilters = computed(() => {
  try {
    return useCatalogStore().filters
  } catch {
    return {}
  }
})

// Handle filter changes
async function handleFilterChange(filters: ProductFilter) {
  const catalogStore = useCatalogStore()
  await catalogStore.applyFilters(filters)
  updateUrl()
}

// Handle sort change
async function handleSortChange(sort: string) {
  const catalogStore = useCatalogStore()
  await catalogStore.applySorting(sort)
  updateUrl()
}

// Handle page change
async function handlePageChange(page: number) {
  const catalogStore = useCatalogStore()
  // Update URL first, then fetch products
  const query: Record<string, string> = {}
  
  // Preserve all current filters
  if (catalogStore.filters.filters?.q) {
    query.q = catalogStore.filters.filters.q
  }
  if (catalogStore.sorting !== 'newest') {
    query.sort = catalogStore.sorting
  }
  if (catalogStore.filters.filters?.categories) {
    query.categories = catalogStore.filters.filters.categories
  }
  if (catalogStore.filters.filters?.brands) {
    query.brands = catalogStore.filters.filters.brands
  }
  if (catalogStore.filters.filters?.price_min !== undefined) {
    query.price_min = String(catalogStore.filters.filters.price_min)
  }
  if (catalogStore.filters.filters?.price_max !== undefined) {
    query.price_max = String(catalogStore.filters.filters.price_max)
  }
  if (catalogStore.filters.filters?.attributes && catalogStore.filters.filters.attributes.length > 0) {
    query.attributes = catalogStore.filters.filters.attributes.join(',')
  }
  
  // Set page
  if (page > 1) {
    query.page = page.toString()
  }
  
  // Navigate to update URL - this will trigger useAsyncData to refetch
  await navigateTo({ path: '/catalog', query }, { replace: true })
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Handle remove single filter
async function handleRemoveFilter(type: string, value: string) {
  const catalogStore = useCatalogStore()
  const currentFilters = { ...catalogStore.filters }
  
  if (!currentFilters.filters) {
    currentFilters.filters = {}
  }
  
  switch (type) {
    case 'categories': {
      const categories = currentFilters.filters.categories?.split(',') || []
      const filtered = categories.filter(id => id !== value)
      if (filtered.length > 0) {
        currentFilters.filters.categories = filtered.join(',')
      } else {
        delete currentFilters.filters.categories
      }
      break
    }
    case 'brands': {
      const brands = currentFilters.filters.brands?.split(',') || []
      const filtered = brands.filter(id => id !== value)
      if (filtered.length > 0) {
        currentFilters.filters.brands = filtered.join(',')
      } else {
        delete currentFilters.filters.brands
      }
      break
    }
    case 'price': {
      delete currentFilters.filters.price_min
      delete currentFilters.filters.price_max
      break
    }
    case 'attributes': {
      const [attrCode, attrValueId] = value.split(':')
      if (currentFilters.filters.attributes) {
        const updatedAttributes = currentFilters.filters.attributes.map((attrGroup, index) => {
          const attrDef = availableFilters.value.attributes?.[index]
          if (attrDef && attrDef.code === attrCode) {
            const valueIds = attrGroup.split(',')
            const filtered = valueIds.filter(id => id !== attrValueId)
            return filtered.length > 0 ? filtered.join(',') : null
          }
          return attrGroup
        }).filter(Boolean) as string[]
        
        if (updatedAttributes.length > 0) {
          currentFilters.filters.attributes = updatedAttributes
        } else {
          delete currentFilters.filters.attributes
        }
      }
      break
    }
  }
  
  // Remove filters object if empty
  if (Object.keys(currentFilters.filters).length === 0) {
    currentFilters.filters = undefined
  }
  
  await catalogStore.applyFilters(currentFilters)
  updateUrl()
}

// Handle reset
async function handleReset() {
  const catalogStore = useCatalogStore()
  catalogStore.resetFilters()
  await catalogStore.fetchProducts()
  navigateTo('/catalog')
}

// Update URL with current filters
function updateUrl() {
  const catalogStore = useCatalogStore()
  const query: Record<string, string> = {}
  
  // Search
  if (catalogStore.filters.filters?.q) {
    query.q = catalogStore.filters.filters.q
  }
  
  // Sort
  if (catalogStore.sorting !== 'newest') {
    query.sort = catalogStore.sorting
  }
  
  // Categories
  if (catalogStore.filters.filters?.categories) {
    query.categories = catalogStore.filters.filters.categories
  }
  
  // Brands
  if (catalogStore.filters.filters?.brands) {
    query.brands = catalogStore.filters.filters.brands
  }
  
  // Price range
  if (catalogStore.filters.filters?.price_min !== undefined) {
    query.price_min = String(catalogStore.filters.filters.price_min)
  }
  if (catalogStore.filters.filters?.price_max !== undefined) {
    query.price_max = String(catalogStore.filters.filters.price_max)
  }
  
  // Attributes - convert array to query params
  if (catalogStore.filters.filters?.attributes && catalogStore.filters.filters.attributes.length > 0) {
    // For attributes, we can either use a single param with comma-separated values
    // or multiple params. Let's use a single param for simplicity
    query.attributes = catalogStore.filters.filters.attributes.join(',')
  }
  
  // Page
  if (catalogStore.pagination.page > 1) {
    query.page = catalogStore.pagination.page.toString()
  }
  
  navigateTo({ path: '/catalog', query }, { replace: true })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs 
      :items="[{ label: 'Catalog' }]" 
      class="mb-6"
    />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          All Products
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ pagination.total }} products found
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Mobile filter button only -->
        <div class="lg:hidden">
          <CatalogFiltersSidebar
            :filters="availableFilters"
            :active-filters="activeFilters"
            :loading="pending"
            @update:filters="handleFilterChange"
            @reset="handleReset"
          />
        </div>
        <CatalogSortDropdown
          :model-value="sorting"
          @update:model-value="handleSortChange"
        />
      </div>
    </div>

    <!-- Active Filters -->
    <CatalogActiveFilters
      :active-filters="activeFilters"
      :available-filters="availableFilters"
      @remove-filter="handleRemoveFilter"
      @reset="handleReset"
    />

    <!-- Main content -->
    <div class="flex gap-8">
      <!-- Desktop filters sidebar -->
      <aside class="hidden lg:block w-64 flex-shrink-0">
        <CatalogFiltersSidebar
          :filters="availableFilters"
          :active-filters="activeFilters"
          :loading="pending"
          @update:filters="handleFilterChange"
          @reset="handleReset"
        />
      </aside>

      <!-- Products -->
      <div class="flex-1">
        <CatalogProductGrid 
          :products="products" 
          :loading="pending" 
        />

        <!-- Pagination -->
        <div v-if="pagination.lastPage > 1" class="mt-8">
          <UiPagination
            :current-page="pagination.page"
            :total-pages="pagination.lastPage"
            @update:current-page="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

