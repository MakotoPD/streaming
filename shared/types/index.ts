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

export type ChatRole = 'broadcaster' | 'moderator' | 'vip' | 'subscriber'

export type AlertType = 'follow' | 'sub' | 'gifts' | 'raid' | 'bits'

export interface ChatMessage {
  kind: 'chat'
  id: string
  platform: Platform
  userId: string
  name: string
  color?: string
  badges: Badge[]
  roles: ChatRole[]
  parts: ChatPart[]
  text: string
  firstMessage?: boolean
  highlighted?: boolean
  bits?: number
}

export interface AlertEvent {
  kind: 'alert'
  type: AlertType
  platform: Platform
  name: string
  anonymous?: boolean
  months?: number
  count?: number
  tier?: number
}

export interface RedemptionEvent {
  kind: 'redemption'
  platform: Platform
  id: string
  name: string
  input: string
  reward: { title: string, cost: number, prompt: string }
}

export interface HypeTrainEvent {
  kind: 'hypetrain'
  phase: 'begin' | 'progress' | 'end'
  level: number
  total: number
  progress: number
  goal: number
  golden: boolean
  contributors: { name: string, type: string, total: number }[]
  expiresAt?: string
}

export interface TwitchPollEvent {
  kind: 'twitch-poll'
  phase: 'begin' | 'progress' | 'end'
  id: string
  title: string
  choices: { id: string, title: string, votes: number }[]
  endsAt?: string
  status?: string
}

export interface PredictionEvent {
  kind: 'prediction'
  phase: 'begin' | 'progress' | 'lock' | 'end'
  id: string
  title: string
  outcomes: { id: string, title: string, color: string, users: number, points: number }[]
  locksAt?: string
  winningId?: string
  status?: string
}

export type StreamEvent =
  | ChatMessage
  | AlertEvent
  | RedemptionEvent
  | HypeTrainEvent
  | TwitchPollEvent
  | PredictionEvent
  | { kind: 'delete', platform: Platform, id: string }
  | { kind: 'clear', platform: Platform, userId?: string }
  | { kind: 'command', name: string, payload?: any }

export type Settings = Record<string, any>

export type OverlayMessage =
  | { kind: 'config', widgetId?: string, settings: Settings }
  | { kind: 'event', widgetId?: string, event: StreamEvent }
  | { kind: 'reload', widgetId?: string }
