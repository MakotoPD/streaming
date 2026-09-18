import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { DONATION_SOURCES, type DonationCredentials } from '#shared/types'

const body = z.object({
  source: z.enum(DONATION_SOURCES),
  value: z.string().trim().max(4000)
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const { source, value } = await readValidatedBody(event, body.parse)
  const db = useDb()
  const [user] = await db.select({ donations: tables.users.donations }).from(tables.users).where(eq(tables.users.id, userId))
  const donations: DonationCredentials = { ...user?.donations }

  if (!value) {
    delete donations[source]
  }
  else if (source === 'streamelements') {
    const channel = streamElementsChannel(value)
    if (!channel) throw createError({ statusCode: 400, message: 'invalid_token' })
    const result = await verifyDonationSource(source, { streamelements: { token: value, channel } })
    if (result !== 'ok') throw createError({ statusCode: 400, message: result === 'timeout' ? 'timeout' : 'rejected' })
    donations.streamelements = { token: seal(value), channel }
  }
  else if (source === 'tipply') {
    const id = tipplyId(value)
    if (!id) throw createError({ statusCode: 400, message: 'invalid_link' })
    const result = await verifyDonationSource(source, { tipply: { id } })
    if (result !== 'ok') throw createError({ statusCode: 400, message: result === 'timeout' ? 'timeout' : 'rejected' })
    donations.tipply = { id }
  }
  else {
    if (!/^[\w.-]{20,4000}$/.test(value)) throw createError({ statusCode: 400, message: 'invalid_token' })
    const result = await verifyDonationSource(source, { streamlabs: { token: value } })
    if (result !== 'ok') throw createError({ statusCode: 400, message: result === 'timeout' ? 'timeout' : 'rejected' })
    donations.streamlabs = { token: seal(value) }
  }

  await db.update(tables.users).set({ donations }).where(eq(tables.users.id, userId))
  await restartDonations(userId)
  return { ok: true }
})
