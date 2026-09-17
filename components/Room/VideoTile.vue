<script setup lang="ts">
import type { Tile } from '~/composables/useConference'

const props = defineProps<{ tile: Tile, compact?: boolean }>()
const videoEl = useTemplateRef<HTMLVideoElement>('videoEl')

watch(
  [() => props.tile.track, videoEl],
  ([track, el], [prevTrack]) => {
    if (prevTrack && prevTrack !== track && el) prevTrack.detach(el)
    if (track && el) track.attach(el)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (props.tile.track && videoEl.value) props.tile.track.detach(videoEl.value)
})

const initials = computed(() =>
  props.tile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '?'
)
const label = computed(() => {
  const who = props.tile.isLocal ? `${props.tile.name} (you)` : props.tile.name
  return props.tile.isScreen ? `${who} is presenting` : who
})
</script>
<template>
  <div class="relative w-full h-full min-h-0 rounded-xl overflow-hidden bg-gray-900 ring-2 transition-shadow"
    :class="tile.isSpeaking && !tile.isScreen ? 'ring-blue-500' : 'ring-transparent'">
    <video v-show="tile.track" ref="videoEl" autoplay playsinline muted
      class="absolute inset-0 w-full h-full"
      :class="[tile.isScreen ? 'object-contain bg-black' : 'object-cover', tile.isLocal && !tile.isScreen ? '-scale-x-100' : '']" />

    <div v-if="!tile.track" class="absolute inset-0 flex items-center justify-center">
      <div class="rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center font-semibold text-white"
        :class="compact ? 'w-12 h-12 text-lg' : 'w-20 h-20 text-2xl'">
        {{ initials }}
      </div>
    </div>

    <div class="absolute left-2 bottom-2 flex items-center gap-1.5 max-w-[calc(100%-1rem)] rounded-md bg-black/60 px-2 py-1 text-xs text-white">
      <UIcon v-if="!tile.isScreen && !tile.micOn" name="i-lucide-mic-off" class="shrink-0 text-red-400" />
      <UIcon v-if="tile.isScreen" name="i-lucide-monitor-up" class="shrink-0" />
      <span class="truncate">{{ label }}</span>
    </div>
  </div>
</template>
