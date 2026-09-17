<script setup lang="ts">
import {
  applyOps,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  canvasBounds,
  emptyScene,
  sanitizeOps,
  type CanvasObject,
  type CanvasOp,
  type CanvasScene,
  type CanvasShape,
  type CanvasText
} from '#shared/canvas'
import { FONTS } from '#shared/widgets'
import type { CanvasToolState } from '~/utils/canvas'

definePageMeta({ layout: false })

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const token = String(route.params.token)

const { data, error } = await useFetch<{ widgetId: string, name: string, scene: CanvasScene }>(`/api/canvas/${token}`)
if (error.value) throw createError({ statusCode: 404, fatal: true })

useHead({ title: () => data.value?.name || t('canvas.title'), meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const scene = shallowRef<CanvasScene>(data.value?.scene ? structuredClone(toRaw(data.value.scene)) : emptyScene())
const past = shallowRef<CanvasScene[]>([])
const future = shallowRef<CanvasScene[]>([])
const selectedId = ref<string>()
const editingId = ref<string>()
const uploading = ref(false)
const offline = ref(false)
const showText = ref(false)

const tool = reactive<CanvasToolState>({
  name: 'pencil',
  stroke: '#ff3d71',
  width: 10,
  fillOn: false,
  fillColor: '#22d3ee',
  font: FONTS[0],
  size: 96,
  bold: true,
  italic: false,
  underline: false,
  strike: false
})

const selected = computed(() => scene.value.objects.find(object => object.id === selectedId.value))
const selectedBounds = computed(() => (selected.value ? canvasBounds(selected.value) : undefined))
const resizable = computed(() => selected.value?.kind === 'media' || selected.value?.kind === 'text')

const clientId = crypto.randomUUID()
let chain: Promise<unknown> = Promise.resolve()

function post(ops: CanvasOp[]) {
  chain = chain
    .then(() => $fetch(`/api/canvas/${token}/ops`, { method: 'POST', body: { clientId, ops } }))
    .then(() => {
      offline.value = false
    })
    .catch((err: any) => {
      offline.value = true
      if (err?.data?.message === 'too_many_objects') toast.add({ title: t('canvas.errors.too_many_objects'), color: 'error' })
    })
}

function snapshot() {
  past.value = [...past.value, structuredClone(toRaw(scene.value))].slice(-50)
  future.value = []
}

function apply(ops: CanvasOp[]) {
  scene.value = applyOps(scene.value, ops)
}

function commit(ops: CanvasOp[]) {
  snapshot()
  apply(ops)
  post(ops)
}

function byId(id: string | undefined) {
  return id ? scene.value.objects.find(object => object.id === id) : undefined
}

const newId = () => crypto.randomUUID().slice(0, 12)
const round = (value: number) => Math.round(value * 10) / 10

function undo() {
  const previous = past.value.at(-1)
  if (!previous) return
  past.value = past.value.slice(0, -1)
  future.value = [...future.value, structuredClone(toRaw(scene.value))]
  editingId.value = undefined
  scene.value = previous
  post([{ t: 'set', scene: previous }])
}

function redo() {
  const next = future.value.at(-1)
  if (!next) return
  future.value = future.value.slice(0, -1)
  past.value = [...past.value, structuredClone(toRaw(scene.value))]
  editingId.value = undefined
  scene.value = next
  post([{ t: 'set', scene: next }])
}

function clearAll() {
  if (!confirm(t('canvas.confirmClear'))) return
  selectedId.value = undefined
  editingId.value = undefined
  commit([{ t: 'set', scene: { background: '', objects: [] } }])
}

function removeSelected() {
  const id = selectedId.value
  if (!id) return
  selectedId.value = undefined
  editingId.value = undefined
  commit([{ t: 'del', ids: [id] }])
}

const frame = useTemplateRef<HTMLElement>('frame')
const scale = ref(0.25)

function fit() {
  const el = frame.value?.parentElement
  if (!el) return
  scale.value = Math.max(0.05, Math.min(el.clientWidth / CANVAS_WIDTH, el.clientHeight / CANVAS_HEIGHT))
}

let observer: ResizeObserver | undefined
let source: EventSource | undefined

onMounted(() => {
  fit()
  observer = new ResizeObserver(fit)
  if (frame.value?.parentElement) observer.observe(frame.value.parentElement)

  source = new EventSource(`/api/canvas/${token}/events`)
  source.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.kind === 'reload') return location.reload()
    if (msg.kind !== 'event' || msg.event?.kind !== 'command' || msg.event.name !== 'canvas') return
    if (msg.event.payload?.from === clientId) return
    apply(sanitizeOps(msg.event.payload?.ops))
  }
  addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  source?.close()
  removeEventListener('keydown', onKey)
})

