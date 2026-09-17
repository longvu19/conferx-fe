<script setup lang="ts">
import { ConnectionState } from 'livekit-client'
import type { MeResponse, ParticipantInfo } from '~/types/room'
import type { DeviceOption } from '~/composables/useDevicePreview'

definePageMeta({ layout: false })

type Phase = 'loading' | 'waiting' | 'connecting' | 'live' | 'ended' | 'removed' | 'left' | 'lost' | 'error'
type Panel = 'chat' | 'people' | null

const route = useRoute()
const router = useRouter()
const toast = useToast()
const api = useRoomApi()
const auth = useAuth()
const prefs = useMediaPreferences()
const conf = useConference()
const wb = useWhiteboard()

const roomId = computed(() => String(route.params.id))
useHead({ title: () => `${roomId.value} – ConferX` })

const phase = ref<Phase>('loading')
const errorMessage = ref('')
const me = ref<MeResponse | null>(null)
const participants = ref<ParticipantInfo[]>([])
const panel = ref<Panel>(null)
const inviteOpen = ref(false)
const confirmEndOpen = ref(false)
const lastReadCount = ref(0)
const microphones = ref<DeviceOption[]>([])
const cameras = ref<DeviceOption[]>([])
const micMenuOpen = ref(false)
const camMenuOpen = ref(false)
const whiteboardOpen = ref(false)

const toggleWhiteboard = () => {
  whiteboardOpen.value = !whiteboardOpen.value
}

const submitDoodle = (dataUrl: string) => conf.setDoodle(dataUrl)

// ---------- hand-raise toast queue ----------
// Caps concurrently visible "raised their hand" toasts so a room full of people
// raising hands at once queues up instead of flooding the screen.
const MAX_HAND_TOASTS = 3
const HAND_TOAST_DURATION = 4000
const handToastQueue = ref<string[]>([])
const activeHandToasts = ref(0)

const showNextHandToast = () => {
  if (activeHandToasts.value >= MAX_HAND_TOASTS || !handToastQueue.value.length) return
  const name = handToastQueue.value[0]!
  handToastQueue.value = handToastQueue.value.slice(1)
  activeHandToasts.value++
  toast.add({ title: `${name} raised their hand`, icon: 'i-lucide-hand', duration: HAND_TOAST_DURATION })
  setTimeout(() => {
    activeHandToasts.value--
    showNextHandToast()
  }, HAND_TOAST_DURATION)
}

// Server-assigned id (u_<account> or g_<guest>) for this meeting.
const selfId = computed(() => me.value?.participant.user_id ?? '')
const isAdmin = computed(() => me.value?.participant.role === 'admin')
const requireApproval = computed(() => me.value?.room.status === 'private')
const pendingCount = computed(() => participants.value.filter(p => p.status === 'pending').length)
const unread = computed(() => (panel.value === 'chat' ? 0 : conf.messages.value.length - lastReadCount.value))
const onlineIds = computed(() => new Set(conf.tiles.value.map(t => t.identity)))
const reconnecting = computed(() => conf.connection.value === ConnectionState.Reconnecting)

// ---------- layout ----------
const screenTile = computed(() => conf.tiles.value.find(t => t.isScreen))
const cameraTiles = computed(() => conf.tiles.value.filter(t => !t.isScreen))
const stage = useTemplateRef<HTMLElement>('stage')
const stageSize = reactive({ width: 0, height: 0 })
let stageObserver: ResizeObserver | undefined
watch(stage, (el) => {
  stageObserver?.disconnect()
  if (!el) return
  stageObserver = new ResizeObserver(([entry]) => {
    stageSize.width = entry!.contentRect.width
    stageSize.height = entry!.contentRect.height
  })
  stageObserver.observe(el)
})

// Largest 16:9 tile size that fits every camera tile in the stage.
const GAP = 12
const tileWidth = computed(() => {
  const n = Math.max(cameraTiles.value.length, 1)
  const { width, height } = stageSize
  let best = 0
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const byWidth = (width - GAP * (cols - 1)) / cols
    const byHeight = ((height - GAP * (rows - 1)) / rows) * (16 / 9)
    best = Math.max(best, Math.min(byWidth, byHeight))
  }
  return Math.floor(best)
})

// ---------- polling ----------
let pollTimer: ReturnType<typeof setInterval> | undefined
const stopPolling = () => clearInterval(pollTimer)
const poll = (fn: () => Promise<void>, ms: number) => {
  stopPolling()
  pollTimer = setInterval(() => fn().catch(handleSessionError), ms)
}

