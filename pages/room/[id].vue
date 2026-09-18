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
const hasDoodles = computed(() => conf.tiles.value.some(t => t.doodle && !t.isScreen))
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

// ---------- chrome của phòng, theo hướng "Signal" ----------
// Ba trạng thái của nút trong dock: nghỉ / đang bật / đang tắt.
const CTL_IDLE = 'bg-control border-white/10 text-ink'
const CTL_ON = 'bg-signal-500/16 border-signal-500/45 text-signal-300'
const CTL_OFF = 'bg-danger/16 border-danger/50 text-danger-soft'
const CTL_WARN = 'bg-warn/16 border-warn/50 text-warn-soft'

// Đồng hồ LIVE: đếm từ lúc vào phòng thật, không phải số trang trí.
const liveSince = ref<number | null>(null)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined

watch(phase, (value) => {
  if (value === 'live' && liveSince.value === null) {
    liveSince.value = Date.now()
    now.value = Date.now()
    clock = setInterval(() => { now.value = Date.now() }, 1000)
  }
  if (value !== 'live' && clock) {
    clearInterval(clock)
    clock = undefined
  }
})
onBeforeUnmount(() => clearInterval(clock))

const elapsed = computed(() => {
  if (liveSince.value === null) return '00:00:00'
  const s = Math.max(0, Math.floor((now.value - liveSince.value) / 1000))
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map(n => String(n).padStart(2, '0')).join(':')
})

const inRoom = computed(() => conf.tiles.value.filter(t => !t.isScreen).length)

const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomId.value)
    toast.add({ title: 'Room code copied', color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Copy failed', color: 'error' })
  }
}

