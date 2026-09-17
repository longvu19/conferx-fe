<script setup lang="ts">
import type { RoomSettingsState } from './Form/RoomSettings.vue'

const open = defineModel<boolean>('open')
const props = defineProps<{ roomCode: string | null }>()

const toast = useToast()
const api = useRoomApi()
const { displayName, rememberName } = useIdentity()
const { user } = useAuth()
const { prefs, stream, error, microphones, cameras, speakers, start, stop } = useDevicePreview()

const webcamVideo = useTemplateRef<HTMLVideoElement>('webcamVideo')
const submitting = ref(false)
const form = ref<RoomSettingsState>({ name: '', password: '', requireApproval: true })

const creating = computed(() => !props.roomCode)
const title = computed(() => (creating.value ? 'Create a meeting' : `Join ${props.roomCode}`))
const hasVideo = computed(() => prefs.value.camEnabled && !!stream.value?.getVideoTracks().length)

watch([stream, webcamVideo], ([s, el]) => {
  if (el) el.srcObject = s
})

// Reset as soon as the dialog opens (not after the transition) so fast typing isn't wiped.
watch(open, (isOpen) => {
  if (isOpen) form.value = { name: user.value?.display_name || displayName.value, password: '', requireApproval: true }
}, { immediate: true })

const submit = async (state: RoomSettingsState) => {
  submitting.value = true
  try {
    rememberName(state.name.trim())
    let roomId: string
    if (creating.value) {
      const res = await api.createRoom({ name: state.name.trim(), adminPassword: state.password, requireApproval: state.requireApproval })
      roomId = res.room_id
    } else {
      roomId = props.roomCode!
      await api.joinRoom(roomId, { name: state.name.trim(), password: state.password })
    }
    stop()
    open.value = false
    await navigateTo({ path: `/room/${roomId}`, query: creating.value ? { invite: '1' } : undefined })
  } catch (e) {
    toast.add({
      title: creating.value ? 'Could not create the meeting' : 'Could not join the meeting',
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <UModal v-model:open="open" :title="title" :ui="{ footer: 'justify-between' }" class="w-[640px] max-w-full"
    @after:enter="start" @after:leave="stop">
    <template #description>
      <span class="sr-only">Check your camera and microphone, then {{ creating ? 'create' : 'join' }} the meeting.</span>
    </template>
    <template #body>
      <div class="mb-6">
        <div class="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          <video ref="webcamVideo" autoplay playsinline muted
            class="w-full h-full object-cover absolute inset-0 -scale-x-100 transition-opacity"
            :class="hasVideo ? 'opacity-100' : 'opacity-0'" />
          <div v-if="!hasVideo" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <UIcon class="text-3xl text-white" name="i-lucide-user-round" />
            </div>
            <p class="text-sm" :class="error ? 'text-red-300' : 'text-gray-400'">
              {{ error ?? (prefs.camEnabled ? 'Starting camera…' : 'Camera is off') }}
            </p>
          </div>

          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <UButton :icon="prefs.micEnabled ? 'i-lucide-mic' : 'i-lucide-mic-off'" size="lg"
              :color="prefs.micEnabled ? 'neutral' : 'error'" variant="solid" class="rounded-full"
              :aria-label="prefs.micEnabled ? 'Turn off microphone' : 'Turn on microphone'"
              @click="prefs.micEnabled = !prefs.micEnabled" />
            <UButton :icon="prefs.camEnabled ? 'i-lucide-video' : 'i-lucide-video-off'" size="lg"
              :color="prefs.camEnabled ? 'neutral' : 'error'" variant="solid" class="rounded-full"
              :aria-label="prefs.camEnabled ? 'Turn off camera' : 'Turn on camera'"
              @click="prefs.camEnabled = !prefs.camEnabled" />
          </div>
        </div>
      </div>
      <FormRoomSettings v-model="form" :creating="creating" :microphones="microphones" :cameras="cameras"
        :speakers="speakers" @submit="submit" />
    </template>
    <template #footer>
      <UButton label="Cancel" size="lg" color="neutral" variant="outline" @click="open = false" />
      <UButton :label="creating ? 'Create meeting' : 'Join meeting'" type="submit" form="room-settings-form" size="lg"
        color="primary" :loading="submitting" />
    </template>
  </UModal>
</template>