const goToJoin = async () => {
  await navigateTo({ path: '/', query: { join: roomId.value } })
}

const handleSessionError = async (e: unknown) => {
  // `.name` check, not `instanceof`: Nuxt DevTools wraps auto-imported classes for
  // metrics in dev, which breaks `instanceof SessionExpiredError` against that binding.
  if ((e as Error)?.name === 'SessionExpiredError' || [403, 404].includes(apiStatus(e) ?? 0)) {
    api.clearToken(roomId.value)
    stopPolling()
    if (phase.value === 'live') return // LiveKit will report the disconnect reason
    await goToJoin()
    return
  }
  if (apiStatus(e) === 410) {
    phase.value = 'ended'
    stopPolling()
  }
}

// ---------- devices ----------
const refreshDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [])
  const toOptions = (kind: MediaDeviceKind, fallback: string) =>
    devices.filter(d => d.kind === kind && d.deviceId).map((d, i) => ({ value: d.deviceId, label: d.label || `${fallback} ${i + 1}` }))
  microphones.value = toOptions('audioinput', 'Microphone')
  cameras.value = toOptions('videoinput', 'Camera')
}

const selectMic = (deviceId: string) => {
  prefs.value.audioInput = deviceId
  conf.switchDevice('audioinput', deviceId)
}
const selectCam = (deviceId: string) => {
  prefs.value.videoInput = deviceId
  conf.switchDevice('videoinput', deviceId)
}

const micItems = computed(() => microphones.value.map(d => ({
  label: d.label,
  icon: d.value === prefs.value.audioInput ? 'i-lucide-check' : undefined,
  onSelect: () => selectMic(d.value)
})))
const camItems = computed(() => cameras.value.map(d => ({
  label: d.label,
  icon: d.value === prefs.value.videoInput ? 'i-lucide-check' : undefined,
  onSelect: () => selectCam(d.value)
})))

// ---------- flow ----------
const checkMembership = async () => {
  const data = await api.getMe(roomId.value)
  me.value = data
  if (data.room.status === 'closed') {
    phase.value = 'ended'
    return
  }
  if (data.participant.status === 'rejected') {
    phase.value = 'removed'
    return
  }
  if (data.participant.status === 'pending') {
    if (phase.value !== 'waiting') {
      phase.value = 'waiting'
      poll(checkMembership, 3000)
    }
    return
  }
  if (phase.value === 'loading' || phase.value === 'waiting') await enterMeeting()
}

const refreshParticipants = async () => {
  const before = pendingCount.value
  participants.value = await api.getParticipants(roomId.value)
  if (isAdmin.value && pendingCount.value > before && panel.value !== 'people') {
    toast.add({
      title: 'Someone wants to join',
      icon: 'i-lucide-user-plus',
      actions: [{ label: 'Review', onClick: () => { panel.value = 'people' } }]
    })
  }
}

const enterMeeting = async () => {
  stopPolling()
  phase.value = 'connecting'
  try {
    const { token, url } = await api.getMediaToken(roomId.value)
    await conf.connect(url, token, prefs.value)
    phase.value = 'live'
    await refreshParticipants()
    await refreshDevices()
    poll(refreshParticipants, 4000)
    if (route.query.invite) {
      inviteOpen.value = true
      router.replace({ query: {} })
    }
  } catch (e) {
    await handleSessionError(e)
    if (phase.value === 'connecting') {
      phase.value = 'error'
      errorMessage.value = apiStatus(e) ? apiErrorMessage(e) : 'Could not connect to the media server. Check your network and try again.'
    }
  }
}

const start = async () => {
  phase.value = 'loading'
  try {
    if (!api.getToken(roomId.value)) {
      try {
        await api.refresh(roomId.value)
      } catch (e) {
        // The account that created the room can walk back in without a password.
        if (!auth.ready.value) await auth.refresh()
        if (!auth.user.value) throw e
        await api.joinRoom(roomId.value, {}).catch(() => { throw e })
      }
    }
    await checkMembership()
  } catch (e) {
    await handleSessionError(e)
    if (phase.value === 'loading') {
      phase.value = 'error'
      errorMessage.value = apiErrorMessage(e)
    }
  }
}

onMounted(() => {
  start()
  navigator.mediaDevices?.addEventListener('devicechange', refreshDevices)
})
onBeforeUnmount(() => {
  stopPolling()
  stageObserver?.disconnect()
  navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices)
})