// Màn hình kết thúc của A: mỗi trạng thái một tông màu riêng.
const endTone: Record<string, { tone: string, bg: string, border: string, tag: string }> = {
  ended: { tone: 'text-faint', bg: 'bg-white/5', border: 'border-white/12', tag: 'ENDED' },
  removed: { tone: 'text-danger-soft', bg: 'bg-danger/10', border: 'border-danger/35', tag: 'REMOVED' },
  left: { tone: 'text-signal-300', bg: 'bg-signal-500/10', border: 'border-signal-500/35', tag: 'LEFT' },
  lost: { tone: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/35', tag: 'LOST' },
  error: { tone: 'text-danger-soft', bg: 'bg-danger/10', border: 'border-danger/35', tag: 'ERROR' }
}
</script>

<template>
  <div class="h-dvh flex flex-col bg-canvas text-ink overflow-hidden">
    <!-- Loading / waiting / end states -->
    <div v-if="phase !== 'live'" class="relative flex-1 flex items-center justify-center p-6">
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_50%_45%,#000,transparent_72%)]" />

      <div v-if="phase === 'loading' || phase === 'connecting'" class="relative text-center" role="status">
        <UIcon name="i-lucide-loader-circle" class="text-4xl animate-spin text-signal-400" />
        <p class="mt-3 text-muted">{{ phase === 'loading' ? 'Opening meeting…' : 'Connecting to the meeting…' }}</p>
      </div>

      <div v-else-if="phase === 'waiting'" class="relative max-w-90 text-center" role="status">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] border border-warn/35 bg-warn/10 text-warn">
          <UIcon name="i-lucide-hourglass" class="text-2xl" />
        </div>
        <h1 class="mt-5 text-2xl font-semibold tracking-[-.02em]">Waiting for the host</h1>
        <p class="mt-2.5 text-[15px] leading-[1.6] text-muted">You'll join automatically once you're let in to</p>
        <div
          class="mt-3 inline-block rounded-lg border border-signal-500/30 bg-signal-500/[.08] px-3 py-1.75 font-mono text-[13px] tracking-[.08em] text-signal-300">
          {{ roomId }}
        </div>
        <div class="mt-6.5">
          <button type="button" class="btn-ghost rounded-[10px] px-5 py-2.75 text-sm" @click="cancelWaiting">Cancel</button>
        </div>
      </div>

      <div v-else-if="endScreens[phase]" class="relative max-w-100 text-center">
        <div class="flex items-center justify-center gap-3">
          <span class="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border"
            :class="[endTone[phase]?.bg, endTone[phase]?.border, endTone[phase]?.tone]">
            <UIcon :name="endScreens[phase]!.icon" class="text-lg" />
          </span>
          <span class="font-mono text-[10px] tracking-[.16em]" :class="endTone[phase]?.tone">{{ endTone[phase]?.tag }}</span>
        </div>
        <h1 class="mt-4.5 text-[21px] font-semibold tracking-[-.02em]">{{ endScreens[phase]!.title }}</h1>
        <p class="mt-2.25 text-sm leading-[1.6] text-muted">
          {{ phase === 'error' ? errorMessage : endScreens[phase]!.body }}
        </p>
        <div class="mt-5.5 flex justify-center gap-2.5">
          <NuxtLink to="/" class="btn-ghost rounded-[9px] px-4 py-2.5 text-sm">Back to home</NuxtLink>
          <button v-if="phase === 'left'" type="button" class="btn-soft rounded-[9px] px-4 py-2.5 text-sm font-medium"
            @click="goToJoin">Rejoin</button>
          <button v-if="phase === 'lost' || phase === 'error'" type="button"
            class="btn-soft rounded-[9px] px-4 py-2.5 text-sm font-medium" @click="start">Try again</button>
        </div>
      </div>
    </div>

    <!-- Live meeting -->
    <template v-else>
      <header class="flex h-14 flex-none items-center gap-4 border-b border-white/6 bg-chrome px-4.5">
        <NuxtLink to="/" class="shrink-0" aria-label="ConferX home"><img src="/conferx-logo.svg" alt="" class="h-5.5 block"></NuxtLink>
        <div class="h-5.5 w-px bg-white/8" />

        <button type="button" aria-label="Copy room code"
          class="flex items-center gap-2 rounded-lg border border-white/8 bg-raised px-2.5 py-1.5 cursor-pointer hover:border-signal-500/45 transition-colors"
          @click="copyRoomId">
          <span class="font-mono text-xs tracking-[.06em] text-dim">{{ roomId }}</span>
          <UIcon name="i-lucide-copy" class="text-[13px] text-muted" />
        </button>

        <div class="hidden items-center gap-3.5 font-mono text-xs text-muted sm:flex">
          <span v-if="reconnecting" class="flex items-center gap-1.5 text-warn">
            <span class="h-[5px] w-[5px] rounded-full bg-warn animate-pulse-dot" />RECONNECTING
          </span>
          <span v-else class="flex items-center gap-1.5">
            <span class="h-[5px] w-[5px] rounded-full bg-online animate-pulse-dot" />LIVE {{ elapsed }}
          </span>
          <span>{{ inRoom }} IN ROOM</span>
        </div>

        <button type="button" class="btn-soft ml-auto rounded-lg px-3.5 py-2 text-sm" @click="inviteOpen = true">
          <UIcon name="i-lucide-user-plus" class="text-[15px]" />Invite
        </button>
      </header>

      <div v-if="!conf.canPlayAudio.value"
        class="flex flex-none items-center gap-3 border-b border-warn/25 bg-warn/12 px-4.5 py-2 text-sm text-warn-soft">
        <span>Your browser blocked meeting audio.</span>
        <button type="button"
          class="rounded-md border border-warn/45 px-2.5 py-1 text-xs font-medium text-warn-soft cursor-pointer hover:bg-warn/15"
          @click="conf.startAudio()">Turn on sound</button>
      </div>

      <div class="relative flex min-h-0 flex-1">
        <main class="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div v-if="screenTile" class="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
            <div class="min-h-0 min-w-0 flex-1">
              <RoomVideoTile :tile="screenTile" />
            </div>
            <div class="flex h-28 shrink-0 gap-3 overflow-auto lg:h-auto lg:w-56 lg:flex-col">
              <div v-for="tile in cameraTiles" :key="tile.key" class="aspect-video w-44 shrink-0 lg:w-full">
                <RoomVideoTile :tile="tile" compact @clear-doodle="submitDoodle('')" />
              </div>
            </div>
          </div>
          <RoomWhiteboard v-else-if="whiteboardOpen" class="h-full" :strokes="wb.strokes.value"
            :active="wb.active.value" :can-undo="wb.canUndo.value" :start-stroke="wb.startStroke"
            :add-point="wb.addPoint" :end-stroke="wb.endStroke" :undo="wb.undo" :clear="wb.clear"
            @close="whiteboardOpen = false" @submit="submitDoodle" />
          <div v-else ref="stage" class="flex h-full flex-wrap content-center items-center justify-center gap-3">
            <div v-for="tile in cameraTiles" :key="tile.key" class="aspect-video" :style="{ width: `${tileWidth}px` }">
              <RoomVideoTile :tile="tile" :compact="tileWidth < 360" @clear-doodle="submitDoodle('')" />
            </div>
          </div>

          <!-- Dock điều khiển: viên thuốc nổi, không còn thanh dưới đặc -->
          <div class="flex flex-none items-center justify-center">
            <div
              class="flex items-center gap-2 rounded-full border border-white/8 bg-tile px-3.5 py-2.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)]">
              <div class="group relative">
                <button type="button" :aria-label="conf.micOn.value ? 'Mute microphone' : 'Unmute microphone'"
                  class="flex h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125"
                  :class="conf.micOn.value ? CTL_IDLE : CTL_OFF" @click="conf.toggleMic()">
                  <UIcon :name="conf.micOn.value ? 'i-lucide-mic' : 'i-lucide-mic-off'" class="text-xl" />
                </button>
                <UDropdownMenu v-if="microphones.length > 1" v-model:open="micMenuOpen" :items="micItems"
                  :content="{ side: 'top', align: 'center', sideOffset: 12 }">
                  <button type="button" aria-label="Choose microphone"
                    class="absolute -top-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 scale-75 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-control text-dim opacity-0 ring-2 ring-tile transition-all duration-150 pointer-events-none group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
                    :class="micMenuOpen && 'opacity-100 scale-100 pointer-events-auto'">
                    <UIcon name="i-lucide-chevron-up" class="text-xs" />
                  </button>
                </UDropdownMenu>
              </div>

              <div class="group relative">
                <button type="button" :aria-label="conf.camOn.value ? 'Turn off camera' : 'Turn on camera'"
                  class="flex h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125"
                  :class="conf.camOn.value ? CTL_IDLE : CTL_OFF" @click="conf.toggleCamera()">
                  <UIcon :name="conf.camOn.value ? 'i-lucide-video' : 'i-lucide-video-off'" class="text-xl" />
                </button>
                <UDropdownMenu v-if="cameras.length > 1" v-model:open="camMenuOpen" :items="camItems"
                  :content="{ side: 'top', align: 'center', sideOffset: 12 }">
                  <button type="button" aria-label="Choose camera"
                    class="absolute -top-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 scale-75 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-control text-dim opacity-0 ring-2 ring-tile transition-all duration-150 pointer-events-none group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
                    :class="camMenuOpen && 'opacity-100 scale-100 pointer-events-auto'">
                    <UIcon name="i-lucide-chevron-up" class="text-xs" />
                  </button>
                </UDropdownMenu>
              </div>

              <button type="button" :aria-label="conf.screenOn.value ? 'Stop presenting' : 'Present screen'"
                class="hidden h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125 sm:flex"
                :class="conf.screenOn.value ? CTL_ON : CTL_IDLE" @click="conf.toggleScreenShare()">
                <UIcon name="i-lucide-monitor-up" class="text-xl" />
              </button>

              <button type="button" :aria-label="conf.handRaised.value ? 'Lower hand' : 'Raise hand'"
                class="flex h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125"
                :class="conf.handRaised.value ? CTL_WARN : CTL_IDLE" @click="conf.toggleHand()">
                <UIcon name="i-lucide-hand" class="text-xl" />
              </button>

              <button type="button" :aria-label="whiteboardOpen ? 'Close whiteboard' : 'Open whiteboard'"
                class="hidden h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125 sm:flex"
                :class="whiteboardOpen ? CTL_ON : CTL_IDLE" @click="toggleWhiteboard()">
                <UIcon name="i-lucide-pencil" class="text-xl" />
              </button>

              <div class="mx-1.5 h-6.5 w-px bg-white/9" />

              <button type="button" aria-label="Chat"
                class="relative flex h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125"
                :class="panel === 'chat' ? CTL_ON : CTL_IDLE" @click="togglePanel('chat')">
                <UIcon name="i-lucide-message-square" class="text-xl" />
                <span v-if="unread > 0"
                  class="absolute -right-1 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full border-2 border-tile bg-signal-500 px-1.25 font-mono text-[11px] font-medium text-abyss">{{ unread }}</span>
              </button>

              <button type="button" aria-label="People"
                class="relative flex h-11.5 w-11.5 cursor-pointer items-center justify-center rounded-full border transition-[filter] hover:brightness-125"
                :class="panel === 'people' ? CTL_ON : CTL_IDLE" @click="togglePanel('people')">
                <UIcon name="i-lucide-users" class="text-xl" />
                <span v-if="isAdmin && pendingCount > 0"
                  class="absolute -right-1 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full border-2 border-tile bg-warn px-1.25 font-mono text-[11px] font-medium text-[#1a1206]">{{ pendingCount }}</span>
              </button>

              <div class="mx-1.5 h-6.5 w-px bg-white/9" />

              <button type="button" class="btn-danger h-11.5 rounded-full px-5 text-[15px] font-medium" @click="leave">
                <UIcon name="i-lucide-phone-off" class="text-lg" />Leave
              </button>
              <button v-if="isAdmin" type="button"
                class="hidden h-11.5 cursor-pointer items-center rounded-full border border-danger/45 px-4 text-sm text-danger-soft transition-colors hover:bg-danger/12 sm:inline-flex"
                @click="confirmEndOpen = true">End for all</button>
            </div>
          </div>
        </main>

        <aside v-if="panel"
          class="absolute inset-0 z-10 flex flex-col bg-chrome sm:static sm:w-86 sm:border-l sm:border-white/6">
          <div class="flex flex-none gap-1 border-b border-white/6 p-3">
            <button type="button" class="flex-1 cursor-pointer rounded-lg border px-3 py-2.25 text-sm transition-colors"
              :class="panel === 'chat'
                ? 'border-signal-500/35 bg-signal-500/12 font-medium text-signal-300'
                : 'border-transparent bg-transparent text-muted hover:bg-white/4'" @click="panel = 'chat'">Chat</button>
            <button type="button" class="flex-1 cursor-pointer rounded-lg border px-3 py-2.25 text-sm transition-colors"
              :class="panel === 'people'
                ? 'border-signal-500/35 bg-signal-500/12 font-medium text-signal-300'
                : 'border-transparent bg-transparent text-muted hover:bg-white/4'"
              @click="panel = 'people'">People · {{ participants.length }}</button>
            <button type="button" aria-label="Close panel"
              class="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-lg border border-white/8 text-muted transition-colors hover:text-ink"
              @click="panel = null">
              <UIcon name="i-lucide-x" class="text-base" />
            </button>
          </div>
          <RoomChatPanel v-if="panel === 'chat'" class="min-h-0 flex-1" :messages="conf.messages.value"
            @send="conf.sendMessage" />
          <RoomPeoplePanel v-else class="min-h-0 flex-1" :participants="participants" :online-ids="onlineIds"
            :self-id="selfId" :is-admin="isAdmin" :require-approval="requireApproval" :has-doodles="hasDoodles"
            @approve="approve" @reject="reject" @remove="remove" @clear-doodles="conf.clearAllDoodles()"
            @update:require-approval="setRequireApproval" />
        </aside>
      </div>

      <RoomInviteDialog v-model:open="inviteOpen" :room-id="roomId" :password="me?.room.room_password" />

      <UModal v-model:open="confirmEndOpen" title="End the meeting for everyone?"
        description="Everyone will be disconnected and the meeting can't be restarted.">
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <button type="button" class="btn-ghost rounded-[10px] px-4 py-2.5 text-sm"
              @click="confirmEndOpen = false">Cancel</button>
            <button type="button" class="btn-danger rounded-[10px] px-4 py-2.5 text-sm font-medium"
              @click="endForAll">End meeting</button>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
