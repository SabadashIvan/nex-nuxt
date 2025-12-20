/**
 * Client-side initialization plugin
 * Initializes stores and loads essential data on app mount
 */

import { useSystemStore } from '~/stores/system.store'
import { useAuthStore } from '~/stores/auth.store'

export default defineNuxtPlugin(async () => {
  // Capture Nuxt context to preserve it after await
  const nuxtApp = useNuxtApp()
  const systemStore = useSystemStore()
  const authStore = useAuthStore()

  // Initialize system config (locales, currencies)
  if (!systemStore.initialized) {
    try {
      await systemStore.fetchSystemConfig()
      systemStore.initialized = true
    } catch (error) {
      console.error('Failed to initialize system config:', error)
    }
  }

  // Try to restore auth from session cookie (Laravel Sanctum)
  try {
    await nuxtApp.runWithContext(async () => await authStore.initialize())
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
})

