<script setup lang="ts">
/**
 * Breadcrumb navigation component
 */
import { ChevronRight, Home } from 'lucide-vue-next'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items: BreadcrumbItem[]
  showHome?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHome: true,
})

const allItems = computed(() => {
  if (props.showHome) {
    return [{ label: 'Home', to: '/' }, ...props.items]
  }
  return props.items
})
</script>

<template>
  <nav class="flex items-center text-sm" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <template v-for="(item, index) in allItems" :key="index">
        <!-- Separator -->
        <li v-if="index > 0" class="flex items-center">
          <ChevronRight class="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </li>

        <!-- Breadcrumb item -->
        <li class="flex items-center">
          <NuxtLink
            v-if="item.to && index !== allItems.length - 1"
            :to="item.to"
            class="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Home v-if="index === 0 && showHome" class="h-4 w-4 mr-1" />
            <span>{{ item.label }}</span>
          </NuxtLink>
          
          <span
            v-else
            class="text-gray-900 dark:text-gray-100 font-medium"
            aria-current="page"
          >
            {{ item.label }}
          </span>
        </li>
      </template>
    </ol>
  </nav>
</template>

