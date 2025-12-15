<script setup lang="ts">
/**
 * Catalog page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'

const route = useRoute()

// Get initial query params
const initialFilters = computed(() => ({
  search: route.query.search as string | undefined,
  sort: route.query.sort as string | undefined,
  page: route.query.page ? parseInt(route.query.page as string) : 1,
}))

// Fetch products with SSR - access store inside callback
const { pending, refresh } = await useAsyncData(
  `catalog-${JSON.stringify(route.query)}`,
  async () => {
    const catalogStore = useCatalogStore()
    await catalogStore.fetchProducts({
      search: initialFilters.value.search,
      page: initialFilters.value.page,
    })
    if (initialFilters.value.sort) {
      catalogStore.sorting = initialFilters.value.sort
    }
    return catalogStore.products
  },
  { watch: [() => route.query] }
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
    return 'default'
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
async function handleFilterChange(filters: Record<string, unknown>) {
  const catalogStore = useCatalogStore()
  await catalogStore.applyFilters(filters as Record<string, string | number | undefined>)
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
  await catalogStore.goToPage(page)
  updateUrl()
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
  
  if (catalogStore.filters.search) query.search = catalogStore.filters.search
  if (catalogStore.sorting !== 'default') query.sort = catalogStore.sorting
  if (catalogStore.pagination.page > 1) query.page = catalogStore.pagination.page.toString()
  
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          All Products
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ pagination.total }} products found
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <CatalogFiltersSidebar
          :filters="availableFilters"
          :active-filters="activeFilters"
          :loading="pending"
          @update:filters="handleFilterChange"
          @reset="handleReset"
        />
        <CatalogSortDropdown
          :model-value="sorting"
          @update:model-value="handleSortChange"
        />
      </div>
    </div>

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

