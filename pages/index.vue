<script setup lang="ts">
/**
 * Home page - SSR for SEO
 */
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-vue-next'
import { useCatalogStore } from '~/stores/catalog.store'
import { getImageUrl } from '~/utils'

// Fetch featured products and categories on SSR
// Access store inside callbacks to ensure Pinia is initialized
const { data: featuredProducts, pending: productsLoading } = await useAsyncData(
  'home-featured-products',
  async () => {
    const catalogStore = useCatalogStore()
    await catalogStore.fetchProducts({ per_page: 8, sort: 'popular' })
    return catalogStore.products
  }
)

const { data: categories } = await useAsyncData(
  'home-categories',
  async () => {
    const catalogStore = useCatalogStore()
    await catalogStore.fetchCategories()
    return catalogStore.rootCategories
  }
)

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'On orders over $50' },
  { icon: Shield, title: 'Secure Payment', description: '100% secure checkout' },
  { icon: RefreshCw, title: 'Easy Returns', description: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', description: 'Dedicated support team' },
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Discover Quality Products for Every Need
          </h1>
          <p class="mt-6 text-lg md:text-xl text-primary-100">
            Shop the latest trends with confidence. Premium quality, competitive prices, and exceptional service.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <NuxtLink
              to="/catalog"
              class="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Shop Now
              <ArrowRight class="h-5 w-5" />
            </NuxtLink>
            <NuxtLink
              to="/catalog?sort=newest"
              class="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              New Arrivals
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <!-- Decorative elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div class="absolute -left-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
      </div>
    </section>

    <!-- Features -->
    <section class="bg-white dark:bg-gray-900 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div 
            v-for="feature in features" 
            :key="feature.title"
            class="text-center"
          >
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
              <component :is="feature.icon" class="h-6 w-6" />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ feature.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Shop by Category
          </h2>
          <NuxtLink 
            to="/catalog" 
            class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            View All
          </NuxtLink>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <NuxtLink
            v-for="category in categories"
            :key="category.id"
            :to="`/catalog/${category.slug}`"
            class="group relative aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800"
          >
            <NuxtImg
              v-if="getImageUrl(category.image)"
              :src="getImageUrl(category.image)"
              :alt="category.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div class="absolute inset-0 flex items-end p-4">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ category.name }}</h3>
                <p v-if="category.products_count" class="text-sm text-gray-300">
                  {{ category.products_count }} products
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-16 bg-gray-100 dark:bg-gray-900/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Featured Products
          </h2>
          <NuxtLink 
            to="/catalog?sort=popular" 
            class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            View All
          </NuxtLink>
        </div>

        <CatalogProductGrid 
          :products="featuredProducts || []" 
          :loading="productsLoading" 
        />
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 class="text-2xl md:text-3xl font-bold mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p class="text-primary-100 mb-6 max-w-xl mx-auto">
            Get the latest updates on new products and upcoming sales delivered to your inbox.
          </p>
          <form class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" @submit.prevent>
            <input
              type="email"
              placeholder="Enter your email"
              class="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:outline-none"
            >
            <button
              type="submit"
              class="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

