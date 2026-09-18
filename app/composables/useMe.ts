import type { Channels } from '#shared/types'

export interface Me {
  id: string
  channels: Channels
  expiresAt: string | null
  accounts: { provider: 'twitch' | 'kick' | 'youtube', login: string, displayName: string, avatar: string | null, needsReconnect: boolean }[]
}

export function useMe() {
  return useFetch<Me>('/api/me', { key: 'me' })
}
