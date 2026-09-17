// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: {
    enabled: true,
    timeline: {
      enabled: true
    }
  },
  css: [
    '/assets/css/main.css'
  ],
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    'nuxt-particles',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  runtimeConfig: {
    // Gateway the Nuxt server proxies /api/** to. Override with NUXT_API_BASE.
    apiBase: 'http://localhost:9080'
  },
  particles: {
    mode: 'full', // 'full' | 'slim' | 'basic' | 'custom'
    lazy: true
  },
  vite: {
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true
      }
    }
  },
  app: {
    rootAttrs: {
      class: 'min-h-dvh',
    }
  },
  fonts: {
    provider: 'google',
    families: [
      {
        name: 'Inter',
        display: 'swap',
        weights: [200, 400, 500, 600],
        styles: ['normal', 'italic'],
        fallbacks: ['Roboto'],
      }
    ]
  }
})
