<template>
  <!-- Khung landing: lưới mảnh phủ nền, lưới sáng + quầng xanh bám con trỏ. -->
  <div v-spotlight class="relative min-h-dvh bg-canvas overflow-hidden">
    <div class="grid-veil absolute inset-x-0 top-0 h-250" />
    <div class="grid-spot" />
    <div class="glow-spot" />
    <div
      class="pointer-events-none absolute -top-65 left-1/2 h-140 w-275 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(70,128,202,.22),rgba(70,128,202,0)_65%)]" />

    <!-- Artboard A rộng 1440px: giữ nội dung trong khung đó, nền vẫn tràn viền. -->
    <header class="relative z-10 border-b border-white/[.055]">
      <div class="mx-auto flex max-w-360 items-center gap-8 px-6 py-5 sm:px-12">
        <NuxtLink to="/" aria-label="ConferX home"><img src="/conferx-logo.svg" alt="ConferX" class="h-6.5 block"></NuxtLink>
        <nav class="ml-4 hidden items-center gap-7 md:flex" aria-label="Sections">
          <a href="#features" class="text-sm text-muted hover:text-ink transition-colors">Features</a>
          <a href="#security" class="text-sm text-muted hover:text-ink transition-colors">Security</a>
          <a href="#faq" class="text-sm text-muted hover:text-ink transition-colors">FAQ</a>
        </nav>
        <AuthNav class="ml-auto" />
      </div>
    </header>

    <!-- Không bó chiều rộng ở đây: các band (security, FAQ) phải tràn viền.
         Mỗi section tự bó phần content bên trong vào max-w-360. -->
    <main class="relative z-10">
      <slot />
    </main>

    <MainFooter class="z-10" />
  </div>
</template>
