<script setup lang="ts">
/**
 * Empty state placeholder component
 */
import { Package } from 'lucide-vue-next'

interface Props {
  title?: string
  description?: string
  icon?: Component
}

const props = withDefaults(defineProps<Props>(), {
  title: 'No items found',
  description: '',
  icon: undefined,
})

const IconComponent = computed(() => props.icon || Package)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
      <component 
        :is="IconComponent" 
        class="h-12 w-12 text-gray-400 dark:text-gray-500" 
      />
    </div>
    
    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      {{ title }}
    </h3>
    
    <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
      {{ description }}
    </p>
    
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>

