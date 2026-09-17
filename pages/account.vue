<script setup lang="ts">
import * as z from 'zod'
import type { MyRoom } from '~/composables/useRoomApi'

useHead({ title: 'My meetings – ConferX' })
const auth = useAuth()
const api = useRoomApi()
const toast = useToast()

const rooms = ref<MyRoom[]>([])
const loadingRooms = ref(true)
const rejoining = ref<string | null>(null)

const profile = reactive({ displayName: '' })
const savingProfile = ref(false)
const passwords = reactive({ current: '', next: '' })
const savingPassword = ref(false)
const passwordSchema = z.object({
  current: z.string().min(1, 'Enter your current password'),
  next: z.string().min(8, 'Use at least 8 characters').max(128)
})

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    rooms.value = await api.listMyRooms()
  } catch (e) {
    toast.add({ title: 'Could not load your meetings', description: apiErrorMessage(e), color: 'error' })
  } finally {
    loadingRooms.value = false
  }
}

// Wait for the session restore, then require sign-in.
watch(auth.ready, async (ready) => {
  if (!ready) return
  if (!auth.user.value) return navigateTo({ path: '/login', query: { redirect: '/account' } })
  profile.displayName = auth.user.value.display_name
  await loadRooms()
}, { immediate: true })

const active = computed(() => rooms.value.filter(r => r.status !== 'closed'))
const ended = computed(() => rooms.value.filter(r => r.status === 'closed'))
const date = (value: string) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

const rejoin = async (roomId: string) => {
  rejoining.value = roomId
  try {
    await api.joinRoom(roomId, {})
    await navigateTo(`/room/${roomId}`)
  } catch (e) {
    toast.add({ title: 'Could not rejoin', description: apiErrorMessage(e), color: 'error' })
    rejoining.value = null
  }
}

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `${what} copied`, color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Copy failed', color: 'error' })
  }
}

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await auth.updateProfile(profile.displayName.trim())
    toast.add({ title: 'Name updated', color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    toast.add({ title: 'Could not update your name', description: apiErrorMessage(e), color: 'error' })
  } finally {
    savingProfile.value = false
  }
}

const savePassword = async () => {
  savingPassword.value = true
  try {
    await auth.changePassword(passwords.current, passwords.next)
    passwords.current = ''
    passwords.next = ''
    toast.add({ title: 'Password changed', description: 'Other devices were signed out.', color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    toast.add({ title: 'Could not change the password', description: apiErrorMessage(e), color: 'error' })
  } finally {
    savingPassword.value = false
  }
}
</script>
<template>
  <UContainer class="py-20 max-w-3xl">
    <div v-if="!auth.ready.value || !auth.user.value" class="flex justify-center py-20" role="status">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin text-blue-400" />
    </div>

    <template v-else>
      <div class="flex items-center gap-4 mb-10">
        <NuxtLink to="/" aria-label="ConferX home"><img src="/conferx-logo.svg" alt="" class="h-9"></NuxtLink>
      </div>

      <section class="mb-12">
        <div class="flex items-end justify-between mb-4">
          <h1 class="text-2xl font-semibold">My meetings</h1>
          <UButton to="/" icon="i-lucide-plus" label="New meeting" />
        </div>

        <div v-if="loadingRooms" class="py-10 text-center text-gray-400" role="status">Loading meetings…</div>
        <div v-else-if="!rooms.length" class="rounded-xl border border-dashed border-gray-600 p-10 text-center">
          <p class="text-gray-300">Meetings you create while signed in appear here.</p>
          <UButton to="/" class="mt-4" label="Create a meeting" />
        </div>
        <template v-else>
          <ul class="divide-y divide-gray-700/60 rounded-xl border border-gray-700/60">
            <li v-for="room in active" :key="room.room_id" class="flex flex-wrap items-center gap-3 px-4 py-3">
              <div class="min-w-0 flex-1">
                <p class="font-medium tracking-wide">{{ room.room_id }}</p>
                <p class="text-sm text-gray-400">Created {{ date(room.created_at) }}</p>
              </div>
              <UBadge :label="room.status === 'private' ? 'Asks before joining' : 'Open'" variant="subtle"
                :color="room.status === 'private' ? 'warning' : 'success'" />
              <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-key-round" :label="room.room_password"
                :aria-label="`Copy meeting password for ${room.room_id}`" @click="copy(room.room_password, 'Meeting password')" />
              <UButton size="sm" label="Rejoin" :loading="rejoining === room.room_id" @click="rejoin(room.room_id)" />
            </li>
          </ul>
          <details v-if="ended.length" class="mt-4">
            <summary class="cursor-pointer text-sm text-gray-400">Ended meetings ({{ ended.length }})</summary>
            <ul class="mt-2 space-y-1">
              <li v-for="room in ended" :key="room.room_id" class="flex justify-between px-4 py-2 text-sm text-gray-400">
                <span>{{ room.room_id }}</span><span>{{ date(room.created_at) }}</span>
              </li>
            </ul>
          </details>
        </template>
      </section>

      <section class="grid gap-6 md:grid-cols-2">
        <UCard>
          <h2 class="font-semibold mb-4">Profile</h2>
          <UForm :state="profile" class="space-y-4" @submit="saveProfile">
            <UFormField label="Email">
              <UInput :model-value="auth.user.value.email" disabled class="w-full" />
            </UFormField>
            <UFormField label="Display name" name="displayName">
              <UInput v-model="profile.displayName" maxlength="64" class="w-full" />
            </UFormField>
            <UButton type="submit" label="Save name" :loading="savingProfile"
              :disabled="!profile.displayName.trim() || profile.displayName.trim() === auth.user.value.display_name" />
          </UForm>
        </UCard>

        <UCard>
          <h2 class="font-semibold mb-4">Password</h2>
          <UForm :schema="passwordSchema" :state="passwords" class="space-y-4" @submit="savePassword">
            <UFormField label="Current password" name="current">
              <UInput v-model="passwords.current" type="password" autocomplete="current-password" class="w-full" />
            </UFormField>
            <UFormField label="New password" name="next" help="At least 8 characters. Signs out your other devices.">
              <UInput v-model="passwords.next" type="password" autocomplete="new-password" class="w-full" />
            </UFormField>
            <UButton type="submit" label="Change password" :loading="savingPassword" />
          </UForm>
        </UCard>
      </section>
    </template>
  </UContainer>
</template>
