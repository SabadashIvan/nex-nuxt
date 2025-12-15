<script setup lang="ts">
/**
 * Blog post card component
 */
import { Calendar, Clock, ArrowRight } from 'lucide-vue-next'
import type { BlogPost } from '~/types'
import { formatDate } from '~/utils/format'

interface Props {
  post: BlogPost
}

const props = defineProps<Props>()

// Helper to get featured image URL (handles both object and string)
const featuredImageUrl = computed(() => {
  const img = props.post.featured_image || props.post.image
  if (!img) return null
  if (typeof img === 'string') return img
  if (typeof img === 'object' && 'url' in img) return img.url
  return null
})
</script>

<template>
  <article class="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
    <!-- Image -->
    <NuxtLink :to="`/blog/${post.slug}`" class="block aspect-video overflow-hidden">
      <NuxtImg
        v-if="featuredImageUrl"
        :src="featuredImageUrl"
        :alt="post.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <span class="text-gray-400">No image</span>
      </div>
    </NuxtLink>

    <!-- Content -->
    <div class="p-5">
      <!-- Category -->
      <NuxtLink
        v-if="post.category"
        :to="`/blog/category/${post.category.slug}`"
        class="inline-block text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2 hover:underline"
      >
        {{ post.category.title || post.category.name }}
      </NuxtLink>

      <!-- Title -->
      <NuxtLink :to="`/blog/${post.slug}`">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          {{ post.title }}
        </h2>
      </NuxtLink>

      <!-- Excerpt -->
      <p v-if="post.excerpt" class="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
        {{ post.excerpt }}
      </p>

      <!-- Meta -->
      <div class="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <Calendar class="h-4 w-4" />
          {{ formatDate(post.published_at) }}
        </span>
        <span v-if="post.reading_time" class="flex items-center gap-1">
          <Clock class="h-4 w-4" />
          {{ post.reading_time }} min read
        </span>
      </div>

      <!-- Read more -->
      <NuxtLink
        :to="`/blog/${post.slug}`"
        class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all"
      >
        Read More
        <ArrowRight class="h-4 w-4" />
      </NuxtLink>
    </div>
  </article>
</template>

