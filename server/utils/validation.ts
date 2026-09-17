import { z } from 'zod'
import type { Channels } from '#shared/types'

export const channelsInput = z.object({
  twitch: z.string().trim().toLowerCase().regex(/^\w{3,25}$/).or(z.literal('')).optional(),
  kick: z.string().trim().toLowerCase().regex(/^[\w-]{2,40}$/).or(z.literal('')).optional()
})

export function channelsPatch(input: z.infer<typeof channelsInput>): Channels {
  const patch: Channels = {}
  if (input.twitch !== undefined) patch.twitch = input.twitch ? { login: input.twitch } : undefined
  if (input.kick !== undefined) patch.kick = input.kick ? { slug: input.kick } : undefined
  return patch
}
