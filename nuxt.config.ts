import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  runtimeConfig: {
    apiBackendUrl: process.env.NUXT_API_BACKEND_URL || 'http://localhost:8000',
    apiSecret: process.env.NUXT_API_SECRET,
    public: {
      apiBackendUrl:
        process.env.NUXT_PUBLIC_API_BACKEND_URL ||
        process.env.NUXT_API_BACKEND_URL ||
        'http://localhost:8000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  modules: [
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/hints',
    '@pinia/nuxt'
  ],
})