import tailwindcss from "@tailwindcss/vite";

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
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint'
  ],

  css: ['./app/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  routeRules: {
    // Каталог - кэшировать на 1 час (SWR: показываем кэш, обновляем в фоне)
    '/catalog': { swr: 3600 },
    '/catalog/**': { swr: 3600 },
    
    // Страницы товаров - кэшировать на 1 час (товары меняются реже)
    '/product/**': { swr: 3600 },
    
    // Блог - кэшировать на 1 час (контент меняется редко)
    '/blog': { swr: 3600 },
    '/blog/**': { swr: 3600 },
    
    // Главная страница - кэшировать на 30 минут
    '/': { swr: 1800 },
    
    // Статические страницы - кэшировать на 1 час
    '/faq': { swr: 3600 },
    '/shipping': { swr: 3600 },
    '/returns': { swr: 3600 },
    '/privacy': { swr: 3600 },
    '/terms': { swr: 3600 },
    
    // CSR-only страницы (не кэшируем на сервере, они клиентские)
    '/cart': { ssr: false },
    '/checkout': { ssr: false },
    '/favorites': { ssr: false },
    '/comparison': { ssr: false },
    '/profile/**': { ssr: false },
    '/auth/**': { ssr: false },
  },
})