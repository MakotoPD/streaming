import type { OverlayMessage } from '#shared/types'

type Listener = (msg: OverlayMessage) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribeUser(userId: string, fn: Listener) {
  let set = listeners.get(userId)
  if (!set) listeners.set(userId, (set = new Set()))
  set.add(fn)
  return () => {
    set.delete(fn)
    if (!set.size) listeners.delete(userId)
  }
}

export function publishToUser(userId: string, msg: OverlayMessage) {
  listeners.get(userId)?.forEach(fn => fn(msg))
}
