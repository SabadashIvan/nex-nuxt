<script setup lang="ts">
/**
 * Blog listing page - SSR for SEO
 */
const route = useRoute()
const blogStore = useBlogStore()

const page = computed(() => route.query.page ? parseInt(route.query.page as string) : 1)

// Fetch posts and categories with SSR
const { pending } = await useAsyncData(
  `blog-posts-${page.value}`,
  async () => {
    await blogStore.fetchPosts({ page: page.value })
    return blogStore.posts
  },
  { watch: [page] }
)

await useAsyncData('blog-categories', async () => {
  if (blogStore.categories.length === 0) {
    await blogStore.fetchCategories()
  }
  return blogStore.categories
})

const posts = computed(() => blogStore.posts)
const categories = computed(() => blogStore.categories)
const pagination = computed(() => blogStore.pagination)

function handlePageChange(newPage: number) {
  navigateTo({ path: '/blog', query: { page: newPage.toString() } })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs :items="[{ label: 'Blog' }]" class="mb-6" />

    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">Our Blog</h1>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Discover tips, guides, and stories from our team
      </p>
    </div>

    <!-- Categories -->
    <div v-if="categories.length" class="flex flex-wrap justify-center gap-3 mb-8">
      <NuxtLink
        to="/blog"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="[
          !route.query.category 
            ? 'bg-primary-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
      >
        All Posts
      </NuxtLink>
      <NuxtLink
        v-for="category in categories"
        :key="category.id"
        :to="`/blog/category/${category.slug}`"
        class="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {{ category.title || category.name }}
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
        <div class="aspect-video bg-gray-200 dark:bg-gray-800" />
        <div class="p-5 space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>

    <!-- Posts -->
    <div v-else-if="posts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BlogPostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>

    <!-- Empty -->
    <UiEmptyState v-else title="No posts yet" description="Check back soon for new content" />

    <!-- Pagination -->
    <div v-if="pagination.lastPage > 1" class="mt-12">
      <UiPagination
        :current-page="pagination.page"
        :total-pages="pagination.lastPage"
        @update:current-page="handlePageChange"
      />
    </div>
  </div>
</template>

