<script setup lang="ts">
const { user, ready, logout } = useAuth()
const toast = useToast()

const signOut = async () => {
  await logout()
  toast.add({ title: 'Signed out', icon: 'i-lucide-log-out' })
  await navigateTo('/')
}

const initials = computed(() => {
  const name = user.value?.display_name ?? ''
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '?'
})

const menu = computed(() => [
  [{ label: user.value?.email ?? '', type: 'label' as const }],
  [{ label: 'My meetings', icon: 'i-lucide-calendar-days', to: '/account' }],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: signOut }]
])
</script>
<template>
  <nav class="flex items-center gap-2.5" aria-label="Account">
    <!-- Trạng thái đăng nhập chỉ tồn tại ở client: access token nằm trong bộ nhớ, khôi phục
         từ cookie HttpOnly bằng plugin client. Server luôn render nhánh `!ready` (rỗng), còn
         client có thể đã lật sang `user` trước khi hydrate xong → node mismatch. Cho cả nhánh
         này ra ngoài hydration thay vì cố làm hai bên khớp nhau. -->
    <ClientOnly>
      <template v-if="!ready" />

      <UDropdownMenu v-else-if="user" :items="menu" :content="{ align: 'end' }">
        <button type="button"
          class="flex items-center gap-2.5 rounded-full border border-white/9 bg-raised py-1.25 pl-1.5 pr-3 cursor-pointer hover:border-white/16 transition-colors">
          <span
            class="flex items-center justify-center w-6.5 h-6.5 rounded-full border border-signal-500/40 bg-signal-500/18 font-mono text-[11px] text-signal-300">{{ initials }}</span>
          <span class="text-sm text-ink">{{ user.display_name }}</span>
          <UIcon name="i-lucide-chevron-down" class="text-sm text-muted" />
        </button>
      </UDropdownMenu>

      <template v-else>
        <NuxtLink to="/login"
          class="rounded-lg px-3.5 py-2.25 text-sm text-dim hover:bg-white/5 transition-colors">Sign in</NuxtLink>
        <NuxtLink to="/register" class="btn-soft rounded-lg px-4 py-2.25 text-sm font-medium">Create account</NuxtLink>
      </template>
    </ClientOnly>
  </nav>
</template>