function onKey(event: KeyboardEvent) {
  if (editingId.value) {
    if (event.key === 'Escape') stopEditing()
    return
  }
  const key = event.key.toLowerCase()
  if ((event.ctrlKey || event.metaKey) && key === 'z') {
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
  }
  else if ((event.ctrlKey || event.metaKey) && key === 'y') {
    event.preventDefault()
    redo()
  }
  else if ((key === 'delete' || key === 'backspace') && selectedId.value) {
    event.preventDefault()
    removeSelected()
  }
  else if (key === 'escape') {
    selectedId.value = undefined
  }
}

function point(event: PointerEvent): [number, number] {
  const rect = frame.value!.getBoundingClientRect()
  return [
    round(Math.min(CANVAS_WIDTH, Math.max(0, (event.clientX - rect.left) / scale.value))),
    round(Math.min(CANVAS_HEIGHT, Math.max(0, (event.clientY - rect.top) / scale.value)))
  ]
}

function hitId(event: PointerEvent) {
  const el = document.elementFromPoint(event.clientX, event.clientY)
  return el?.closest('[data-id]')?.getAttribute('data-id') ?? undefined
}

let lastSent = 0
function stream(object: CanvasObject) {
  const now = Date.now()
  if (now - lastSent < 120) return
  lastSent = now
  post([{ t: 'put', o: structuredClone(object) }])
}

let drawing: CanvasObject | undefined
let dragging: { origin: CanvasObject, from: [number, number], resize: boolean } | undefined
let erased: Set<string> | undefined

function stopEditing() {
  const id = editingId.value
  editingId.value = undefined
  const object = byId(id)
  if (!object || object.kind !== 'text') return
  if (object.text.trim()) post([{ t: 'put', o: structuredClone(toRaw(object)) }])
  else apply([{ t: 'del', ids: [object.id] }])
}

function textDefaults(x: number, y: number): CanvasText {
  return {
    id: newId(),
    kind: 'text',
    x,
    y: Math.max(0, round(y - tool.size * 0.6)),
    w: Math.min(CANVAS_WIDTH - x, 1200),
    text: '',
    color: tool.stroke,
    font: tool.font,
    size: tool.size,
    bold: tool.bold,
    italic: tool.italic,
    underline: tool.underline,
    strike: tool.strike
  }
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target as Element
  if (target.closest('.canvas-editing')) return
  event.preventDefault()
  if (editingId.value) stopEditing()

  const [x, y] = point(event)
  const id = hitId(event)
  frame.value?.setPointerCapture(event.pointerId)

  if (target.getAttribute('data-handle') && selected.value) {
    snapshot()
    dragging = { origin: structuredClone(toRaw(selected.value)), from: [x, y], resize: true }
    return
  }

  if (tool.name === 'eraser') {
    erased = new Set()
    snapshot()
    eraseAt(event)
    return
  }

  if (tool.name === 'fill') {
    fillAt(id)
    return
  }

  if (tool.name === 'text') {
    const existing = byId(id)
    if (existing?.kind === 'text') {
      selectedId.value = existing.id
      editingId.value = existing.id
      syncTool(existing)
      return
    }
    const object = textDefaults(x, y)
    snapshot()
    apply([{ t: 'put', o: object }])
    selectedId.value = object.id
    editingId.value = object.id
    return
  }

  if (tool.name === 'move') {
    selectedId.value = id
    const object = byId(id)
    if (object?.kind === 'text') syncTool(object)
    if (!object) return
    snapshot()
    dragging = { origin: structuredClone(toRaw(object)), from: [x, y], resize: false }
    return
  }

  selectedId.value = undefined
  const shape = tool.name as CanvasShape
  drawing = {
    id: newId(),
    kind: 'draw',
    shape,
    points: shape === 'pencil' ? [x, y] : [x, y, x, y],
    stroke: tool.stroke,
    width: tool.width,
    fill: tool.fillOn && ['rect', 'ellipse', 'triangle'].includes(shape) ? tool.fillColor : 'none'
  }
  snapshot()
  apply([{ t: 'put', o: drawing }])
}

