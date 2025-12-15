<script setup lang="ts">
/**
 * Privacy Policy page
 */
useHead({
  title: 'Privacy Policy',
  meta: [
    { name: 'description', content: 'Our privacy policy' },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <UiBreadcrumbs :items="[{ label: 'Privacy Policy' }]" class="mb-6" />
    
    <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
      Privacy Policy
    </h1>
    
    <div class="prose prose-lg dark:prose-invert max-w-none">
      <p class="text-gray-600 dark:text-gray-400">
        Privacy policy content will be added here.
      </p>
    </div>
  </div>
</template>

