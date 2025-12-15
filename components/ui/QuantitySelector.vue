<script setup lang="ts">
/**
 * Quantity selector component for cart items
 */
import { Minus, Plus } from 'lucide-vue-next'

interface Props {
  modelValue: number
  min?: number
  max?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 99,
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const canDecrease = computed(() => props.modelValue > props.min)
const canIncrease = computed(() => props.modelValue < props.max)

function decrease() {
  if (canDecrease.value && !props.disabled) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

function increase() {
  if (canIncrease.value && !props.disabled) {
    emit('update:modelValue', props.modelValue + 1)
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = parseInt(target.value, 10)
  
  if (isNaN(value)) value = props.min
  if (value < props.min) value = props.min
  if (value > props.max) value = props.max
  
  emit('update:modelValue', value)
}

const sizeClasses = computed(() => {
  const sizes = {
    sm: { button: 'h-7 w-7', input: 'h-7 w-10 text-sm', icon: 14 },
    md: { button: 'h-9 w-9', input: 'h-9 w-14 text-base', icon: 16 },
    lg: { button: 'h-11 w-11', input: 'h-11 w-16 text-lg', icon: 20 },
  }
  return sizes[props.size]
})
</script>

<template>
  <div class="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
    <!-- Decrease button -->
    <button
      type="button"
      :disabled="!canDecrease || disabled"
      :class="[
        'flex items-center justify-center rounded-l-lg transition-colors',
        sizeClasses.button,
        canDecrease && !disabled 
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
      ]"
      @click="decrease"
    >
      <Minus :size="sizeClasses.icon" />
    </button>

    <!-- Input -->
    <input
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      :disabled="disabled"
      :class="[
        'text-center border-x border-gray-200 dark:border-gray-700 bg-transparent',
        'focus:outline-none focus:ring-0',
        'text-gray-900 dark:text-gray-100',
        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        sizeClasses.input,
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ]"
      @input="handleInput"
    >

    <!-- Increase button -->
    <button
      type="button"
      :disabled="!canIncrease || disabled"
      :class="[
        'flex items-center justify-center rounded-r-lg transition-colors',
        sizeClasses.button,
        canIncrease && !disabled 
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
      ]"
      @click="increase"
    >
      <Plus :size="sizeClasses.icon" />
    </button>
  </div>
</template>

