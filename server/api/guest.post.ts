export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, channelsInput.parse)
  if (!input.twitch && !input.kick) throw createError({ statusCode: 400, message: 'Channel required' })
  const userId = await ensureUser(event)
  return { channels: await updateChannels(userId, channelsPatch(input)) }
})
