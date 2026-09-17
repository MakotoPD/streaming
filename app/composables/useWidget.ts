import type { InjectionKey, Ref, ShallowRef } from 'vue'
import type { Channels } from '#shared/types'

export interface WidgetContext {
  id: string
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
