<script setup lang="ts">
/**
 * Mobile navigation menu
 */
import { X, ChevronRight } from 'lucide-vue-next'
import type { Category } from '~/types'

interface Props {
  modelValue: boolean
  categories: Category[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function closeMenu() {
  isOpen.value = false
}

// Prevent body scroll when menu is open
watch(isOpen, (value) => {
  if (import.meta.client) {
    document.body.style.overflow = value ? 'hidden' : ''
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 md:hidden"
    >
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black/50" 
        @click="closeMenu"
      />

      <!-- Menu panel -->
      <Transition
        enter-active-class="transition ease-out duration-300 transform"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition ease-in duration-200 transform"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <div 
          v-if="isOpen"
          class="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-gray-900 shadow-xl"
        >
          <!-- Header -->
          <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
            <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
              DontWorry
            </span>
            <button
              class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              @click="closeMenu"
            >
              <X class="h-6 w-6" />
            </button>
          </div>

          <!-- Navigation -->
          <nav class="px-4 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
            <NuxtLink
              to="/catalog"
              class="flex items-center justify-between px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium"
              @click="closeMenu"
            >
              All Products
              <ChevronRight class="h-5 w-5 text-gray-400" />
            </NuxtLink>

            <!-- Categories -->
            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categories
              </h3>
              <div class="mt-2 space-y-1">
                <NuxtLink
                  v-for="category in categories"
                  :key="category.id"
                  :to="`/catalog/${category.slug}`"
                  class="flex items-center justify-between px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  @click="closeMenu"
                >
                  {{ category.name }}
                  <ChevronRight class="h-5 w-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>

            <!-- Other links -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
              <NuxtLink
                to="/blog"
                class="flex items-center justify-between px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium"
                @click="closeMenu"
              >
                Blog
                <ChevronRight class="h-5 w-5 text-gray-400" />
              </NuxtLink>
            </div>
          </nav>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

