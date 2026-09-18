<script setup lang="ts">
import type { Settings } from '#shared/types'
import { widgetTexts } from '#shared/widgets'

interface Track { title: string, artist: string, album: string, cover: string }

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const context = useWidgetContext()
const track = ref<Track | null>(null)
const coverBroken = ref(false)
const label = computed(() => props.settings.nowPlayingLabel || widgetTexts(props.settings.language).nowPlaying.label)
const visible = computed(() => !!track.value || !props.settings.hideWhenIdle)
const trackKey = computed(() => (track.value ? `${track.value.artist}-${track.value.title}` : 'idle'))

let timer: ReturnType<typeof setTimeout> | undefined
let sample = 0

async function poll() {
  clearTimeout(timer)
  const s = props.settings
  if (context && s.musicUser && Date.now() > sample) {
    try {
      const result = await $fetch<{ track: Track | null }>(`/api/o/${context.token}/now-playing`, { query: { source: s.musicSource, user: s.musicUser } })
      track.value = result.track
    }
    catch (err) {
      console.warn('[now-playing]', err)
    }
  }
  timer = setTimeout(poll, Math.max(5, s.pollSeconds ?? 10) * 1000)
}

watch(() => [props.settings.musicSource, props.settings.musicUser], () => {
  sample = 0
  poll()
})
watch(trackKey, () => {
  coverBroken.value = false
})

onMounted(poll)
onBeforeUnmount(() => clearTimeout(timer))

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'command' || event.name !== 'now-playing') return
  track.value = event.payload
  sample = Date.now() + 15_000
})
</script>

<template>
  <div class="now-playing" :class="`now-playing-${settings.nowPlayingLayout}`">
    <Transition :enter-active-class="`anim-in-${settings.animIn}`" :leave-active-class="`anim-out-${settings.animOut}`" mode="out-in">
      <div v-if="visible" :key="trackKey" class="now-playing-card">
        <div v-if="settings.showCover && settings.nowPlayingLayout === 'card'" class="now-playing-cover">
          <img v-if="track?.cover && !coverBroken" :src="track.cover" alt="" @error="coverBroken = true">
          <UIcon v-else name="i-lucide-disc-3" class="now-playing-placeholder" />
        </div>
        <div class="now-playing-text">
          <div class="now-playing-label">
            <span v-if="settings.showEqualizer" class="now-playing-bars" :class="{ 'now-playing-paused': !track }">
              <i /><i /><i /><i />
            </span>
            {{ label }}
          </div>
          <div class="now-playing-title">
            {{ track?.title || '—' }}
          </div>
          <div v-if="track?.artist" class="now-playing-artist">
            {{ track.artist }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .now-playing {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 12px;
  }

  .now-playing-card {
    display: flex;
    align-items: center;
    gap: 0.8em;
    max-width: 100%;
    padding: 0.6em;
    padding-right: 1.2em;
    border-radius: var(--radius);
    background: var(--bg);
    font-size: var(--font-size);
    color: var(--text);
  }

  .now-playing-compact .now-playing-card {
    padding: 0.4em 0.9em;
  }

  .now-playing-cover {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: var(--cover-size);
    height: var(--cover-size);
    overflow: hidden;
    border-radius: calc(var(--radius) * 0.6);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .now-playing-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .now-playing-placeholder {
    width: 50%;
    height: 50%;
    color: var(--accent);
  }

  .now-playing-text {
    min-width: 0;
  }

  .now-playing-label {
    display: flex;
    align-items: center;
    gap: 0.45em;
    font-size: 0.55em;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .now-playing-title {
    overflow: hidden;
    font-weight: 800;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .now-playing-artist {
    overflow: hidden;
    font-size: 0.75em;
    opacity: 0.75;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .now-playing-compact .now-playing-text {
    display: flex;
    align-items: baseline;
    gap: 0.5em;
  }

  .now-playing-compact .now-playing-artist::before {
    content: '— ';
  }

  .now-playing-bars {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 1em;
  }

  .now-playing-bars i {
    width: 3px;
    height: 100%;
    border-radius: 2px;
    background: currentColor;
    transform-origin: bottom;
    animation: now-playing-bar 0.9s ease-in-out infinite alternate;
  }

  .now-playing-bars i:nth-child(2) { animation-delay: -0.3s; }
  .now-playing-bars i:nth-child(3) { animation-delay: -0.6s; }
  .now-playing-bars i:nth-child(4) { animation-delay: -0.15s; }

  .now-playing-paused i {
    animation: none;
    transform: scaleY(0.25);
  }

  @keyframes now-playing-bar {
    from { transform: scaleY(0.25); }
    to { transform: scaleY(1); }
  }
}
</style>
