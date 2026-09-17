import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const patch = channelsPatch(await readValidatedBody(event, channelsInput.parse))
  const [user] = await useDb().select({ channels: tables.users.channels }).from(tables.users).where(eq(tables.users.id, userId))
  if (patch.twitch && user?.channels.twitch?.login === patch.twitch.login) delete patch.twitch
  return { channels: await updateChannels(userId, patch) }
})
