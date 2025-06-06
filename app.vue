<script setup lang="ts">
useHead({
  title: 'ConferX - Free online meeting platform',
  htmlAttrs: { class: 'dark min-h-dvh' },
  bodyAttrs: { class: 'min-h-dvh bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-pink-900/20'},
  meta: [
    { name: 'description', content: 'A free online meeting platform for everyone' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})
</script>
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
