<script setup lang="ts">
import type { Tile } from '~/composables/useConference'

const props = defineProps<{ tile: Tile, compact?: boolean }>()
const emit = defineEmits<{ 'clear-doodle': [] }>()
const videoEl = useTemplateRef<HTMLVideoElement>('videoEl')

watch(
  [() => props.tile.track, videoEl],
  ([track, el], [prevTrack]) => {
    if (prevTrack && prevTrack !== track && el) prevTrack.detach(el)
    if (track && el) track.attach(el)
  },
  { immediate: true }
)

// A freshly submitted doodle takes over the tile for a moment before settling into the corner.
const DOODLE_SPOTLIGHT_MS = 10000
const doodleSpotlight = ref(false)
let spotlightTimer: ReturnType<typeof setTimeout> | undefined

watch(() => props.tile.doodle, (next, prev) => {
  clearTimeout(spotlightTimer)
  doodleSpotlight.value = !!next && next !== prev
  if (doodleSpotlight.value) spotlightTimer = setTimeout(() => { doodleSpotlight.value = false }, DOODLE_SPOTLIGHT_MS)
})

onBeforeUnmount(() => {
  clearTimeout(spotlightTimer)
  if (props.tile.track && videoEl.value) props.tile.track.detach(videoEl.value)
})

const initials = computed(() =>
  props.tile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '?'
)
const label = computed(() => {
  const who = props.tile.isLocal ? `${props.tile.name} (you)` : props.tile.name
  return props.tile.isScreen ? `${who} is presenting` : who
})

// Người đang nói được viền xanh + quầng; còn lại chỉ một hairline chìm.
const ring = computed(() =>
  props.tile.isSpeaking && !props.tile.isScreen
    ? '0 0 0 1px #4680ca, 0 0 30px -8px #4680cacc'
    : 'inset 0 0 0 1px rgba(255,255,255,.07)'
)
</script>
<template>
  <div class="relative h-full min-h-0 w-full overflow-hidden rounded-[14px] bg-tile transition-shadow"
    :style="{ boxShadow: ring }">
    <video v-show="tile.track" ref="videoEl" autoplay playsinline muted class="absolute inset-0 h-full w-full"
      :class="[tile.isScreen ? 'object-contain bg-abyss' : 'object-cover', tile.isLocal && !tile.isScreen ? '-scale-x-100' : '']" />

    <!-- Vân chéo mảnh: giữ mặt phẳng khỏi bị chết khi chưa có hình. -->
    <div v-if="!tile.track"
      class="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,.03)_0_2px,transparent_2px_10px)]" />

    <div v-if="!tile.track" class="absolute inset-0 flex items-center justify-center">
      <div
        class="flex items-center justify-center rounded-full border border-white/10 bg-lift font-mono tracking-[.06em] text-signal-300"
        :class="compact ? 'h-12 w-12 text-lg' : 'h-22 w-22 text-2xl'">
        {{ initials }}
      </div>
    </div>

    <div v-if="tile.handRaised && !tile.isScreen"
      class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-warn/40 bg-warn/16 text-warn-soft">
      <UIcon name="i-lucide-hand" class="text-base" />
    </div>

    <div v-if="tile.doodle && !tile.isScreen"
      class="absolute bottom-3 right-3 overflow-hidden rounded-md shadow-lg transition-all duration-500 ease-out"
      :class="doodleSpotlight ? 'w-[80%] ring-2 ring-white/60' : 'w-20 ring-1 ring-black/20 sm:w-24'">
      <img :src="tile.doodle" alt="" class="block aspect-[16/10] w-full bg-white object-contain">
      <button v-if="tile.isLocal" type="button" aria-label="Clear my doodle"
        class="absolute right-0.5 top-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white"
        @click.stop="emit('clear-doodle')">
        <UIcon name="i-lucide-x" class="text-[10px]" />
      </button>
    </div>

    <div
      class="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg border border-white/8 bg-[rgba(4,6,10,.72)] px-2.5 py-1.5">
      <UIcon v-if="!tile.isScreen && !tile.micOn" name="i-lucide-mic-off" class="shrink-0 text-[13px] text-danger" />
      <UIcon v-if="tile.isScreen" name="i-lucide-monitor-up" class="shrink-0 text-[13px] text-muted" />
      <span class="truncate text-[13px] text-ink">{{ label }}</span>
      <span v-if="tile.isLocal && !tile.isScreen"
        class="flex-none rounded border border-signal-500/35 px-1.25 py-0.5 font-mono text-[10px] tracking-[.1em] text-signal-300">YOU</span>
    </div>

    <!-- Ba vạch báo đang nói, thay cho viền nhấp nháy. -->
    <div v-if="tile.isSpeaking && !tile.isScreen"
      class="absolute bottom-3 right-3 flex h-4 items-end gap-0.5" aria-hidden="true">
      <span class="w-[3px] rounded-sm bg-signal-500" style="height:6px" />
      <span class="w-[3px] rounded-sm bg-signal-500" style="height:14px" />
      <span class="w-[3px] rounded-sm bg-signal-500" style="height:9px" />
    </div>
  </div>
</template>
