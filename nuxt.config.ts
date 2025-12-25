import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-12-22',
  
  runtimeConfig: {
    apiBackendUrl: process.env.NUXT_API_BACKEND_URL || 'https://api.nexora-room15.store',
    apiSecret: process.env.NUXT_API_SECRET,
    public: {
      apiBackendUrl:
        process.env.NUXT_PUBLIC_API_BACKEND_URL ||
        process.env.NUXT_API_BACKEND_URL ||
        'https://api.nexora-room15.store',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  modules: [
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint',
    'nuxt-auth-sanctum'
  ],

  sanctum: {
    baseUrl: process.env.NUXT_PUBLIC_API_BACKEND_URL || 'https://api.nexora-room15.store',
    origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/login',
      logout: '/logout',
      user: '/api/v1/auth/user',
    },
    redirectIfAuthenticated: '/',
    redirectIfUnauthenticated: '/auth/login',
  },

  css: ['./app/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  routeRules: {
    // Категории - кэшировать на 1 час (SWR: показываем кэш, обновляем в фоне)
    '/categories': { swr: 3600 },
    '/categories/**': { swr: 3600 },
    
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