import type { Channels, StreamEvent } from '#shared/types'

export interface EventBus {
  on: (fn: (event: StreamEvent) => void) => () => void
  emit: (event: StreamEvent) => void
}

export function createEventBus(): EventBus {
  const listeners = new Set<(event: StreamEvent) => void>()
  return {
    on(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    emit(event) {
      for (const fn of listeners) fn(event)
    }
  }
}

export function useStreamEvents(channels: MaybeRefOrGetter<Channels | undefined>, bus: EventBus, enabled: MaybeRefOrGetter<boolean> = true) {
  let cleanup: (() => void)[] = []
  const emoteStore = shallowRef<ReturnType<typeof createEmoteStore>>()

  const stop = () => {
    cleanup.forEach(fn => fn())
    cleanup = []
    emoteStore.value = undefined
  }

  watch(() => [toValue(channels)?.twitch?.login, toValue(channels)?.kick?.slug, toValue(enabled)] as const, ([twitchLogin, kickSlug, on]) => {
    stop()
    if (!on) return

    let active = true
    cleanup.push(() => { active = false })

    const emotes = createEmoteStore()
    cleanup.push(emotes.close)
    emoteStore.value = emotes
    const ids: { twitchId?: string, kickUserId?: number } = {}

    const emit = (event: StreamEvent) => {
      if (!active) return
      bus.emit(event.kind === 'chat' ? { ...event, parts: emotes.expand(event.parts) } : event)
    }

    if (twitchLogin) {
      let badges: Record<string, string> = {}
      const conn = connectTwitch(twitchLogin, {
        onRoom: async (roomId) => {
          if (ids.twitchId === roomId) return
          ids.twitchId = roomId
          emotes.load(ids)
          badges = await $fetch<Record<string, string>>(`/api/twitch/badges/${roomId}`).catch(() => ({}))
        },
        onMessage: msg => ircToEvents(msg, key => badges[key]).forEach(emit)
      })
      cleanup.push(conn.close)
    }

    if (kickSlug) {
      fetchKickChannel(kickSlug)
        .then((channel) => {
          if (!active) return
          ids.kickUserId = channel.userId
          emotes.load(ids)
          cleanup.push(connectKick(channel, emit).close)
        })
        .catch(err => console.warn('[kick] failed to load channel', kickSlug, err))
    }

    if (!twitchLogin && !kickSlug) emotes.load(ids)
  }, { immediate: true })

  onScopeDispose(stop)
  return { emotes: emoteStore }
}

export function useBusEvents(bus: EventBus, handler: Parameters<EventBus['on']>[0]) {
  let off: (() => void) | undefined
  onMounted(() => {
    off = bus.on(handler)
  })
  onBeforeUnmount(() => off?.())
}
