<script setup lang="ts">
useHead({
  title: 'ConferX - Free online meeting platform',
  htmlAttrs: { class: 'dark min-h-dvh' },
  bodyAttrs: { class: 'min-h-dvh bg-gradient-to-tr from-[#0d0d12] via-[#1a1f2f] to-[#29354d] bg-[length:200%_200%] animate-gradient-xy' },
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
