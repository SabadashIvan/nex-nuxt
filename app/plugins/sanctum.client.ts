/**
 * Sanctum client-side plugin
 * Initializes Sanctum auth state and sets up automatic CSRF handling
 */

export default defineNuxtPlugin(() => {
  // This plugin runs on client-side only
  // The nuxt-auth-sanctum module should handle most of the setup automatically
  // This plugin ensures proper initialization and can add custom logic if needed

  const nuxtApp = useNuxtApp()

  // Initialize Sanctum auth state on client mount
  // The module should provide useSanctumAuth composable
  // We can add custom initialization logic here if needed

  // Note: The actual Sanctum integration is handled by the nuxt-auth-sanctum module
  // This plugin serves as a placeholder for any custom client-side Sanctum logic
})

