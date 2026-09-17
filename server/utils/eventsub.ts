import type { StreamEvent } from '../../shared/types'

const PHASES: Record<string, string> = { begin: 'begin', progress: 'progress', end: 'end', lock: 'lock' }

export function eventSubToStreamEvent(type: string, event: any): StreamEvent | undefined {
  const phase = PHASES[type.split('.').at(-1) ?? '']

  if (type === 'channel.follow') {
    return { kind: 'alert', type: 'follow', platform: 'twitch', name: event.user_name }
  }

  if (type === 'channel.channel_points_custom_reward_redemption.add') {
    return {
      kind: 'redemption',
      platform: 'twitch',
      id: event.id,
      name: event.user_name,
      input: event.user_input ?? '',
      reward: { title: event.reward?.title ?? '', cost: Number(event.reward?.cost) || 0, prompt: event.reward?.prompt ?? '' }
    }
  }

  if (type.startsWith('channel.hype_train.') && phase) {
    return {
      kind: 'hypetrain',
      phase: phase as 'begin' | 'progress' | 'end',
      level: Number(event.level) || 1,
      total: Number(event.total) || 0,
      progress: Number(event.progress) || 0,
      goal: Number(event.goal) || 0,
      golden: event.type === 'golden_kappa',
      contributors: (event.top_contributions ?? []).map((c: any) => ({ name: c.user_name, type: c.type, total: Number(c.total) || 0 })),
      expiresAt: event.expires_at
    }
  }

  if (type.startsWith('channel.poll.') && phase) {
    return {
      kind: 'twitch-poll',
      phase: phase as 'begin' | 'progress' | 'end',
      id: event.id,
      title: event.title,
      choices: (event.choices ?? []).map((c: any) => ({ id: c.id, title: c.title, votes: Number(c.votes) || 0 })),
      endsAt: event.ends_at,
      status: event.status
    }
  }

  if (type.startsWith('channel.prediction.') && phase) {
    return {
      kind: 'prediction',
      phase: phase as 'begin' | 'progress' | 'lock' | 'end',
      id: event.id,
      title: event.title,
      outcomes: (event.outcomes ?? []).map((o: any) => ({ id: o.id, title: o.title, color: o.color, users: Number(o.users) || 0, points: Number(o.channel_points) || 0 })),
      locksAt: event.locks_at,
      winningId: event.winning_outcome_id ?? undefined,
      status: event.status
    }
  }

  return undefined
}
