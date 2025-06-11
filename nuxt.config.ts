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
    provider: 'google', // sets default provider
    families: [
      {
        name: 'Inter', // the 'canonical' name of the font used to look it up in a provider database
        // provider specific options can be provided
        // src: '~/public/roboto.woff2', // you can specify a source within your project
        // specific configuration will be used to generate `@font-face` definitions
        // subsets: ['latin', 'greek'],
        display: 'swap', // or 'block'
        weight: [200, 400],
        styles: ['normal', 'italic'],
        // and produce CSS overrides to reduce layout shift (using fontaine)
        fallbacks: ['Roboto'],
      }
    ]
  }
})