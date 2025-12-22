<script setup lang="ts">
/**
 * Profile layout with sidebar navigation
 */
import { User, Package, MapPin, Settings, Bell, CreditCard } from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const navigation = [
  { name: 'Dashboard', to: '/profile', icon: User, exact: true },
  { name: 'My Orders', to: '/profile/orders', icon: Package },
  { name: 'Addresses', to: '/profile/addresses', icon: MapPin },
  { name: 'Settings', to: '/profile/settings', icon: Settings },
]

const isActive = (item: { to: string; exact?: boolean }) => {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <LayoutAppHeader />
    
    <main class="flex-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Sidebar -->
          <aside class="w-full lg:w-64 flex-shrink-0">
            <!-- User info card -->
            <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span class="text-xl font-semibold text-primary-600 dark:text-primary-400">
                    {{ authStore.userName?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-gray-100">
                    {{ authStore.userName }}
                  </h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ authStore.userEmail }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Navigation -->
            <nav class="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
              <NuxtLink
                v-for="item in navigation"
                :key="item.to"
                :to="item.to"
                :class="[
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                  isActive(item)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent',
                ]"
              >
                <component :is="item.icon" class="h-5 w-5" />
                {{ item.name }}
              </NuxtLink>
            </nav>
          </aside>

          <!-- Main content -->
          <div class="flex-1 min-w-0">
            <slot />
          </div>
        </div>
      </div>
    </main>
    
    <LayoutAppFooter />
  </div>
</template>

