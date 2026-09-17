<script setup lang="ts">
const { user, ready, logout } = useAuth()
const toast = useToast()

const signOut = async () => {
  await logout()
  toast.add({ title: 'Signed out', icon: 'i-lucide-log-out' })
  await navigateTo('/')
}

const menu = computed(() => [
  [{ label: user.value?.email ?? '', type: 'label' as const }],
  [{ label: 'My meetings', icon: 'i-lucide-calendar-days', to: '/account' }],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: signOut }]
])
</script>
<template>
  <nav class="flex items-center gap-2" aria-label="Account">
    <template v-if="!ready" />
    <UDropdownMenu v-else-if="user" :items="menu" :content="{ align: 'end' }">
      <UButton color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down" :label="user.display_name"
        :avatar="{ alt: user.display_name, size: 'xs' }" />
    </UDropdownMenu>
    <template v-else>
      <UButton to="/login" color="neutral" variant="ghost" label="Sign in" />
      <UButton to="/register" color="primary" variant="soft" label="Create account" />
    </template>
  </nav>
</template>
