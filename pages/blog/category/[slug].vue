<script setup lang="ts">
/**
 * Blog category page - SSR for SEO
 */
const route = useRoute()
const blogStore = useBlogStore()

const slug = computed(() => route.params.slug as string)
const page = computed(() => route.query.page ? parseInt(route.query.page as string) : 1)

// Fetch category and posts with SSR
const { data: category, pending, refresh } = await useAsyncData(
  `blog-category-${slug.value}-${page.value}`,
  async () => {
    console.log('Fetching category and posts for:', { slug: slug.value, page: page.value })
    await blogStore.fetchPostsByCategory(slug.value, page.value)
    return blogStore.currentCategory
  },
  { 
    watch: [slug, page],
    // Ensure we refetch on client-side navigation
    server: true,
    default: () => null,
  }
)

// Watch for route changes to ensure we refetch
watch(() => route.params.slug, async (newSlug) => {
  if (newSlug && newSlug !== slug.value) {
    console.log('Route slug changed, refreshing data:', newSlug)
    await refresh()
  }
})

// Handle 404
if (!category.value && !pending.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Category Not Found',
  })
}

const posts = computed(() => blogStore.posts)
const pagination = computed(() => blogStore.pagination)

const breadcrumbs = computed(() => {
  if (!category.value) {
    return [{ label: 'Blog', to: '/blog' }]
  }
  return [
    { label: 'Blog', to: '/blog' },
    { label: category.value.title || category.value.name || 'Category' },
  ]
})

function handlePageChange(newPage: number) {
  navigateTo({ 
    path: `/blog/category/${slug.value}`, 
    query: { page: newPage.toString() } 
  })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading -->
    <div v-if="pending" class="animate-pulse">
      <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8" />
    </div>

    <template v-else-if="category">
      <!-- Breadcrumbs -->
      <UiBreadcrumbs :items="breadcrumbs" class="mb-6" />

      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">{{ category.title || category.name }}</h1>
        <p v-if="category.description" class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ category.description }}
        </p>
      </div>

      <!-- Posts -->
      <div v-if="posts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BlogPostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>

      <!-- Empty -->
      <UiEmptyState 
        v-else 
        title="No posts in this category" 
        description="Check back soon for new content"
      />

      <!-- Pagination -->
      <div v-if="pagination.lastPage > 1" class="mt-12">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="pagination.lastPage"
          @update:current-page="handlePageChange"
        />
      </div>
    </template>
  </div>
</template>

