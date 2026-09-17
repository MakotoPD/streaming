import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { WIDGETS } from '#shared/widgets'

export interface FileUsage {
  widgetId: string
  type: string
  name: string
  mode?: string
  fields: { key: string, label: string, section: string }[]
}

export const SOUND_EXTENSIONS: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a'
}

export const SOUND_MAX_SIZE = 3 * 1024 * 1024

export async function readUploadedFile(event: H3Event) {
  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 400, message: 'invalid_type' })
  return file
}

export function validateSound(file: { type?: string, data: Buffer }) {
  const extension = file.type ? SOUND_EXTENSIONS[file.type] : undefined
  if (!extension) throw createError({ statusCode: 400, message: 'invalid_type' })
  if (file.data.length > SOUND_MAX_SIZE) throw createError({ statusCode: 400, message: 'too_large' })
  return extension
}

export async function userWidgets(userId: string) {
  return useDb().select().from(tables.widgets).where(eq(tables.widgets.userId, userId))
}

export function usagesOf(widgets: Awaited<ReturnType<typeof userWidgets>>, url: string): FileUsage[] {
  return widgets.flatMap((widget) => {
    const def = WIDGETS[widget.type]
    if (!def) return []
    const fields = def.fields
      .filter(field => widget.settings[field.key] === url)
      .map(field => ({ key: field.key, label: field.label ?? field.key, section: field.section }))
    if (canvasScene(widget).objects.some(object => object.kind === 'media' && object.url === url)) {
      fields.push({ key: 'canvasMedia', label: 'canvasMedia', section: 'general' })
    }
    return fields.length ? [{ widgetId: widget.id, type: widget.type, name: widget.name, mode: widget.settings.mode, fields }] : []
  })
}

export async function clearUsages(userId: string, url: string) {
  const widgets = await userWidgets(userId)
  for (const usage of usagesOf(widgets, url)) {
    const widget = widgets.find(w => w.id === usage.widgetId)!
    await removeCanvasMedia(widget, url)
    const keys = usage.fields.map(field => field.key).filter(key => key !== 'canvasMedia')
    if (!keys.length) continue
    const settings = { ...widget.settings }
    for (const key of keys) settings[key] = ''
    await useDb().update(tables.widgets).set({ settings, updatedAt: new Date() }).where(eq(tables.widgets.id, widget.id))
    publishToUser(userId, { kind: 'config', widgetId: widget.id, settings })
  }
}

export async function reloadUsages(userId: string, url: string) {
  for (const usage of usagesOf(await userWidgets(userId), url)) {
    publishToUser(userId, { kind: 'reload', widgetId: usage.widgetId })
  }
}

export function sendCachedFile(event: H3Event, file: { name: string, mime: string, data: Buffer }) {
  const etag = `"${file.name}"`
  setHeaders(event, {
    'ETag': etag,
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'default-src \'none\'; sandbox'
  })
  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return null
  }
  setHeader(event, 'Content-Type', file.mime)
  return file.data
}
