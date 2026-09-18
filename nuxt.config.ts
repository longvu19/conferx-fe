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
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  runtimeConfig: {
    // Gateway the Nuxt server proxies /api/** to. Override with NUXT_API_BASE.
    apiBase: 'http://localhost:9080'
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
        name: 'Instrument Sans',
        display: 'swap',
        weights: [400, 500, 600, 700],
        styles: ['normal'],
        fallbacks: ['Helvetica', 'Arial'],
      },
      {
        // Mã phòng, số liệu, nhãn — mọi thứ cần cảm giác hạ tầng real-time.
        name: 'JetBrains Mono',
        display: 'swap',
        weights: [400, 500],
        styles: ['normal'],
        fallbacks: ['ui-monospace', 'monospace'],
      }
    ]
  }
})
