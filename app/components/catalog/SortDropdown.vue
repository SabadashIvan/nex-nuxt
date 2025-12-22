<script setup lang="ts">
/**
 * Sort dropdown for catalog
 */
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const options = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

const currentLabel = computed(() => {
  return options.find(o => o.value === props.modelValue)?.label || 'Sort'
})

function selectOption(value: string) {
  emit('update:modelValue', value)
  isOpen.value = false
}

// Close on click outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.sort-dropdown')) {
      isOpen.value = false
    }
  })
})
</script>

<template>
  <div class="relative sort-dropdown">
    <button
      class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      @click="isOpen = !isOpen"
    >
      <span>{{ currentLabel }}</span>
      <ChevronDown class="h-4 w-4" :class="{ 'rotate-180': isOpen }" />
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div 
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
      >
        <button
          v-for="option in options"
          :key="option.value"
          class="w-full text-left px-4 py-2 text-sm transition-colors"
          :class="[
            option.value === modelValue
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
          ]"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

