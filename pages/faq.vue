<script setup lang="ts">
/**
 * Frequently Asked Questions page
 */
useHead({
  title: 'FAQ',
  meta: [
    { name: 'description', content: 'Frequently asked questions' },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <UiBreadcrumbs :items="[{ label: 'FAQ' }]" class="mb-6" />
    
    <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
      Frequently Asked Questions
    </h1>
    
    <div class="prose prose-lg dark:prose-invert max-w-none">
      <p class="text-gray-600 dark:text-gray-400">
        FAQ content will be added here.
      </p>
    </div>
  </div>
</template>

