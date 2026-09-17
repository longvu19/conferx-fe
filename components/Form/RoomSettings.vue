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
</script>
<template>
  <UForm id="room-settings-form" :schema="schema" :state="state" @submit="emit('submit', state)">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField label="Your name" name="name" required class="w-full">
        <UInput v-model="state.name" color="primary" variant="soft" placeholder="How others will see you"
          autocomplete="name" class="w-full" />
      </UFormField>
      <UFormField :label="creating ? 'Admin password' : 'Meeting password'" name="password" required class="w-full"
        :ui="{ hint: 'flex items-center' }">
        <UInput v-model="state.password" type="password" color="primary" variant="soft"
          :placeholder="creating ? 'At least 8 characters' : '8-digit code from the host'"
          :autocomplete="creating ? 'new-password' : 'off'" class="w-full" />
        <template #hint>
          <UTooltip :ui="{ content: 'h-full' }">
            <UButton icon="i-lucide-circle-help" size="md" color="info" variant="link" class="p-0"
              aria-label="About this password" />
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
        </template>
      </UFormField>
    </div>

    <USwitch v-if="creating" v-model="state.requireApproval" class="mt-4" label="Ask me before guests join"
      description="Guests wait until you let them in. Turn off to let anyone with the password in." />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      <UFormField label="Microphone" class="w-full">
        <USelect v-model="prefs.audioInput" icon="i-lucide-mic" color="primary" variant="soft"
          :items="microphones" placeholder="No microphone" class="w-full" :ui="{ content: 'min-w-fit' }" />
      </UFormField>
      <UFormField label="Camera" class="w-full">
        <USelect v-model="prefs.videoInput" icon="i-lucide-video" color="primary" variant="soft"
          :items="cameras" placeholder="No camera" class="w-full" :ui="{ content: 'min-w-fit' }" />
      </UFormField>
      <UFormField label="Speaker" class="w-full">
        <USelect v-model="prefs.audioOutput" icon="i-lucide-volume-2" color="primary" variant="soft"
          :items="speakers" placeholder="System default" class="w-full" :ui="{ content: 'min-w-fit' }" />
      </UFormField>
    </div>
  </UForm>
</template>
