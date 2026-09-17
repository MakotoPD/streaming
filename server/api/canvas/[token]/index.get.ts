export default defineEventHandler(async (event) => {
  const widget = await canvasByEditToken(event)
  return { widgetId: widget.id, name: widget.name, scene: canvasScene(widget) }
})
