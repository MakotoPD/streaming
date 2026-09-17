import { z } from 'zod'
import { applyOps, CANVAS_MAX_BODY, CANVAS_MAX_OBJECTS, CANVAS_MAX_OPS, sanitizeOps } from '#shared/canvas'

const body = z.object({
  clientId: z.string().max(60),
  ops: z.array(z.unknown()).max(CANVAS_MAX_OPS)
})

export default defineEventHandler(async (event) => {
  const widget = await canvasByEditToken(event)
  if (Number(getRequestHeader(event, 'content-length')) > CANVAS_MAX_BODY) throw createError({ statusCode: 413 })

  const input = await readValidatedBody(event, body.parse)
  const ops = sanitizeOps(input.ops)
  if (!ops.length) return { ok: true }

  const scene = applyOps(canvasScene(widget), ops)
  if (scene.objects.length > CANVAS_MAX_OBJECTS) throw createError({ statusCode: 400, message: 'too_many_objects' })

  storeScene(widget, scene)
  publishCanvasOps(widget, ops, input.clientId)
  return { ok: true }
})
