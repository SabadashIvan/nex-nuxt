<script setup lang="ts">
/**
 * Root application component
 */

import { useSystemStore } from '~/stores/system.store'
import { useAuthStore } from '~/stores/auth.store'

// Initialize on client
onMounted(async () => {
  // Access stores inside onMounted to ensure Pinia is initialized
  const systemStore = useSystemStore()
  const authStore = useAuthStore()

  // Fetch system config
  if (!systemStore.systemConfig) {
    await systemStore.fetchSystemConfig()
  }

  // Try to restore user session from token
  await authStore.initialize()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Global styles - Nuxt UI handles most styling */
html {
  scroll-behavior: smooth;
}
</style>
