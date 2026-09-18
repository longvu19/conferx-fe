<script setup lang="ts">
useHead({
  title: 'ConferX - Free online meeting platform',
  htmlAttrs: { class: 'dark min-h-dvh' },
  bodyAttrs: { class: 'min-h-dvh bg-canvas text-ink antialiased' },
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
