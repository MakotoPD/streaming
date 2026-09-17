export type Platform = 'twitch' | 'kick'

export interface Channels {
  twitch?: { login: string, id?: string }
  kick?: { slug: string }
}

export interface Badge {
  url?: string
  icon?: string
  color?: string
}

export type ChatPart =
  | { type: 'text', text: string }
  | { type: 'emote', name: string, url: string, layers?: string[] }

export type AlertType = 'follow' | 'sub' | 'gifts' | 'raid' | 'bits'

export type StreamEvent =
  | {
    kind: 'chat'
    id: string
    platform: Platform
    userId: string
    name: string
    color?: string
    badges: Badge[]
    parts: ChatPart[]
    text: string
  }
  | { kind: 'delete', platform: Platform, id: string }
  | { kind: 'clear', platform: Platform, userId?: string }
  | {
    kind: 'alert'
    type: AlertType
    platform: Platform
    name: string
    anonymous?: boolean
    months?: number
    count?: number
    tier?: number
  }

export type Settings = Record<string, any>

export type OverlayMessage =
  | { kind: 'config', widgetId?: string, settings: Settings }
  | { kind: 'event', widgetId?: string, event: StreamEvent }
  | { kind: 'reload', widgetId?: string }
