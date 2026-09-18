<script setup lang="ts">
import * as z from 'zod'
import type { DeviceOption } from '~/composables/useDevicePreview'

export interface RoomSettingsState {
  name: string
  password: string
  requireApproval: boolean
}

const props = defineProps<{
  creating: boolean
  microphones: DeviceOption[]
  cameras: DeviceOption[]
  speakers: DeviceOption[]
}>()
const emit = defineEmits<{ submit: [RoomSettingsState] }>()
const state = defineModel<RoomSettingsState>({ required: true })
const prefs = useMediaPreferences()

const schema = computed(() => z.object({
  name: z.string().trim().min(1, 'Enter your name').max(64, 'Use at most 64 characters'),
  password: props.creating
    ? z.string().min(8, 'Use at least 8 characters')
    : z.string().min(1, 'Enter the meeting password'),
  requireApproval: z.boolean()
}))

// Ô chọn thiết bị mượn đúng dáng .field để không lạc khỏi bảng màu.
const selectUi = {
  base: 'w-full rounded-[10px] border border-white/10 bg-well px-3 py-2.75 text-[13px] text-dim data-[state=open]:border-signal-500/55',
  content: 'min-w-fit'
}
const errorUi = { error: 'mt-2 text-[13px] text-danger-soft' }
</script>
<template>
  <UForm id="room-settings-form" :schema="schema" :state="state" @submit="emit('submit', state)">
    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <UFormField name="name" required :ui="errorUi">
        <label for="rs-name" class="label-mono mb-1.75">YOUR NAME</label>
        <input id="rs-name" v-model="state.name" autocomplete="name" placeholder="How others will see you"
          class="field">
      </UFormField>

      <UFormField name="password" required :ui="errorUi">
        <div class="mb-1.75 flex items-center justify-between">
          <label for="rs-password" class="label-mono">{{ creating ? 'ADMIN PASSWORD' : 'MEETING PASSWORD' }}</label>
          <UTooltip :ui="{ content: 'h-full' }">
            <button type="button" aria-label="About this password"
              class="flex cursor-pointer items-center text-muted hover:text-signal-300">
              <UIcon name="i-lucide-circle-help" class="text-sm" />
            </button>
            <template #content>
              <p v-if="creating">
                Keep this to yourself. Join with it from any device to get admin controls.<br>
                Guests use a separate meeting password shown after you create the room.
              </p>
              <p v-else>
                Enter the meeting password from the host.<br>Hosts can enter their admin password instead.
              </p>
            </template>
          </UTooltip>
        </div>
        <input id="rs-password" v-model="state.password" type="password"
          :placeholder="creating ? 'At least 8 characters' : '8-digit code from the host'"
          :autocomplete="creating ? 'new-password' : 'off'"
          class="field font-mono tracking-[.14em] placeholder:font-sans placeholder:tracking-normal">
      </UFormField>
    </div>

    <label v-if="creating"
      class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/7 bg-[#080c12] p-4">
      <span class="relative mt-0.25 h-5.5 w-9.5 flex-none rounded-full transition-colors"
        :class="state.requireApproval ? 'bg-signal-500/90' : 'bg-white/12'">
        <span class="absolute top-0.75 h-4 w-4 rounded-full bg-white transition-all"
          :class="state.requireApproval ? 'left-4.75' : 'left-0.75'" />
      </span>
      <span>
        <span class="block text-sm font-semibold text-ink">Ask me before guests join</span>
        <span class="mt-0.75 block text-[13px] leading-[1.55] text-muted">
          Guests wait until you let them in. Turn off to let anyone with the password in.
        </span>
      </span>
      <input v-model="state.requireApproval" type="checkbox" class="sr-only">
    </label>

    <div class="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <div>
        <label class="label-mono mb-1.75">MICROPHONE</label>
        <USelect v-model="prefs.audioInput" :items="microphones" placeholder="No microphone" variant="none"
          :ui="selectUi" />
      </div>
      <div>
        <label class="label-mono mb-1.75">CAMERA</label>
        <USelect v-model="prefs.videoInput" :items="cameras" placeholder="No camera" variant="none" :ui="selectUi" />
      </div>
      <div>
        <label class="label-mono mb-1.75">SPEAKER</label>
        <USelect v-model="prefs.audioOutput" :items="speakers" placeholder="System default" variant="none"
          :ui="selectUi" />
      </div>
    </div>
  </UForm>
</template>
