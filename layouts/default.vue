<script setup lang="ts">
/**
 * Default layout with header and footer
 */
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <LayoutAppHeader />
    
    <main class="flex-1">
      <slot />
    </main>
    
    <LayoutAppFooter />
  </div>
</template>

