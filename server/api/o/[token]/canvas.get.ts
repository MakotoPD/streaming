export default defineEventHandler(async (event) => {
  const { widget } = await widgetByToken(event)
  if (widget.type !== 'canvas') throw createError({ statusCode: 404 })
  return canvasScene(widget)
})