watch(conf.endReason, (reason) => {
  if (!reason || reason === 'left') return
  stopPolling()
  if (reason !== 'lost') api.clearToken(roomId.value)
  phase.value = reason
})

watch(conf.deviceError, (message) => {
  if (message) toast.add({ title: message, color: 'error', icon: 'i-lucide-triangle-alert' })
})

watch(() => conf.handRaisedEvent.value, (e) => {
  if (!e) return
  handToastQueue.value = [...handToastQueue.value, e.name]
  showNextHandToast()
})

watch(panel, (value) => {
  if (value === 'chat') lastReadCount.value = conf.messages.value.length
})
watch(() => conf.messages.value.length, (n) => {
  if (panel.value === 'chat') lastReadCount.value = n
})

// ---------- actions ----------
const togglePanel = (value: Exclude<Panel, null>) => {
  panel.value = panel.value === value ? null : value
}

const run = async (action: () => Promise<unknown>, failure: string) => {
  try {
    await action()
  } catch (e) {
    toast.add({ title: failure, description: apiErrorMessage(e), color: 'error' })
  }
}

const approve = (uid: string) => run(async () => {
  await api.setParticipantStatus(roomId.value, uid, 'approved')
  await refreshParticipants()
}, 'Could not let them in')

const reject = (uid: string) => run(async () => {
  await api.setParticipantStatus(roomId.value, uid, 'rejected')
  await refreshParticipants()
}, 'Could not deny the request')

const remove = (uid: string) => run(async () => {
  await api.removeParticipant(roomId.value, uid)
  await refreshParticipants()
}, 'Could not remove participant')

const setRequireApproval = (value: boolean) => run(async () => {
  await api.setRoomStatus(roomId.value, value ? 'private' : 'open')
  if (me.value) me.value.room.status = value ? 'private' : 'open'
}, 'Could not change the setting')

const leave = async () => {
  stopPolling()
  await conf.disconnect()
  await api.removeParticipant(roomId.value, selfId.value).catch(() => {})
  api.clearToken(roomId.value)
  phase.value = 'left'
}

const cancelWaiting = async () => {
  await leave()
  await navigateTo('/')
}

const endForAll = () => run(async () => {
  confirmEndOpen.value = false
  stopPolling()
  await api.endRoom(roomId.value)
  await conf.disconnect()
  api.clearToken(roomId.value)
  phase.value = 'ended'
}, 'Could not end the meeting')

const endScreens: Partial<Record<Phase, { title: string, body: string, icon: string }>> = {
  ended: { title: 'This meeting has ended', body: 'The host ended the meeting for everyone.', icon: 'i-lucide-phone-off' },
  removed: { title: 'You were removed from the meeting', body: 'Ask the host if you think this was a mistake.', icon: 'i-lucide-user-x' },
  left: { title: 'You left the meeting', body: 'You can rejoin with the meeting password.', icon: 'i-lucide-log-out' },
  lost: { title: 'Connection lost', body: 'Check your internet connection, then rejoin.', icon: 'i-lucide-wifi-off' },
  error: { title: 'Could not open the meeting', body: '', icon: 'i-lucide-triangle-alert' }
}
</script>

