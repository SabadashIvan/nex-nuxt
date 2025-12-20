<script setup lang="ts">
/**
 * Category page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'
import type { Category, ProductFilter } from '~/types'

// Call composables at top level of setup - this is safe in Nuxt 3
const route = useRoute()
const catalogStore = useCatalogStore()
// Create API instance at top level where context is guaranteed
const api = useApi()

// Helpers for reactive route access
const categorySlug = computed(() => (route.params.category as string) || '')

const asyncKey = computed(() => `category-${categorySlug.value}`)

const { data: category, pending, error, refresh } = await useAsyncData(
  asyncKey.value,
  async () => {
    const slug = categorySlug.value
    const query = route.query
    const filters = {
      q: query.q as string | undefined,
      sort: query.sort as string | undefined,
      page: query.page ? parseInt(query.page as string) : 1,
      categories: query.categories as string | undefined,
      brands: query.brands as string | undefined,
      price_min: query.price_min ? Number(query.price_min) : undefined,
      price_max: query.price_max ? Number(query.price_max) : undefined,
      attributes: query.attributes ? (query.attributes as string).split(',') : undefined,
    }
    console.log('Fetching category data for slug:', slug)
    // Use store instance created at top level, pass API instance to preserve context
    const cat = await catalogStore.fetchCategory(slug, false, api)
    console.log('Fetched category:', cat)
    if (cat && cat.id) {
      // Build filters object from URL params
      // Always include current category ID in filters
      const filterParams: any = {
        page: filters.page,
        filters: {
          // Always filter by current category ID
          categories: String(cat.id),
        },
      }
      
      // Add additional filters from URL params
      if (filters.q) {
        filterParams.filters.q = filters.q
      }
      
      // If URL has categories param, merge with current category ID
      if (filters.categories) {
        const urlCategoryIds = filters.categories.split(',')
        // Ensure current category ID is included
        if (!urlCategoryIds.includes(String(cat.id))) {
          urlCategoryIds.push(String(cat.id))
        }
        filterParams.filters.categories = urlCategoryIds.join(',')
      }
      
      if (filters.brands) {
        filterParams.filters.brands = filters.brands
      }
      if (filters.price_min !== undefined) {
        filterParams.filters.price_min = filters.price_min
      }
      if (filters.price_max !== undefined) {
        filterParams.filters.price_max = filters.price_max
      }
      if (filters.attributes && filters.attributes.length > 0) {
        filterParams.filters.attributes = filters.attributes
      }
      
      console.log('Fetching products with filters:', filterParams)
      // Pass API instance to preserve context after await
      await catalogStore.fetchProducts(filterParams, api)
      console.log('Products fetched:', catalogStore.products.length)
      console.log('Products data:', catalogStore.products)
      console.log('Pagination:', catalogStore.pagination)
      
      // Apply filters to store so they're available for ActiveFilters component
      catalogStore.filters = { ...catalogStore.filters, ...filterParams }
      
      if (filters.sort) {
        // Validate sort value before setting
        const validSorts = ['newest', 'price_asc', 'price_desc']
        const sortValue = filters.sort
        if (validSorts.includes(sortValue)) {
          catalogStore.sorting = sortValue as 'newest' | 'price_asc' | 'price_desc'
        }
      }
    } else {
      console.warn('Category not found or missing ID:', cat)
    }
    return cat
  },
  {
    server: true,
    default: () => null,
    watch: [() => route.fullPath],
  }
)

// Handle 404 - check after data loads
watch([pending, category, error], ([isPending, cat, err]) => {
  if (!isPending && !cat && !err) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Category Not Found',
    })
  }
})


// Computed values - access store instance created at top level
const products = computed(() => {
  const productsList = catalogStore.products
  console.log('Products computed - count:', productsList.length, 'data:', productsList)
  return productsList
})
const pagination = computed(() => catalogStore.pagination)
const sorting = computed(() => catalogStore.sorting)
const availableFilters = computed(() => catalogStore.availableFilters)
const activeFilters = computed(() => catalogStore.filters)

// Breadcrumbs
const breadcrumbs = computed(() => {
  const items = [{ label: 'Catalog', to: '/catalog' }]
  if (category.value) {
    const categoryName = category.value.title || category.value.name || 'Category'
    items.push({ label: categoryName, to: `/catalog/${categorySlug.value}` })
  }
  return items
})

// Get category image URL
function getCategoryImageUrl(image: Category['image']): string | undefined {
  if (!image || image === null) return undefined
  if (typeof image === 'string') return image
  if (typeof image === 'object' && 'url' in image) {
    return image.url || undefined
  }
  return undefined
}

// Get category icon URL
function getCategoryIconUrl(icon: Category['icon']): string | undefined {
  if (!icon || icon === null) return undefined
  if (typeof icon === 'string') return icon
  if (typeof icon === 'object' && 'url' in icon) {
    return icon.url || undefined
  }
  return undefined
}

// Get category display name
const categoryName = computed(() => {
  if (!category.value) return ''
  return category.value.title || category.value.name || 'Category'
})

// Handle filter changes
async function handleFilterChange(filters: ProductFilter) {
  
  // Ensure current category ID is always included
  const updatedFilters = { ...filters }
  if (!updatedFilters.filters) {
    updatedFilters.filters = {}
  }
  
  // Always include current category ID
  if (category.value?.id) {
    const currentCategoryId = String(category.value.id)
    if (updatedFilters.filters.categories) {
      const categoryIds = updatedFilters.filters.categories.split(',')
      if (!categoryIds.includes(currentCategoryId)) {
        categoryIds.push(currentCategoryId)
        updatedFilters.filters.categories = categoryIds.join(',')
      }
    } else {
      updatedFilters.filters.categories = currentCategoryId
    }
  }
  
  await catalogStore.applyFilters({
    ...updatedFilters,
    category: categorySlug.value,
  } as ProductFilter)
  updateUrl()
}

// Handle sort change
async function handleSortChange(sort: string) {
  await catalogStore.applySorting(sort)
  updateUrl()
}

// Handle page change
async function handlePageChange(page: number) {
  // Update URL first, then fetch products
  const query: Record<string, string> = {}
  
  // Preserve all current filters
  if (catalogStore.filters.filters?.q) {
    query.q = catalogStore.filters.filters.q
  }
  if (catalogStore.sorting !== 'newest') {
    query.sort = catalogStore.sorting
  }
  // Categories - only add to URL if there are multiple categories
  if (catalogStore.filters.filters?.categories) {
    const categoryIds = catalogStore.filters.filters.categories.split(',')
    if (category.value?.id) {
      const currentCategoryId = String(category.value.id)
      const otherCategories = categoryIds.filter(id => id !== currentCategoryId)
      if (otherCategories.length > 0) {
        query.categories = catalogStore.filters.filters.categories
      }
    } else {
      query.categories = catalogStore.filters.filters.categories
    }
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
  const currentFilters = { ...catalogStore.filters }
  
  if (!currentFilters.filters) {
    currentFilters.filters = {}
  }
  
  switch (type) {
    case 'categories': {
      // Don't allow removing current category ID
      if (category.value && String(category.value.id) === value) {
        return // Can't remove current category
      }
      
      const categories = currentFilters.filters.categories?.split(',') || []
      const filtered = categories.filter(id => id !== value)
      
      // Always ensure current category ID is included
      if (category.value && !filtered.includes(String(category.value.id))) {
        filtered.push(String(category.value.id))
      }
      
      if (filtered.length > 0) {
        currentFilters.filters.categories = filtered.join(',')
      } else if (category.value) {
        // If no other categories, keep only current category
        currentFilters.filters.categories = String(category.value.id)
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
  
  // Always ensure current category ID is included
  if (category.value?.id && currentFilters.filters) {
    const currentCategoryId = String(category.value.id)
    if (currentFilters.filters.categories) {
      const categoryIds = currentFilters.filters.categories.split(',')
      if (!categoryIds.includes(currentCategoryId)) {
        categoryIds.push(currentCategoryId)
        currentFilters.filters.categories = categoryIds.join(',')
      }
    } else {
      currentFilters.filters.categories = currentCategoryId
    }
  }
  
  // Remove filters object if empty (but keep categories if we have a category)
  if (Object.keys(currentFilters.filters).length === 0 && !category.value?.id) {
    currentFilters.filters = undefined
  }
  
  await catalogStore.applyFilters(currentFilters)
  updateUrl()
}

// Handle reset
async function handleReset() {
  
  // Reset filters but keep current category
  if (category.value?.id) {
    const filters: any = {
      page: 1,
      filters: {
        categories: String(category.value.id),
      },
    }
    await catalogStore.fetchProducts(filters)
    catalogStore.filters = filters
  } else {
    catalogStore.resetFilters()
    await catalogStore.fetchProducts()
  }
  
  navigateTo(`/catalog/${categorySlug.value}`)
}

// Update URL with current filters
function updateUrl() {
  const query: Record<string, string> = {}
  
  // Search
  if (catalogStore.filters.filters?.q) {
    query.q = catalogStore.filters.filters.q
  }
  
  // Sort
  if (catalogStore.sorting !== 'newest') {
    query.sort = catalogStore.sorting
  }
  
  // Categories - only add to URL if there are multiple categories (not just current one)
  if (catalogStore.filters.filters?.categories) {
    const categoryIds = catalogStore.filters.filters.categories.split(',')
    // Only add to URL if there are multiple categories or if it's not the current category
    if (category.value?.id) {
      const currentCategoryId = String(category.value.id)
      const otherCategories = categoryIds.filter(id => id !== currentCategoryId)
      if (otherCategories.length > 0) {
        // Include all categories in URL (current + others)
        query.categories = catalogStore.filters.filters.categories
      }
      // If only current category, don't add to URL (it's already in the path)
    } else {
      query.categories = catalogStore.filters.filters.categories
    }
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

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Content -->
    <template v-else-if="category">
      <!-- Category Header with Image -->
      <div class="mb-8">
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          <!-- Category Image -->
          <div v-if="getCategoryImageUrl(category.image)" class="w-full lg:w-64 flex-shrink-0">
            <div class="aspect-video lg:aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
              <NuxtImg
                :src="getCategoryImageUrl(category.image)"
                :alt="categoryName"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Category Info -->
          <div class="flex-1">
            <div class="flex items-start gap-4 mb-4">
              <!-- Category Icon -->
              <div v-if="getCategoryIconUrl(category.icon)" class="flex-shrink-0">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <NuxtImg
                    :src="getCategoryIconUrl(category.icon)"
                    :alt="categoryName"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div class="flex-1">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  {{ categoryName }}
                </h1>
                <p v-if="category.description" class="text-gray-500 dark:text-gray-400 mt-2">
                  {{ category.description }}
                </p>
                <p class="text-gray-500 dark:text-gray-400 mt-2">
                  {{ pagination.total }} products
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subcategories -->
      <div v-if="category.children && category.children.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Subcategories
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink
            v-for="subcategory in category.children"
            :key="subcategory.id"
            :to="`/catalog/${subcategory.slug}`"
            class="group flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
          >
            <!-- Subcategory Icon or Image -->
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 flex items-center justify-center">
              <NuxtImg
                v-if="getCategoryIconUrl(subcategory.icon) || getCategoryImageUrl(subcategory.image)"
                :src="getCategoryIconUrl(subcategory.icon) || getCategoryImageUrl(subcategory.image)"
                :alt="subcategory.title || subcategory.name || 'Subcategory'"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100 text-center group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ subcategory.title || subcategory.name || 'Subcategory' }}
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Header with Filters -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
        </div>
        
        <div class="flex items-center gap-4">
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

