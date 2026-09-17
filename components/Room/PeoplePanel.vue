<script setup lang="ts">
import type { ParticipantInfo } from '~/types/room'

const props = defineProps<{
  participants: ParticipantInfo[]
  onlineIds: Set<string>
  selfId: string
  isAdmin: boolean
  requireApproval: boolean
}>()
const emit = defineEmits<{
  approve: [string]
  reject: [string]
  remove: [string]
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
  <div class="h-full min-h-0 overflow-y-auto px-4 py-3 space-y-5">
    <USwitch v-if="isAdmin" :model-value="requireApproval" label="Ask before guests join"
      @update:model-value="emit('update:requireApproval', $event)" />

    <section v-if="isAdmin && waiting.length">
      <h3 class="text-sm font-medium text-amber-300 mb-2">Waiting to join ({{ waiting.length }})</h3>
      <ul class="space-y-2">
        <li v-for="p in waiting" :key="p.user_id" class="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
          <span class="flex-1 truncate text-sm">{{ p.name }}</span>
          <UButton size="xs" color="primary" label="Let in" @click="emit('approve', p.user_id)" />
          <UButton size="xs" color="neutral" variant="ghost" label="Deny" @click="emit('reject', p.user_id)" />
        </li>
      </ul>
    </section>

    <section>
      <h3 class="text-sm font-medium text-gray-300 mb-2">In the meeting ({{ inMeeting.length }})</h3>
      <ul class="space-y-1">
        <li v-for="p in inMeeting" :key="p.user_id" class="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5">
          <span class="w-2 h-2 rounded-full shrink-0" :class="onlineIds.has(p.user_id) ? 'bg-green-400' : 'bg-gray-600'"
            :title="onlineIds.has(p.user_id) ? 'Connected' : 'Not connected'" />
          <span class="flex-1 truncate text-sm">{{ p.name }}<span v-if="p.user_id === selfId" class="text-gray-400"> (you)</span></span>
          <UBadge v-if="p.role === 'admin'" size="sm" color="secondary" variant="subtle" label="Admin" />
          <UButton v-if="isAdmin && p.user_id !== selfId" size="xs" color="error" variant="ghost" icon="i-lucide-user-x"
            :aria-label="`Remove ${p.name}`" @click="emit('remove', p.user_id)" />
        </li>
      </ul>
    </section>
  </div>
</template>
