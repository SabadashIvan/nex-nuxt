<script setup lang="ts">
/**
 * Category page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'

const route = useRoute()

const categorySlug = computed(() => route.params.category as string)

// Fetch category and products with SSR - access store inside callback
const { data: category, pending, error } = await useAsyncData(
  `category-${categorySlug.value}`,
  async () => {
    const catalogStore = useCatalogStore()
    const cat = await catalogStore.fetchCategory(categorySlug.value)
    if (cat) {
      await catalogStore.fetchProducts({ category: categorySlug.value })
    }
    return cat
  },
  { watch: [categorySlug] }
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

// Breadcrumbs
const breadcrumbs = computed(() => {
  const items = [{ label: 'Catalog', to: '/catalog' }]
  if (category.value) {
    items.push({ label: category.value.name })
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
}

// Handle sort change
async function handleSortChange(sort: string) {
  const catalogStore = useCatalogStore()
  await catalogStore.applySorting(sort)
}

// Handle page change
async function handlePageChange(page: number) {
  const catalogStore = useCatalogStore()
  await catalogStore.goToPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Handle reset
async function handleReset() {
  const catalogStore = useCatalogStore()
  catalogStore.resetFilters()
  await catalogStore.fetchProducts({ category: categorySlug.value })
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
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
          <CatalogFiltersSidebar
            :filters="availableFilters"
            :active-filters="activeFilters"
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

