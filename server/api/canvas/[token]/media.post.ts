export default defineEventHandler(async (event) => {
  const widget = await canvasByEditToken(event)
  return storeMedia(event, widget.userId, { video: true, canvas: true })
})
