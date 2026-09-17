import type { Channels } from '#shared/types'

export interface Me {
  id: string
  channels: Channels
  accounts: { provider: 'twitch' | 'kick', login: string, displayName: string, avatar: string | null, needsReconnect: boolean }[]
}

export function useMe() {
  return useFetch<Me>('/api/me', { key: 'me' })
}
