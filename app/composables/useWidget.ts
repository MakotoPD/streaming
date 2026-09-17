import type { InjectionKey, Ref, ShallowRef } from 'vue'
import type { Channels } from '#shared/types'

export interface WidgetContext {
  id: string
  token: string
  preview: boolean
  channels: Ref<Channels | undefined>
  emotes: ShallowRef<ReturnType<typeof createEmoteStore> | undefined>
}

const WIDGET_CONTEXT: InjectionKey<WidgetContext> = Symbol('widget-context')

export function provideWidgetContext(context: WidgetContext) {
  provide(WIDGET_CONTEXT, context)
}

export function useWidgetContext() {
  return inject(WIDGET_CONTEXT, undefined)
}

export function useWidgetState<T>(name: string, initial: () => T): Ref<T> {
  const context = useWidgetContext()
  const key = context ? `widget-state:${context.id}:${context.preview ? 'preview' : 'live'}:${name}` : undefined

  const read = (): T | undefined => {
    try {
      const raw = key ? localStorage.getItem(key) : null
      return raw ? JSON.parse(raw) as T : undefined
    }
    catch {
      return undefined
    }
  }

  const state = ref(read() ?? initial()) as Ref<T>
  watch(state, (value) => {
    try {
      if (key) localStorage.setItem(key, JSON.stringify(value))
    }
    catch {
      return
    }
  }, { deep: true })
  return state
}

export function useNow(interval = 1000) {
  const now = ref(Date.now())
  const timer = setInterval(() => {
    now.value = Date.now()
  }, interval)
  onBeforeUnmount(() => clearInterval(timer))
  return now
}

export function useDisplayQueue<T>(holdMs: () => number, onShow?: (item: T) => void) {
  const current: ShallowRef<T | undefined> = shallowRef()
  const queue: T[] = []
  let timer: ReturnType<typeof setTimeout> | undefined

  function next() {
    if (current.value) return
    const item = queue.shift()
    if (!item) return
    current.value = item
    onShow?.(item)
    timer = setTimeout(() => {
      current.value = undefined
    }, holdMs())
  }

  function push(item: T) {
    queue.push(item)
    next()
  }

  onBeforeUnmount(() => clearTimeout(timer))
  return { current, push, next }
}

export interface ChannelStats {
  twitch: { viewers: number | null, followers: number | null, subs: number | null, live: boolean } | null
  kick: { viewers: number, followers: number | null, live: boolean } | null
}

export function useChannelStats(interval = 60_000, enabled: () => boolean = () => true) {
  const context = useWidgetContext()
  const stats = ref<ChannelStats>({ twitch: null, kick: null })

  async function load() {
    if (!context || !enabled()) return
    const slug = context.channels.value?.kick?.slug
    const [server, kick] = await Promise.all([
      $fetch<{ twitch: ChannelStats['twitch'] }>(`/api/o/${context.token}/stats`).catch(() => null),
      slug ? $fetch<any>(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`).catch(() => null) : null
    ])
    stats.value = {
      twitch: server?.twitch ?? null,
      kick: kick ? { viewers: Number(kick.livestream?.viewer_count) || 0, followers: kick.followers_count == null ? null : Number(kick.followers_count), live: !!kick.livestream } : null
    }
  }

  onMounted(load)
  const timer = setInterval(load, interval)
  onBeforeUnmount(() => clearInterval(timer))
  watch([() => context?.channels.value, enabled], load)
  return stats
}
