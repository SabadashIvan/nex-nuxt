<script setup lang="ts">
/**
 * Main application header with navigation
 */
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  GitCompare,
  ChevronDown,
  LogOut,
} from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'
import { useComparisonStore } from '~/stores/comparison.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCatalogStore } from '~/stores/catalog.store'

const isMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

// Access stores inside computed properties (lazy evaluation)
const cartItemCount = computed(() => {
  try {
    return useCartStore().itemCount
  } catch {
    return 0
  }
})

const favoritesCount = computed(() => {
  try {
    return useFavoritesStore().count
  } catch {
    return 0
  }
})

const comparisonCount = computed(() => {
  try {
    return useComparisonStore().count
  } catch {
    return 0
  }
})

const isAuthenticated = computed(() => {
  try {
    return useAuthStore().isAuthenticated
  } catch {
    return false
  }
})

const categories = computed(() => {
  try {
    return useCatalogStore().rootCategories
  } catch {
    return []
  }
})

const userName = computed(() => {
  try {
    return useAuthStore().userName
  } catch {
    return null
  }
})

const userEmail = computed(() => {
  try {
    return useAuthStore().userEmail
  } catch {
    return null
  }
})

// Helper to get auth store safely
function getAuthStore() {
  return useAuthStore()
}

// Helper to get catalog store safely
function getCatalogStore() {
  return useCatalogStore()
}

function handleSearchSelect(query: string) {
  // Navigate to catalog with search query
  navigateTo({
    path: '/catalog',
    query: { search: query },
  })
}

async function handleLogout() {
  try {
    const authStore = getAuthStore()
    await authStore.logout()
    isUserMenuOpen.value = false
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Fetch categories on mount
onMounted(async () => {
  try {
    const catalogStore = getCatalogStore()
    if (catalogStore.categories.length === 0) {
      await catalogStore.fetchCategories()
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              DontWorry
            </span>
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <NuxtLink 
            to="/catalog" 
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
          >
            Catalog
          </NuxtLink>
          
          <!-- Categories dropdown -->
          <div class="relative group">
            <button 
              class="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              Categories
              <ChevronDown class="h-4 w-4" />
            </button>
            
            <div class="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
                <NuxtLink
                  v-for="category in categories"
                  :key="category.id"
                  :to="`/catalog/${category.slug}`"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {{ category.name }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <NuxtLink 
            to="/blog" 
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
          >
            Blog
          </NuxtLink>
        </nav>

        <!-- Search -->
        <div class="hidden md:flex flex-1 max-w-md mx-8">
          <SearchLiveSearch @select="handleSearchSelect" />
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-2">
          <!-- Comparison -->
          <NuxtLink 
            to="/comparison" 
            class="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <GitCompare class="h-6 w-6" />
            <span 
              v-if="comparisonCount > 0"
              class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary-500 text-white text-xs font-medium rounded-full"
            >
              {{ comparisonCount }}
            </span>
          </NuxtLink>

          <!-- Favorites -->
          <NuxtLink 
            to="/favorites" 
            class="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Heart class="h-6 w-6" />
            <span 
              v-if="favoritesCount > 0"
              class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full"
            >
              {{ favoritesCount }}
            </span>
          </NuxtLink>

          <!-- Cart -->
          <NuxtLink 
            to="/cart" 
            class="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ShoppingCart class="h-6 w-6" />
            <span 
              v-if="cartItemCount > 0"
              class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary-500 text-white text-xs font-medium rounded-full"
            >
              {{ cartItemCount }}
            </span>
          </NuxtLink>

          <!-- User menu -->
          <div class="relative">
            <button
              class="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              @click="isUserMenuOpen = !isUserMenuOpen"
            >
              <User class="h-6 w-6" />
            </button>

            <!-- User dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div 
                v-if="isUserMenuOpen"
                class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
              >
                <template v-if="isAuthenticated">
                  <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ userName }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ userEmail }}
                    </p>
                  </div>
                  <NuxtLink
                    to="/profile"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="isUserMenuOpen = false"
                  >
                    My Profile
                  </NuxtLink>
                  <NuxtLink
                    to="/profile/orders"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="isUserMenuOpen = false"
                  >
                    My Orders
                  </NuxtLink>
                  <button
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    @click="handleLogout"
                  >
                    <LogOut class="h-4 w-4" />
                    Sign Out
                  </button>
                </template>
                <template v-else>
                  <NuxtLink
                    to="/auth/login"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="isUserMenuOpen = false"
                  >
                    Sign In
                  </NuxtLink>
                  <NuxtLink
                    to="/auth/register"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="isUserMenuOpen = false"
                  >
                    Create Account
                  </NuxtLink>
                </template>
              </div>
            </Transition>
          </div>

          <!-- Mobile menu button -->
          <button
            class="md:hidden p-2 text-gray-700 dark:text-gray-300"
            @click="isMenuOpen = !isMenuOpen"
          >
            <Menu class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile search -->
      <div class="md:hidden pb-4">
        <SearchLiveSearch @select="handleSearchSelect" />
      </div>
    </div>

    <!-- Mobile navigation -->
    <LayoutMobileMenu v-model="isMenuOpen" :categories="categories" />
  </header>
</template>