function onPointerMove(event: PointerEvent) {
  if (erased) return eraseAt(event)

  const active = drawing
  if (active?.kind === 'draw') {
    const [x, y] = point(event)
    if (active.shape === 'pencil') {
      const lastX = active.points.at(-2) ?? x
      const lastY = active.points.at(-1) ?? y
      if (Math.hypot(x - lastX, y - lastY) < 3) return
      active.points.push(x, y)
    }
    else {
      active.points[2] = x
      active.points[3] = y
    }
    const next = { ...active, points: [...active.points] }
    drawing = next
    apply([{ t: 'put', o: next }])
    stream(next)
    return
  }

  if (dragging) {
    const [x, y] = point(event)
    const dx = x - dragging.from[0]
    const dy = y - dragging.from[1]
    const next = dragging.resize ? resizeObject(dragging.origin, dx, dy) : moveObject(dragging.origin, dx, dy)
    apply([{ t: 'put', o: next }])
    stream(next)
  }
}

function onPointerUp(event: PointerEvent) {
  frame.value?.releasePointerCapture(event.pointerId)
  erased = undefined
  if (drawing) {
    post([{ t: 'put', o: structuredClone(drawing) }])
    drawing = undefined
  }
  if (dragging) {
    const object = byId(selectedId.value ?? dragging.origin.id)
    if (object) post([{ t: 'put', o: structuredClone(toRaw(object)) }])
    dragging = undefined
  }
}

function moveObject(origin: CanvasObject, dx: number, dy: number): CanvasObject {
  if (origin.kind === 'draw') {
    return { ...origin, points: origin.points.map((value, index) => round(value + (index % 2 ? dy : dx))) }
  }
  return { ...origin, x: round(origin.x + dx), y: round(origin.y + dy) }
}

function resizeObject(origin: CanvasObject, dx: number, dy: number): CanvasObject {
  if (origin.kind === 'media') {
    const ratio = origin.h / origin.w
    const width = Math.max(32, round(origin.w + Math.max(dx, dy / (ratio || 1))))
    return { ...origin, w: width, h: round(width * ratio) }
  }
  if (origin.kind === 'text') {
    return { ...origin, w: Math.max(80, round(origin.w + dx)) }
  }
  return origin
}

function eraseAt(event: PointerEvent) {
  const id = hitId(event)
  if (!id || !erased || erased.has(id)) return
  erased.add(id)
  if (selectedId.value === id) selectedId.value = undefined
  apply([{ t: 'del', ids: [id] }])
  post([{ t: 'del', ids: [id] }])
}

function fillAt(id: string | undefined) {
  const object = byId(id)
  if (!object) {
    commit([{ t: 'bg', color: tool.fillOn ? tool.fillColor : '' }])
    return
  }
  if (object.kind === 'draw') {
    commit([{ t: 'put', o: { ...structuredClone(toRaw(object)), fill: tool.fillOn ? tool.fillColor : 'none' } }])
  }
  else if (object.kind === 'text') {
    commit([{ t: 'put', o: { ...structuredClone(toRaw(object)), color: tool.fillOn ? tool.fillColor : tool.stroke } }])
  }
}

function onText(id: string, value: string) {
  const object = byId(id)
  if (object?.kind !== 'text') return
  const next = { ...structuredClone(toRaw(object)), text: value }
  apply([{ t: 'put', o: next }])
  stream(next)
}

let syncing = false

function syncTool(object: CanvasText) {
  syncing = true
  Object.assign(tool, {
    font: object.font,
    size: object.size,
    bold: object.bold,
    italic: object.italic,
    underline: object.underline,
    strike: object.strike,
    stroke: object.color
  })
}

watch(() => [tool.font, tool.size, tool.bold, tool.italic, tool.underline, tool.strike, tool.stroke], () => {
  if (syncing) {
    syncing = false
    return
  }
  const object = selected.value
  if (object?.kind !== 'text') return
  const next: CanvasText = {
    ...structuredClone(toRaw(object)),
    font: tool.font,
    size: tool.size,
    bold: tool.bold,
    italic: tool.italic,
    underline: tool.underline,
    strike: tool.strike,
    color: tool.stroke
  }
  apply([{ t: 'put', o: next }])
  post([{ t: 'put', o: next }])
})

