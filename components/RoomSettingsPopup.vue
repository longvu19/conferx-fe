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

// Badge độ phân giải đọc thẳng từ track đang chạy — không phải số trang trí.
const videoSpec = computed(() => {
  const settings = stream.value?.getVideoTracks()[0]?.getSettings()
  if (!settings?.height) return null
  const fps = settings.frameRate ? ` · ${Math.round(settings.frameRate)}FPS` : ''
  return `${settings.height}P${fps}`
})

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
  <!-- Khung ngoài của UModal tự vẽ nền/bo góc/shadow riêng (rounded-lg = 8px), KHÔNG
       overflow-hidden nên nó không clip theo bo góc của mình. .card bên trong bo 16px và
       gần như phủ kín khung đó, nhưng ở dải 8–16px quanh mỗi góc, .card đã cong vào còn
       khung ngoài (bo ít hơn) vẫn vuông — nền/shadow của nó lộ ra thành vệt lưỡi liềm ở
       cả 4 góc. Tắt hẳn lớp trang trí của khung ngoài vì .card đã tự lo đủ. -->
  <UModal v-model:open="open" class="w-170 max-w-full bg-transparent rounded-none shadow-none ring-0"
    @after:enter="start" @after:leave="stop">
    <template #content>
      <!-- flex flex-col là bắt buộc, không phải trang trí: khung ngoài của UModal tự co
           .card xuống vừa max-h-[calc(100dvh-2rem)] trên màn thấp (vì .card có overflow-hidden
           nên flexbox coi nó co được xuống dưới cả kích thước nội dung). Nếu .card không tự
           là flex-col, ba khối header/body/footer bên trong vẫn xếp theo chiều cao tự nhiên và
           phần vượt ra bị .card cắt luôn — mất trắng footer, có khi cụt ngay sau header. -->
      <div class="card flex max-h-full flex-col overflow-hidden">
        <div class="flex shrink-0 items-center justify-between border-b border-white/7 px-6 py-5">
          <div>
            <div class="eyebrow">{{ creating ? 'NEW SESSION' : 'JOIN SESSION' }}</div>
            <h2 class="mt-1.5 text-[19px] font-semibold">Check your camera and mic</h2>
            <span class="sr-only">{{ title }}</span>
          </div>
          <button type="button" aria-label="Close"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/8 text-muted transition-colors hover:text-ink"
            @click="open = false">
            <UIcon name="i-lucide-x" class="text-[15px]" />
          </button>
        </div>

        <!-- flex-1 min-h-0: chiếm đúng phần còn lại sau khi header/footer đã lấy chỗ (shrink-0),
             rồi tự cuộn — thay cho max-h-[70dvh] cũ vốn không biết header/footer ăn hết bao
             nhiêu, nên trên màn thấp cả ba cộng lại vẫn tràn ra ngoài .card. -->
        <div class="min-h-0 flex-1 overflow-y-auto p-6">
          <div
            class="relative aspect-video overflow-hidden rounded-[14px] bg-[linear-gradient(140deg,#131a26,#0a0e15)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]">
            <video ref="webcamVideo" autoplay playsinline muted
              class="absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity"
              :class="hasVideo ? 'opacity-100' : 'opacity-0'" />

            <!-- Vân chéo chỉ để lấp khung khi chưa có hình. Khi camera đã lên thì bỏ đi,
                 không phủ lên mặt người dùng. -->
            <div v-if="!hasVideo"
              class="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,.03)_0_2px,transparent_2px_10px)]" />

            <div v-if="videoSpec && hasVideo" class="absolute left-3.5 top-3.5 flex gap-2">
              <span
                class="rounded-md border border-signal-500/30 bg-[rgba(4,6,10,.7)] px-2 py-1 font-mono text-[10px] tracking-[.1em] text-signal-300">{{ videoSpec }}</span>
            </div>

            <div v-if="!hasVideo"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-6 text-center">
              <div
                class="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-lift text-signal-300">
                <UIcon class="text-3xl" name="i-lucide-user-round" />
              </div>
              <p class="font-mono text-[11px] tracking-[.1em]" :class="error ? 'text-danger-soft' : 'text-muted'">
                {{ error ?? (prefs.camEnabled ? 'STARTING CAMERA…' : 'CAMERA IS OFF') }}
              </p>
            </div>

            <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2.5">
              <button type="button" :aria-label="prefs.micEnabled ? 'Turn off microphone' : 'Turn on microphone'"
                class="flex h-10.5 w-10.5 cursor-pointer items-center justify-center rounded-full border transition-colors"
                :class="prefs.micEnabled
                  ? 'border-white/12 bg-[rgba(10,14,20,.85)] text-ink hover:bg-[rgba(10,14,20,.95)]'
                  : 'border-danger/50 bg-danger/16 text-danger-soft'"
                @click="prefs.micEnabled = !prefs.micEnabled">
                <UIcon :name="prefs.micEnabled ? 'i-lucide-mic' : 'i-lucide-mic-off'" class="text-lg" />
              </button>
              <button type="button" :aria-label="prefs.camEnabled ? 'Turn off camera' : 'Turn on camera'"
                class="flex h-10.5 w-10.5 cursor-pointer items-center justify-center rounded-full border transition-colors"
                :class="prefs.camEnabled
                  ? 'border-white/12 bg-[rgba(10,14,20,.85)] text-ink hover:bg-[rgba(10,14,20,.95)]'
                  : 'border-danger/50 bg-danger/16 text-danger-soft'"
                @click="prefs.camEnabled = !prefs.camEnabled">
                <UIcon :name="prefs.camEnabled ? 'i-lucide-video' : 'i-lucide-video-off'" class="text-lg" />
              </button>
            </div>
          </div>

          <FormRoomSettings v-model="form" class="mt-5.5" :creating="creating" :microphones="microphones"
            :cameras="cameras" :speakers="speakers" @submit="submit" />
        </div>

        <div class="flex shrink-0 items-center justify-between border-t border-white/7 bg-sunk px-6 py-4.5">
          <button type="button" class="btn-ghost rounded-[10px] px-4.5 py-3 text-[15px]" @click="open = false">Cancel</button>
          <button type="submit" form="room-settings-form" :disabled="submitting"
            class="btn-signal rounded-[10px] px-5.5 py-3 text-[15px]">
            <UIcon v-if="submitting" name="i-lucide-loader-circle" class="text-base animate-spin" />
            {{ creating ? 'Create meeting' : 'Join meeting' }}
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
