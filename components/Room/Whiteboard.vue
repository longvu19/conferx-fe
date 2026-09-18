<script setup lang="ts">
import type { Stroke } from '~/composables/useWhiteboard'

const props = defineProps<{
  strokes: Stroke[]
  active: Stroke | null
  canUndo: boolean
  startStroke: (x: number, y: number, color: string, width: number, eraser: boolean) => void
  addPoint: (x: number, y: number) => void
  endStroke: () => void
  undo: () => void
  clear: () => void
}>()
const emit = defineEmits<{ close: [], submit: [dataUrl: string] }>()

const COLORS = ['#1f2937', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7']
const WIDTHS = [2, 4, 8]
const color = ref(COLORS[0]!)
const penWidth = ref(WIDTHS[1]!)
const eraser = ref(false)
const submitted = ref(false)

const wrapEl = useTemplateRef<HTMLDivElement>('wrapEl')
const canvasEl = useTemplateRef<HTMLCanvasElement>('canvasEl')
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let lastSentAt = 0
let resizeObserver: ResizeObserver | undefined

const drawStroke = (c: CanvasRenderingContext2D, s: Stroke, w: number, h: number) => {
  if (s.points.length < 4) return
  c.save()
  c.globalCompositeOperation = s.eraser ? 'destination-out' : 'source-over'
  c.strokeStyle = s.color
  c.lineWidth = s.width
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.beginPath()
  c.moveTo(s.points[0]! * w, s.points[1]! * h)
  for (let i = 2; i < s.points.length; i += 2) c.lineTo(s.points[i]! * w, s.points[i + 1]! * h)
  c.stroke()
  c.restore()
}

const renderTo = (c: CanvasRenderingContext2D, w: number, h: number) => {
  c.clearRect(0, 0, w, h)
  c.fillStyle = '#ffffff'
  c.fillRect(0, 0, w, h)
  for (const s of props.strokes) drawStroke(c, s, w, h)
  if (props.active) drawStroke(c, props.active, w, h)
}

const draw = () => {
  const canvas = canvasEl.value
  if (!canvas || !ctx) return
  const dpr = window.devicePixelRatio || 1
  renderTo(ctx, canvas.width / dpr, canvas.height / dpr)
}

const resize = () => {
  const canvas = canvasEl.value, wrap = wrapEl.value
  if (!canvas || !wrap) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = wrap.clientWidth * dpr
  canvas.height = wrap.clientHeight * dpr
  ctx = canvas.getContext('2d')
  ctx?.scale(dpr, dpr)
  draw()
}

watch([() => props.strokes, () => props.active], draw)

onMounted(() => {
  resizeObserver = new ResizeObserver(resize)
  if (wrapEl.value) resizeObserver.observe(wrapEl.value)
  resize()
})
onBeforeUnmount(() => resizeObserver?.disconnect())

const pointFromEvent = (e: PointerEvent) => {
  const rect = canvasEl.value!.getBoundingClientRect()
  return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
}

const onPointerDown = (e: PointerEvent) => {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drawing = true
  submitted.value = false
  const { x, y } = pointFromEvent(e)
  props.startStroke(x, y, color.value, eraser.value ? 24 : penWidth.value, eraser.value)
}
const onPointerMove = (e: PointerEvent) => {
  if (!drawing) return
  const now = performance.now()
  if (now - lastSentAt < 20) return
  lastSentAt = now
  const { x, y } = pointFromEvent(e)
  props.addPoint(x, y)
}
const onPointerUp = () => {
  if (!drawing) return
  drawing = false
  props.endStroke()
}

const submit = () => {
  const EXPORT_W = 320, EXPORT_H = 200
  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_W
  canvas.height = EXPORT_H
  const c = canvas.getContext('2d')!
  renderTo(c, EXPORT_W, EXPORT_H)
  emit('submit', canvas.toDataURL('image/png'))
  submitted.value = true
}
</script>
<template>
  <div class="h-full flex flex-col bg-tile rounded-[14px] overflow-hidden">
    <div class="flex items-center gap-2 px-3 py-2 border-b border-white/6 bg-chrome overflow-x-auto">
      <button v-for="c in COLORS" :key="c" type="button" class="w-6 h-6 shrink-0 rounded-full ring-2 transition-shadow"
        :style="{ background: c }" :class="!eraser && color === c ? 'ring-white' : 'ring-transparent'"
        :aria-label="`Color ${c}`" @click="color = c; eraser = false" />

      <div class="w-px h-6 bg-white/9 mx-1 shrink-0" />

      <button v-for="w in WIDTHS" :key="w" type="button"
        class="w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-colors"
        :class="!eraser && penWidth === w ? 'bg-white/15' : 'hover:bg-white/10'"
        :aria-label="`Pen size ${w}`" @click="penWidth = w; eraser = false">
        <span class="rounded-full bg-white" :style="{ width: `${w + 2}px`, height: `${w + 2}px` }" />
      </button>

      <div class="w-px h-6 bg-white/9 mx-1 shrink-0" />

      <UButton icon="i-lucide-eraser" size="xs" :variant="eraser ? 'solid' : 'ghost'"
        :color="eraser ? 'primary' : 'neutral'" aria-label="Eraser" @click="eraser = !eraser" />
      <UButton icon="i-lucide-undo-2" size="xs" variant="ghost" color="neutral" :disabled="!canUndo"
        aria-label="Undo my last stroke" @click="undo" />
      <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" :disabled="!canUndo"
        aria-label="Clear my drawing" @click="clear" />

      <UButton :icon="submitted ? 'i-lucide-check' : 'i-lucide-send-horizontal'" size="xs"
        :color="submitted ? 'success' : 'primary'" :label="submitted ? 'Submitted' : 'Submit'"
        class="ml-auto shrink-0" :disabled="!canUndo" @click="submit" />
      <UButton icon="i-lucide-x" size="xs" variant="ghost" color="neutral" class="shrink-0"
        aria-label="Close whiteboard" @click="emit('close')" />
    </div>

    <p class="px-3 py-1.5 font-mono text-[11px] tracking-[.04em] text-faint border-b border-white/6 bg-chrome/60">
      This is your own scratchpad. Press Submit to post it on your video tile for everyone to see.
    </p>

    <div ref="wrapEl" class="flex-1 min-h-0 relative touch-none">
      <canvas ref="canvasEl" class="absolute inset-0 w-full h-full cursor-crosshair"
        @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp"
        @pointercancel="onPointerUp" />
    </div>
  </div>
</template>
