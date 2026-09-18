export interface Stroke {
  color: string
  width: number
  eraser: boolean
  /** Flat [x0, y0, x1, y1, ...] pairs, normalized 0..1 so the drawing scales to any canvas size. */
  points: number[]
}

/** A private scratchpad. Nothing here is shared until submitDoodle posts a snapshot to your tile. */
export const useWhiteboard = () => {
  const strokes = shallowRef<Stroke[]>([])
  const active = shallowRef<Stroke | null>(null)

  const startStroke = (x: number, y: number, color: string, width: number, eraser: boolean) => {
    active.value = { color, width, eraser, points: [x, y] }
  }
  const addPoint = (x: number, y: number) => {
    if (!active.value) return
    active.value.points.push(x, y)
    active.value = { ...active.value }
  }
  const endStroke = () => {
    if (!active.value) return
    strokes.value = [...strokes.value, active.value]
    active.value = null
  }
  const undo = () => {
    strokes.value = strokes.value.slice(0, -1)
  }
  const clear = () => {
    strokes.value = []
  }

  return {
    strokes,
    active,
    canUndo: computed(() => strokes.value.length > 0),
    startStroke,
    addPoint,
    endStroke,
    undo,
    clear
  }
}
