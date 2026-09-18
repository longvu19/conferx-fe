<script setup lang="ts">
import * as z from 'zod'
import type { MyRoom } from '~/composables/useRoomApi'

useHead({ title: 'My meetings – ConferX' })
definePageMeta({ layout: false })

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

const initials = computed(() => {
  const name = auth.user.value?.display_name ?? ''
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '?'
})

const roomLink = (roomId: string) =>
  `${typeof window === 'undefined' ? '' : window.location.origin}/room/${roomId}`

const signOut = async () => {
  await auth.logout()
  toast.add({ title: 'Signed out', icon: 'i-lucide-log-out' })
  await navigateTo('/')
}

const menu = computed(() => [
  [{ label: auth.user.value?.email ?? '', type: 'label' as const }],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: signOut }]
])
</script>
<template>
  <div v-spotlight class="relative min-h-dvh bg-canvas">
    <div class="grid-spot z-0" />
    <div
      class="absolute inset-x-0 top-0 h-105 bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(180deg,#000_0,transparent_85%)]" />

    <header class="relative z-10 flex items-center h-16 px-6 sm:px-12 border-b border-white/6 bg-chrome">
      <NuxtLink to="/" aria-label="ConferX home"><img src="/conferx-logo.svg" alt="ConferX" class="h-6 block"></NuxtLink>
      <!-- Cùng lý do như AuthNav: phiên đăng nhập chỉ có ở client. -->
      <ClientOnly>
        <div v-if="auth.user.value"
          class="ml-auto flex items-center gap-2.5 rounded-full border border-white/9 bg-raised py-1.25 pl-1.5 pr-3">
          <span
            class="flex items-center justify-center w-6.5 h-6.5 rounded-full border border-signal-500/40 bg-signal-500/18 font-mono text-[11px] text-signal-300">{{ initials }}</span>
          <span class="text-sm text-ink">{{ auth.user.value.display_name }}</span>
          <UDropdownMenu :items="menu" :content="{ align: 'end' }">
            <button type="button" aria-label="Account menu"
              class="flex items-center text-muted hover:text-ink cursor-pointer">
              <UIcon name="i-lucide-chevron-down" class="text-sm" />
            </button>
          </UDropdownMenu>
        </div>
      </ClientOnly>
    </header>

    <ClientOnly>
      <!-- Server luôn ra spinner (ready=false); client có thể đã có phiên trước khi hydrate.
           Dùng chính spinner làm fallback nên giao diện không đổi, chỉ hết mismatch. -->
      <template #fallback>
        <div class="relative z-10 flex justify-center py-32" role="status">
          <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin text-signal-400" />
        </div>
      </template>

      <div v-if="!auth.ready.value || !auth.user.value" class="relative z-10 flex justify-center py-32" role="status">
        <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin text-signal-400" />
      </div>

      <div v-else class="relative z-10 mx-auto max-w-260 px-6 sm:px-12 pt-14 pb-18">
      <div class="flex flex-wrap items-end justify-between gap-8 mb-7">
        <div>
          <div class="eyebrow">YOUR ROOMS</div>
          <h1 class="mt-3 text-[34px] font-semibold tracking-[-.03em]">My meetings</h1>
        </div>
        <NuxtLink to="/" class="btn-signal rounded-xl px-5 py-3.25 text-[15px]">
          <UIcon name="i-lucide-plus" class="text-base" />New meeting
        </NuxtLink>
      </div>

      <div v-if="loadingRooms" class="py-14 text-center text-muted" role="status">Loading meetings…</div>

      <div v-else-if="!rooms.length" class="rounded-xl border border-dashed border-white/12 bg-panel p-12 text-center">
        <p class="text-dim">Meetings you create while signed in appear here.</p>
        <NuxtLink to="/" class="btn-signal mt-5 rounded-xl px-5 py-3 text-[15px]">Create a meeting</NuxtLink>
      </div>

      <div v-else class="rounded-xl border border-white/8 bg-panel overflow-hidden">
        <div
          class="hidden lg:grid grid-cols-[1fr_150px_160px_150px_210px] gap-4 px-6 py-3.25 border-b border-white/7 bg-sunk label-mono">
          <span>ROOM CODE</span><span>CREATED</span><span>MEETING PASSWORD</span><span>ACCESS</span><span />
        </div>

        <div v-for="room in active" :key="room.room_id"
          class="flex flex-wrap items-center gap-4 lg:grid lg:grid-cols-[1fr_150px_160px_150px_210px] px-6 py-4.5 border-b border-white/5 hover:bg-lift transition-colors">
          <span class="font-mono text-[15px] tracking-[.06em] text-ink">{{ room.room_id }}</span>
          <span class="font-mono text-xs text-faint">{{ date(room.created_at) }}</span>
          <button type="button" :aria-label="`Copy meeting password for ${room.room_id}`"
            class="justify-self-start flex items-center gap-2 rounded-lg border border-white/9 bg-well px-2.5 py-1.5 font-mono text-[13px] tracking-[.06em] text-dim hover:border-signal-500/50 cursor-pointer"
            @click="copy(room.room_password, 'Meeting password')">
            {{ room.room_password }}
            <UIcon name="i-lucide-copy" class="text-xs" />
          </button>
          <span class="justify-self-start rounded-md border px-2 py-1 font-mono text-[10px] tracking-[.1em]"
            :class="room.status === 'private'
              ? 'border-warn/35 bg-warn/10 text-warn'
              : 'border-online/35 bg-online/10 text-online'">
            {{ room.status === 'private' ? 'LOBBY ON' : 'OPEN' }}
          </span>
          <div class="justify-self-end flex gap-2">
            <button type="button" class="btn-ghost rounded-lg px-3.5 py-2.25 text-sm"
              @click="copy(roomLink(room.room_id), 'Invite link')">Invite</button>
            <button type="button" class="btn-soft rounded-lg px-4 py-2.25 text-sm font-medium"
              :disabled="rejoining === room.room_id" @click="rejoin(room.room_id)">
              <UIcon v-if="rejoining === room.room_id" name="i-lucide-loader-circle" class="text-sm animate-spin" />
              Rejoin
            </button>
          </div>
        </div>

        <details v-if="ended.length" class="group">
          <summary
            class="cursor-pointer list-none px-6 py-3.75 bg-sunk font-mono text-[11px] tracking-[.12em] text-faint hover:text-ink">
            <span class="group-open:hidden">+</span><span class="hidden group-open:inline">−</span>
            ENDED MEETINGS ({{ ended.length }})
          </summary>
          <div v-for="room in ended" :key="room.room_id"
            class="flex justify-between px-6 py-2.5 border-t border-white/5 font-mono text-xs text-faint">
            <span>{{ room.room_id }}</span><span>{{ date(room.created_at) }}</span>
          </div>
        </details>
      </div>

      <div class="mt-12 grid gap-6 md:grid-cols-2">
        <section class="rounded-xl border border-white/8 bg-panel p-7">
          <div class="eyebrow">PROFILE</div>
          <UForm :state="profile" class="mt-5.5 flex flex-col gap-3.75" @submit="saveProfile">
            <div>
              <label class="label-mono mb-1.75">EMAIL</label>
              <input :value="auth.user.value.email" disabled class="field">
            </div>
            <UFormField name="displayName" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
              <label for="displayName" class="label-mono mb-1.75">DISPLAY NAME</label>
              <input id="displayName" v-model="profile.displayName" maxlength="64" class="field">
            </UFormField>
            <button type="submit" class="btn-ghost self-start rounded-lg px-4.5 py-2.75 text-sm"
              :disabled="savingProfile || !profile.displayName.trim() || profile.displayName.trim() === auth.user.value.display_name">
              <UIcon v-if="savingProfile" name="i-lucide-loader-circle" class="text-sm animate-spin" />Save name
            </button>
          </UForm>
        </section>

        <section class="rounded-xl border border-white/8 bg-panel p-7">
          <div class="eyebrow">PASSWORD</div>
          <UForm :schema="passwordSchema" :state="passwords" class="mt-5.5 flex flex-col gap-3.75"
            @submit="savePassword">
            <UFormField name="current" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
              <label for="current" class="label-mono mb-1.75">CURRENT</label>
              <input id="current" v-model="passwords.current" type="password" autocomplete="current-password"
                class="field">
            </UFormField>
            <UFormField name="next" :ui="{ error: 'mt-2 text-[13px] text-danger-soft' }">
              <label for="next" class="label-mono mb-1.75">NEW</label>
              <input id="next" v-model="passwords.next" type="password" autocomplete="new-password" class="field">
              <p class="mt-2 text-[13px] text-faint">At least 8 characters. Signs out your other devices.</p>
            </UFormField>
            <button type="submit" class="btn-soft self-start rounded-lg px-4.5 py-2.75 text-sm font-medium"
              :disabled="savingPassword">
              <UIcon v-if="savingPassword" name="i-lucide-loader-circle" class="text-sm animate-spin" />Change password
            </button>
          </UForm>
        </section>
      </div>
      </div>
    </ClientOnly>
  </div>
</template>
