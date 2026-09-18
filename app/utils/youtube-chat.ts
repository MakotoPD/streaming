import type { StreamEvent } from '#shared/types'

interface YouTubeChatResponse {
  live: boolean
  videoId: string | null
  seq: number
  events: StreamEvent[]
}

export function connectYouTube(channel: string, emit: (event: StreamEvent) => void) {
  let closed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let after: number | undefined
  let videoId: string | null = null

  async function tick() {
    let wait = 2000
    try {
      const result = await $fetch<YouTubeChatResponse>('/api/youtube/chat', { query: { channel, after } })
      if (closed) return
      if (!result.live) {
        after = undefined
        videoId = null
        wait = 30_000
      }
      else {
        if (result.videoId !== videoId) after = undefined
        else result.events.forEach(emit)
        videoId = result.videoId
        after = result.seq
      }
    }
    catch (err) {
      console.warn('[youtube] chat', err)
      wait = 10_000
    }
    if (!closed) timer = setTimeout(tick, wait)
  }

  tick()
  return {
    close() {
      closed = true
      clearTimeout(timer)
    }
  }
}