const picker = useTemplateRef<HTMLInputElement>('picker')

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const body = new FormData()
  body.append('file', file)
  uploading.value = true
  try {
    const media = await $fetch<{ url: string, width: number, height: number, video: boolean }>(`/api/canvas/${token}/media`, { method: 'POST', body })
    const width = media.width || 960
    const height = media.height || 540
    const factor = Math.min(1, 1000 / width, 700 / height)
    const object: CanvasObject = {
      id: newId(),
      kind: 'media',
      w: round(width * factor),
      h: round(height * factor),
      x: round((CANVAS_WIDTH - width * factor) / 2),
      y: round((CANVAS_HEIGHT - height * factor) / 2),
      url: media.url,
      video: media.video
    }
    commit([{ t: 'put', o: object }])
    selectedId.value = object.id
    tool.name = 'move'
  }
  catch (err: any) {
    toast.add({ title: t(`image.errors.${err?.data?.message ?? 'generic'}`), color: 'error' })
  }
  finally {
    uploading.value = false
    if (picker.value) picker.value.value = ''
  }
}

const cursor = computed(() => {
  if (tool.name === 'move') return 'default'
  if (tool.name === 'text') return 'text'
  return 'crosshair'
})
</script>

<template>
  <div class="flex h-dvh flex-col bg-elevated">
    <div class="flex items-center gap-3 px-4 py-2">
      <UIcon name="i-lucide-pencil-ruler" class="size-5 text-primary" />
      <span class="font-semibold">{{ data?.name || t('canvas.title') }}</span>
      <UBadge v-if="offline" color="error" variant="subtle" icon="i-lucide-wifi-off" :label="t('canvas.offline')" />
      <div class="flex-1" />
      <span class="hidden text-xs text-muted sm:block">{{ t('canvas.hint') }}</span>
    </div>

    <div class="grid min-h-0 flex-1 place-items-center p-4">
      <div
        ref="frame"
        class="relative touch-none select-none shadow-2xl outline outline-default checker"
        :style="{ width: `${CANVAS_WIDTH * scale}px`, height: `${CANVAS_HEIGHT * scale}px`, cursor }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          class="absolute left-0 top-0 origin-top-left"
          :style="{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, transform: `scale(${scale})` }"
        >
          <CanvasStage :scene="scene" :editing="editingId" @text="onText" />
          <svg
            class="pointer-events-none absolute inset-0 h-full w-full"
            :viewBox="`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`"
            preserveAspectRatio="none"
          >
            <template v-if="selectedBounds">
              <rect
                :x="selectedBounds.x"
                :y="selectedBounds.y"
                :width="selectedBounds.w"
                :height="selectedBounds.h"
                fill="none"
                stroke="#38bdf8"
                :stroke-width="2 / scale"
                :stroke-dasharray="`${8 / scale} ${6 / scale}`"
              />
              <rect
                v-if="resizable"
                data-handle="1"
                class="pointer-events-auto cursor-nwse-resize"
                :x="selectedBounds.x + selectedBounds.w - 8 / scale"
                :y="selectedBounds.y + selectedBounds.h - 8 / scale"
                :width="16 / scale"
                :height="16 / scale"
                fill="#38bdf8"
              />
            </template>
          </svg>
        </div>
      </div>
    </div>

    <div class="p-3">
      <CanvasToolbar
        v-model:text="showText"
        :tool="tool"
        :can-undo="past.length > 0"
        :can-redo="future.length > 0"
        :uploading="uploading"
        :has-selection="!!selectedId"
        @undo="undo"
        @redo="redo"
        @clear="clearAll"
        @remove="removeSelected"
        @upload="picker?.click()"
      />
    </div>

    <input ref="picker" type="file" class="hidden" accept="image/png,image/webp,image/gif,video/mp4,video/webm" @change="upload">
  </div>
</template>

<style scoped>
.checker {
  background: repeating-conic-gradient(#27272a 0 25%, #3f3f46 0 50%) 0 0 / 24px 24px;
}
</style>
