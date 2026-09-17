export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return storeMedia(event, userId, { video: true })
})
