<template>
  <footer id="footer" class="relative mt-22 border-t border-white/7 px-6 py-9 sm:px-12">
    <div class="mx-auto flex max-w-360 flex-col items-center justify-between gap-4 sm:flex-row">
      <NuxtLink to="/" aria-label="ConferX home">
        <img src="/conferx-logo.svg" alt="ConferX" class="h-6 block opacity-75">
      </NuxtLink>
      <div class="flex items-center gap-7">
        <NuxtLink to="/" class="text-[13px] text-muted hover:text-ink transition-colors">Privacy</NuxtLink>
        <NuxtLink to="/" class="text-[13px] text-muted hover:text-ink transition-colors">Terms</NuxtLink>
        <span class="font-mono text-[11px] tracking-[.06em] text-faint">© 2026 CONFERX</span>
      </div>
    </div>
  </footer>
</template>