<template>
  <div class="h-dvh flex flex-col text-white overflow-hidden">
    <!-- Loading / waiting / end states -->
    <div v-if="phase !== 'live'" class="flex-1 flex items-center justify-center p-6">
      <div v-if="phase === 'loading' || phase === 'connecting'" class="text-center" role="status">
        <UIcon name="i-lucide-loader-circle" class="text-4xl animate-spin text-blue-400" />
        <p class="mt-3 text-gray-300">{{ phase === 'loading' ? 'Opening meeting…' : 'Connecting to the meeting…' }}</p>
      </div>

      <div v-else-if="phase === 'waiting'" class="max-w-sm text-center" role="status">
        <UIcon name="i-lucide-hourglass" class="text-4xl text-amber-300" />
        <h1 class="mt-4 text-2xl font-semibold">Waiting for the host</h1>
        <p class="mt-2 text-gray-300">You'll join automatically when the host lets you in to <strong>{{ roomId }}</strong>.</p>
        <UButton class="mt-6" color="neutral" variant="outline" label="Cancel" @click="cancelWaiting" />
      </div>

      <div v-else-if="endScreens[phase]" class="max-w-sm text-center">
        <UIcon :name="endScreens[phase]!.icon" class="text-4xl text-gray-300" />
        <h1 class="mt-4 text-2xl font-semibold">{{ endScreens[phase]!.title }}</h1>
        <p class="mt-2 text-gray-300">{{ phase === 'error' ? errorMessage : endScreens[phase]!.body }}</p>
        <div class="mt-6 flex justify-center gap-3">
          <UButton to="/" color="neutral" variant="outline" label="Back to home" />
          <UButton v-if="phase === 'left'" label="Rejoin" @click="goToJoin" />
          <UButton v-if="phase === 'lost' || phase === 'error'" label="Try again" @click="start" />
        </div>
      </div>
    </div>

    <!-- Live meeting -->
    <template v-else>
      <header class="flex items-center gap-3 px-4 py-2 border-b border-gray-700/50">
        <NuxtLink to="/" class="shrink-0" aria-label="ConferX home"><img src="/conferx-logo.svg" alt="" class="h-7"></NuxtLink>
        <span class="text-sm text-gray-300 truncate">{{ roomId }}</span>
        <UBadge v-if="reconnecting" color="warning" variant="subtle" label="Reconnecting…" />
        <UButton class="ml-auto" size="sm" color="neutral" variant="ghost" icon="i-lucide-user-plus" label="Invite"
          @click="inviteOpen = true" />
      </header>

      <div v-if="!conf.canPlayAudio.value" class="bg-amber-500/15 text-amber-200 text-sm px-4 py-2 flex items-center gap-3">
        <span>Your browser blocked meeting audio.</span>
        <UButton size="xs" color="warning" label="Turn on sound" @click="conf.startAudio()" />
      </div>

      <div class="flex-1 min-h-0 flex relative">
        <main class="flex-1 min-w-0 p-3">
          <div v-if="screenTile" class="h-full flex flex-col lg:flex-row gap-3">
            <div class="flex-1 min-h-0 min-w-0">
              <RoomVideoTile :tile="screenTile" />
            </div>
            <div class="flex lg:flex-col gap-3 overflow-auto lg:w-56 h-28 lg:h-auto shrink-0">
              <div v-for="tile in cameraTiles" :key="tile.key" class="aspect-video w-44 lg:w-full shrink-0">
                <RoomVideoTile :tile="tile" compact @clear-doodle="submitDoodle('')" />
              </div>
            </div>
          </div>
          <RoomWhiteboard v-else-if="whiteboardOpen" class="h-full" :strokes="wb.strokes.value"
            :active="wb.active.value" :can-undo="wb.canUndo.value" :start-stroke="wb.startStroke"
            :add-point="wb.addPoint" :end-stroke="wb.endStroke" :undo="wb.undo" :clear="wb.clear"
            @close="whiteboardOpen = false" @submit="submitDoodle" />
          <div v-else ref="stage" class="h-full flex flex-wrap items-center justify-center content-center gap-3">
            <div v-for="tile in cameraTiles" :key="tile.key" class="aspect-video" :style="{ width: `${tileWidth}px` }">
              <RoomVideoTile :tile="tile" :compact="tileWidth < 360" @clear-doodle="submitDoodle('')" />
            </div>
          </div>
        </main>

        <aside v-if="panel"
          class="absolute inset-0 z-10 sm:static sm:w-80 flex flex-col bg-[#141926] sm:bg-black/30 sm:border-l border-gray-700/50">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
            <h2 class="font-medium">{{ panel === 'chat' ? 'Chat' : 'People' }}</h2>
            <UButton icon="i-lucide-x" size="sm" color="neutral" variant="ghost" aria-label="Close panel" @click="panel = null" />
          </div>
          <RoomChatPanel v-if="panel === 'chat'" class="flex-1 min-h-0" :messages="conf.messages.value"
            @send="conf.sendMessage" />
          <RoomPeoplePanel v-else class="flex-1 min-h-0" :participants="participants" :online-ids="onlineIds"
            :self-id="selfId" :is-admin="isAdmin" :require-approval="requireApproval" @approve="approve" @reject="reject"
            @remove="remove" @update:require-approval="setRequireApproval" />
        </aside>
      </div>

      <footer class="flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 border-t border-gray-700/50">
        <div class="relative group">
          <UButton :icon="conf.micOn.value ? 'i-lucide-mic' : 'i-lucide-mic-off'" size="xl" class="rounded-full"
            :color="conf.micOn.value ? 'neutral' : 'error'" :variant="conf.micOn.value ? 'soft' : 'solid'"
            :aria-label="conf.micOn.value ? 'Mute microphone' : 'Unmute microphone'" @click="conf.toggleMic()" />
          <UDropdownMenu v-if="microphones.length > 1" v-model:open="micMenuOpen" :items="micItems"
            :content="{ side: 'top', align: 'center', sideOffset: 12 }">
            <UButton icon="i-lucide-chevron-up" size="xs" color="neutral" variant="solid"
              class="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full p-1 opacity-0 scale-75 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto ring-2 ring-[#141926]"
              :class="micMenuOpen && 'opacity-100 scale-100 pointer-events-auto'" aria-label="Choose microphone" />
          </UDropdownMenu>
        </div>
        <div class="relative group">
          <UButton :icon="conf.camOn.value ? 'i-lucide-video' : 'i-lucide-video-off'" size="xl" class="rounded-full"
            :color="conf.camOn.value ? 'neutral' : 'error'" :variant="conf.camOn.value ? 'soft' : 'solid'"
            :aria-label="conf.camOn.value ? 'Turn off camera' : 'Turn on camera'" @click="conf.toggleCamera()" />
          <UDropdownMenu v-if="cameras.length > 1" v-model:open="camMenuOpen" :items="camItems"
            :content="{ side: 'top', align: 'center', sideOffset: 12 }">
            <UButton icon="i-lucide-chevron-up" size="xs" color="neutral" variant="solid"
              class="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full p-1 opacity-0 scale-75 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto ring-2 ring-[#141926]"
              :class="camMenuOpen && 'opacity-100 scale-100 pointer-events-auto'" aria-label="Choose camera" />
          </UDropdownMenu>
        </div>
        <UButton icon="i-lucide-monitor-up" size="xl" class="rounded-full hidden sm:inline-flex"
          :color="conf.screenOn.value ? 'primary' : 'neutral'" :variant="conf.screenOn.value ? 'solid' : 'soft'"
          :aria-label="conf.screenOn.value ? 'Stop presenting' : 'Present screen'" @click="conf.toggleScreenShare()" />
        <UButton icon="i-lucide-hand" size="xl" class="rounded-full"
          :color="conf.handRaised.value ? 'warning' : 'neutral'" :variant="conf.handRaised.value ? 'solid' : 'soft'"
          :aria-label="conf.handRaised.value ? 'Lower hand' : 'Raise hand'" @click="conf.toggleHand()" />
        <UButton icon="i-lucide-pencil" size="xl" class="rounded-full hidden sm:inline-flex"
          :color="whiteboardOpen ? 'primary' : 'neutral'" :variant="whiteboardOpen ? 'solid' : 'soft'"
          :aria-label="whiteboardOpen ? 'Close whiteboard' : 'Open whiteboard'" @click="toggleWhiteboard()" />

        <div class="w-px h-8 bg-gray-700 mx-1" />

        <UChip :show="unread > 0" :text="unread" size="3xl" color="primary">
          <UButton icon="i-lucide-message-square" size="xl" class="rounded-full"
            :color="panel === 'chat' ? 'primary' : 'neutral'" variant="soft" aria-label="Chat" @click="togglePanel('chat')" />
        </UChip>
        <UChip :show="isAdmin && pendingCount > 0" :text="pendingCount" size="3xl" color="warning">
          <UButton icon="i-lucide-users" size="xl" class="rounded-full"
            :color="panel === 'people' ? 'primary' : 'neutral'" variant="soft" aria-label="People" @click="togglePanel('people')" />
        </UChip>

        <div class="w-px h-8 bg-gray-700 mx-1" />

        <UButton icon="i-lucide-phone-off" size="xl" color="error" label="Leave" class="rounded-full" @click="leave" />
        <UButton v-if="isAdmin" size="xl" color="error" variant="outline" label="End for all" class="rounded-full hidden sm:inline-flex"
          @click="confirmEndOpen = true" />
      </footer>

      <RoomInviteDialog v-model:open="inviteOpen" :room-id="roomId" :password="me?.room.room_password" />

      <UModal v-model:open="confirmEndOpen" title="End the meeting for everyone?"
        description="Everyone will be disconnected and the meeting can't be restarted.">
        <template #footer>
          <div class="flex justify-end gap-3 w-full">
            <UButton label="Cancel" color="neutral" variant="outline" @click="confirmEndOpen = false" />
            <UButton label="End meeting" color="error" @click="endForAll" />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
