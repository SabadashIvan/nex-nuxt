<script setup lang="ts">
/**
 * Category page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'

const route = useRoute()

const categorySlug = computed(() => route.params.category as string)

// Get initial query params
const initialFilters = computed(() => ({
  q: route.query.q as string | undefined,
  sort: route.query.sort as string | undefined,
  page: route.query.page ? parseInt(route.query.page as string) : 1,
  categories: route.query.categories as string | undefined,
  brands: route.query.brands as string | undefined,
  price_min: route.query.price_min ? Number(route.query.price_min) : undefined,
  price_max: route.query.price_max ? Number(route.query.price_max) : undefined,
  attributes: route.query.attributes ? (route.query.attributes as string).split(',') : undefined,
}))

// Fetch category and products with SSR - access store inside callback
const { data: category, pending, error } = await useAsyncData(
  `category-${categorySlug.value}-${JSON.stringify(route.query)}`,
  async () => {
    const catalogStore = useCatalogStore()
    const cat = await catalogStore.fetchCategory(categorySlug.value)
    if (cat) {
      // Build filters object from URL params
      const filters: any = {
        page: initialFilters.value.page,
      }
      
      if (initialFilters.value.q || 
          initialFilters.value.categories || 
          initialFilters.value.brands || 
          initialFilters.value.price_min !== undefined || 
          initialFilters.value.price_max !== undefined ||
          initialFilters.value.attributes) {
        filters.filters = {}
        
        if (initialFilters.value.q) {
          filters.filters.q = initialFilters.value.q
        }
        if (initialFilters.value.categories) {
          filters.filters.categories = initialFilters.value.categories
        }
        if (initialFilters.value.brands) {
          filters.filters.brands = initialFilters.value.brands
        }
        if (initialFilters.value.price_min !== undefined) {
          filters.filters.price_min = initialFilters.value.price_min
        }
        if (initialFilters.value.price_max !== undefined) {
          filters.filters.price_max = initialFilters.value.price_max
        }
        if (initialFilters.value.attributes && initialFilters.value.attributes.length > 0) {
          filters.filters.attributes = initialFilters.value.attributes
        }
      }
      
      await catalogStore.fetchProducts(filters)
      
      // Apply filters to store so they're available for ActiveFilters component
      if (filters.filters) {
        catalogStore.filters = { ...catalogStore.filters, ...filters }
      }
      
      if (initialFilters.value.sort) {
        // Validate sort value before setting
        const validSorts = ['newest', 'price_asc', 'price_desc']
        const sortValue = initialFilters.value.sort
        if (validSorts.includes(sortValue)) {
          catalogStore.sorting = sortValue as 'newest' | 'price_asc' | 'price_desc'
        }
      }
    }
    return cat
  },
  { watch: [categorySlug, () => route.query] }
)

// Handle 404
if (!category.value && !pending.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Category Not Found',
  })
}

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

// Breadcrumbs
const breadcrumbs = computed(() => {
  const items = [{ label: 'Catalog', to: '/catalog' }]
  if (category.value) {
    items.push({ label: category.value.name, to: `/catalog/${categorySlug.value}` })
  }
  return items
})

// Handle filter changes
async function handleFilterChange(filters: Record<string, unknown>) {
  const catalogStore = useCatalogStore()
  await catalogStore.applyFilters({
    ...filters,
    category: categorySlug.value,
  } as Record<string, string | number | undefined>)
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
  await navigateTo({ path: `/catalog/${categorySlug.value}`, query }, { replace: true })
  
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
  navigateTo(`/catalog/${categorySlug.value}`)
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
  
  // Attributes
  if (catalogStore.filters.filters?.attributes && catalogStore.filters.filters.attributes.length > 0) {
    query.attributes = catalogStore.filters.filters.attributes.join(',')
  }
  
  // Page
  if (catalogStore.pagination.page > 1) {
    query.page = catalogStore.pagination.page.toString()
  }
  
  navigateTo({ path: `/catalog/${categorySlug.value}`, query }, { replace: true })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs 
      :items="breadcrumbs" 
      class="mb-6"
    />

    <!-- Loading -->
    <div v-if="pending" class="animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
    </div>

    <!-- Content -->
    <template v-else-if="category">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {{ category.name }}
          </h1>
          <p v-if="category.description" class="text-gray-500 dark:text-gray-400 mt-1">
            {{ category.description }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ pagination.total }} products
          </p>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Mobile filter button only -->
          <div class="lg:hidden">
            <CatalogFiltersSidebar
              :filters="availableFilters"
              :active-filters="activeFilters"
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
            @update:filters="handleFilterChange"
            @reset="handleReset"
          />
        </aside>

        <!-- Products -->
        <div class="flex-1">
          <CatalogProductGrid :products="products" />

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
    </template>
  </div>
</template>

