<script setup lang="ts">
/**
 * Minimal checkout layout without distractions
 */
import { ArrowLeft, Lock } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- Simple header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink 
            to="/cart" 
            class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft class="h-5 w-5" />
            <span class="hidden sm:inline">Back to Cart</span>
          </NuxtLink>

          <NuxtLink to="/" class="text-xl font-bold text-primary-600 dark:text-primary-400">
            DontWorry
          </NuxtLink>

          <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Lock class="h-5 w-5" />
            <span class="hidden sm:inline text-sm">Secure Checkout</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 py-8">
      <slot />
    </main>

    <!-- Simple footer -->
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          © {{ new Date().getFullYear() }} DontWorry. Secure checkout powered by trusted payment providers.
        </p>
      </div>
    </footer>
  </div>
</template>

