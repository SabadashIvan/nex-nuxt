<script setup lang="ts">
/**
 * Star rating display component
 */
import { Star } from 'lucide-vue-next'

interface Props {
  rating: number
  maxRating?: number
  reviewsCount?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  maxRating: 5,
  reviewsCount: 0,
  showCount: true,
  size: 'md',
})

const stars = computed(() => {
  const result = []
  const fullStars = Math.floor(props.rating)
  const hasHalfStar = props.rating % 1 >= 0.5

  for (let i = 0; i < props.maxRating; i++) {
    if (i < fullStars) {
      result.push('full')
    } else if (i === fullStars && hasHalfStar) {
      result.push('half')
    } else {
      result.push('empty')
    }
  }
  return result
})

const iconSize = computed(() => {
  const sizes = { sm: 14, md: 18, lg: 24 }
  return sizes[props.size]
})

const textSize = computed(() => {
  const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
  return sizes[props.size]
})
</script>

<template>
  <div class="inline-flex items-center gap-1">
    <!-- Stars -->
    <div class="flex items-center">
      <template v-for="(star, index) in stars" :key="index">
        <Star
          :size="iconSize"
          :class="[
            star === 'full' ? 'fill-yellow-400 text-yellow-400' : '',
            star === 'half' ? 'fill-yellow-400/50 text-yellow-400' : '',
            star === 'empty' ? 'text-gray-300 dark:text-gray-600' : '',
          ]"
        />
      </template>
    </div>

    <!-- Rating value -->
    <span :class="['font-medium text-gray-700 dark:text-gray-300', textSize]">
      {{ rating.toFixed(1) }}
    </span>

    <!-- Reviews count -->
    <span 
      v-if="showCount && reviewsCount > 0" 
      :class="['text-gray-500 dark:text-gray-400', textSize]"
    >
      ({{ reviewsCount }})
    </span>
  </div>
</template>

