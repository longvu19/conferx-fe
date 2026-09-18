<script setup lang="ts">
import type { ParticipantInfo } from '~/types/room'

const props = defineProps<{
  participants: ParticipantInfo[]
  onlineIds: Set<string>
  selfId: string
  isAdmin: boolean
  requireApproval: boolean
  hasDoodles: boolean
}>()
const emit = defineEmits<{
  approve: [string]
  reject: [string]
  remove: [string]
  'clear-doodles': []
  'update:requireApproval': [boolean]
}>()

const waiting = computed(() => props.participants.filter(p => p.status === 'pending'))
const inMeeting = computed(() =>
  props.participants
    .filter(p => p.status === 'approved')
    .sort((a, b) => Number(props.onlineIds.has(b.user_id)) - Number(props.onlineIds.has(a.user_id)))
)
</script>
<template>
  <div class="flex h-full min-h-0 flex-col gap-5.5 overflow-y-auto p-4">
    <label v-if="isAdmin"
      class="flex cursor-pointer items-center gap-3 rounded-[10px] border border-white/7 bg-tile px-3.5 py-3.25">
      <span class="relative h-5 w-9 flex-none rounded-full transition-colors"
        :class="requireApproval ? 'bg-signal-500/90' : 'bg-white/12'">
        <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          :class="requireApproval ? 'left-4.5' : 'left-0.5'" />
      </span>
      <span class="text-sm text-ink">Ask before guests join</span>
      <input type="checkbox" class="sr-only" :checked="requireApproval"
        @change="emit('update:requireApproval', ($event.target as HTMLInputElement).checked)">
    </label>

    <button v-if="isAdmin && hasDoodles" type="button"
      class="btn-danger self-start rounded-lg px-3 py-1.75 text-xs font-medium" @click="emit('clear-doodles')">
      <UIcon name="i-lucide-eraser" class="text-sm" />Clear everyone's drawings
    </button>

    <section v-if="isAdmin && waiting.length">
      <div class="mb-2.5 font-mono text-[10px] tracking-[.14em] text-warn">WAITING TO JOIN · {{ waiting.length }}</div>
      <div class="flex flex-col gap-2">
        <div v-for="p in waiting" :key="p.user_id"
          class="flex items-center gap-2.5 rounded-[10px] border border-warn/30 bg-warn/8 px-3.5 py-3">
          <span class="flex-1 truncate text-sm text-ink">{{ p.name }}</span>
          <button type="button" class="btn-soft rounded-[7px] px-2.75 py-1.5 text-[13px] font-medium"
            @click="emit('approve', p.user_id)">Let in</button>
          <button type="button" class="btn-ghost rounded-[7px] px-2.5 py-1.5 text-[13px]"
            @click="emit('reject', p.user_id)">Deny</button>
        </div>
      </div>
    </section>

    <section>
      <div class="mb-1.5 font-mono text-[10px] tracking-[.14em] text-muted">IN THE MEETING · {{ inMeeting.length }}</div>
      <div class="flex flex-col">
        <div v-for="p in inMeeting" :key="p.user_id"
          class="group flex items-center gap-2.5 border-b border-white/5 px-1 py-2.75 transition-colors hover:bg-white/3">
          <span class="h-1.75 w-1.75 flex-none rounded-full"
            :class="onlineIds.has(p.user_id) ? 'bg-online' : 'bg-[#3f4857]'"
            :title="onlineIds.has(p.user_id) ? 'Connected' : 'Not connected'" />
          <span class="flex-1 truncate text-sm text-ink">
            {{ p.name }}<span v-if="p.user_id === selfId" class="text-muted"> (you)</span>
          </span>
          <span v-if="p.role === 'admin'"
            class="rounded border border-signal-500/35 px-1.25 py-0.5 font-mono text-[10px] tracking-[.1em] text-signal-300">HOST</span>
          <button v-if="isAdmin && p.user_id !== selfId" type="button" :aria-label="`Remove ${p.name}`"
            class="flex h-6.5 w-6.5 flex-none cursor-pointer items-center justify-center rounded text-faint opacity-0 transition-opacity hover:text-danger-soft group-hover:opacity-100 focus-visible:opacity-100"
            @click="emit('remove', p.user_id)">
            <UIcon name="i-lucide-user-x" class="text-sm" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
