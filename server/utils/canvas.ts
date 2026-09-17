import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { and, eq, lt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { applyOps, emptyScene, type CanvasOp, type CanvasScene } from '#shared/canvas'

type WidgetRow = { id: string, userId: string, type: string, scene: CanvasScene | null }

const CANVAS_MEDIA_GRACE = 5 * 60 * 1000
const SWEEP_INTERVAL = 60 * 1000

const scenes = new Map<string, CanvasScene>()
const flushing = new Map<string, ReturnType<typeof setTimeout>>()
const swept = new Map<string, number>()

export async function canvasByEditToken(event: H3Event) {
  const token = getRouterParam(event, 'token') ?? ''
  const [widget] = token
    ? await useDb().select().from(tables.widgets).where(eq(tables.widgets.editToken, token))
    : []
  if (!widget || widget.type !== 'canvas') throw createError({ statusCode: 404 })
  return widget
}

export function canvasScene(widget: WidgetRow): CanvasScene {
  return scenes.get(widget.id) ?? widget.scene ?? emptyScene()
}

async function writeScene(widgetId: string, scene: CanvasScene) {
  await useDb().update(tables.widgets).set({ scene, updatedAt: new Date() }).where(eq(tables.widgets.id, widgetId))
}

export function storeScene(widget: WidgetRow, scene: CanvasScene) {
  scenes.set(widget.id, scene)
  if (flushing.has(widget.id)) return
  flushing.set(widget.id, setTimeout(async () => {
    flushing.delete(widget.id)
    const latest = scenes.get(widget.id)
    if (!latest) return
    await writeScene(widget.id, latest).catch(err => console.error('[canvas] save failed', err))
    if (scenes.get(widget.id) === latest) scenes.delete(widget.id)
    await sweepCanvasMedia(widget.userId).catch(err => console.error('[canvas] sweep failed', err))
  }, 1500))
}

export function publishCanvasOps(widget: WidgetRow, ops: CanvasOp[], from?: string) {
  publishToUser(widget.userId, {
    kind: 'event',
    widgetId: widget.id,
    event: { kind: 'command', name: 'canvas', payload: { ops, from } }
  })
}

export async function removeCanvasMedia(widget: WidgetRow, url: string) {
  const scene = canvasScene(widget)
  const ids = scene.objects.filter(object => object.kind === 'media' && object.url === url).map(object => object.id)
  if (!ids.length) return
  const ops: CanvasOp[] = [{ t: 'del', ids }]
  const next = applyOps(scene, ops)
  scenes.set(widget.id, next)
  await writeScene(widget.id, next)
  publishCanvasOps(widget, ops)
}

export async function sweepCanvasMedia(userId: string, options: { force?: boolean, grace?: number } = {}) {
  const now = Date.now()
  if (!options.force && now - (swept.get(userId) ?? 0) < SWEEP_INTERVAL) return
  swept.set(userId, now)

  const orphans = await useDb().select().from(tables.images).where(and(
    eq(tables.images.userId, userId),
    eq(tables.images.canvas, true),
    lt(tables.images.createdAt, new Date(now - (options.grace ?? CANVAS_MEDIA_GRACE)))
  ))
  if (!orphans.length) return

  const widgets = await userWidgets(userId)
  const dir = join(useRuntimeConfig().uploadDir, 'images')
  for (const image of orphans) {
    if (usagesOf(widgets, `/api/images/${image.id}/file`).length) continue
    await useDb().delete(tables.images).where(eq(tables.images.id, image.id))
    await rm(join(dir, image.file), { force: true })
  }
}
