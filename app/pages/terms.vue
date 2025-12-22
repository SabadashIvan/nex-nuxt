<script setup lang="ts">
/**
 * Terms of Service page
 */
useHead({
  title: 'Terms of Service',
  meta: [
    { name: 'description', content: 'Terms of service' },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <UiBreadcrumbs :items="[{ label: 'Terms of Service' }]" class="mb-6" />
    
    <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
      Terms of Service
    </h1>
    
    <div class="prose prose-lg dark:prose-invert max-w-none">
      <p class="text-gray-600 dark:text-gray-400">
        Terms of service content will be added here.
      </p>
    </div>
  </div>
</template>

