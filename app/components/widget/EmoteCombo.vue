<script setup lang="ts">
import type { Settings } from '#shared/types'

const props = defineProps<{ settings: Settings, bus: EventBus }>()

const visible = ref(false)
const emoteUrl = ref('')
const count = ref(0)
const emoteEl = useTemplateRef<HTMLImageElement>('emote')
const numberEl = useTemplateRef<HTMLSpanElement>('number')

const seen = new Map<string, number[]>()
const urls = new Map<string, string>()
const popAnimations = new WeakMap<Element, Animation>()
let hideTimer: ReturnType<typeof setTimeout> | undefined

function pop(el: Element | null, strength: number) {
  if (!el) return
  popAnimations.get(el)?.cancel()
  const peak = 1 + (props.settings.popScale - 1) * strength
  const deg = props.settings.popRotate * strength
  popAnimations.set(el, el.animate([
    { scale: 1, rotate: '0deg', easing: 'cubic-bezier(.2,.8,.3,1)' },
    { scale: peak, rotate: `${deg}deg`, easing: 'cubic-bezier(.4,0,.5,1)', offset: 0.45 },
    { scale: 1, rotate: '0deg' }
  ], { duration: 180, easing: 'linear' }))
}

async function show(url: string, hits: number) {
  emoteUrl.value = url
  count.value = hits
  visible.value = true
  await nextTick()
  pop(emoteEl.value, 1)
  pop(numberEl.value, 0.6)
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
  }, props.settings.window * 1000)
}

useBusEvents(props.bus, (event) => {
  if (event.kind !== 'chat') return
  const now = Date.now()
  const windowMs = props.settings.window * 1000

  const inMessage = new Set<string>()
  for (const part of event.parts) {
    if (part.type !== 'emote') continue
    inMessage.add(part.name)
    urls.set(part.name, part.url)
  }

  for (const name of inMessage) {
    const hits = (seen.get(name) ?? []).filter(t => now - t < windowMs)
    hits.push(now)
    seen.set(name, hits)
    if (hits.length >= props.settings.minMessages) show(urls.get(name) ?? '', hits.length)
  }

  for (const [name, times] of seen) {
    if (!times.some(t => now - t < windowMs)) seen.delete(name)
  }
})

onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<template>
  <div class="combo" :class="`combo-${settings.position}`">
    <Transition
      :enter-active-class="`anim-in-${settings.animIn}`"
      :leave-active-class="`anim-out-${settings.animOut}`"
      @after-leave="seen.clear()"
    >
      <div v-if="visible" class="combo-box">
        <img v-if="emoteUrl" ref="emote" :src="emoteUrl" class="combo-emote" :class="{ 'combo-bounce': settings.bounce }" alt="">
        <div class="combo-count">
          x<span ref="number" class="combo-number">{{ count }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
@layer widget {
  .combo {
    display: flex;
    height: 100%;
    padding: 20px;
  }

  .combo-top-left { align-items: flex-start; justify-content: flex-start; }
  .combo-top-right { align-items: flex-start; justify-content: flex-end; }
  .combo-bottom-left { align-items: flex-end; justify-content: flex-start; }
  .combo-bottom-right { align-items: flex-end; justify-content: flex-end; }
  .combo-center { align-items: center; justify-content: center; }

  .combo-box {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 24px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.4);
    backdrop-filter: blur(10px);
  }

  .combo-emote {
    width: auto;
    height: var(--emote-size);
    object-fit: contain;
  }

  .combo-bounce {
    animation: combo-bounce 0.4s ease infinite alternate;
  }

  .combo-count {
    font-size: var(--font-size);
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--text);
    text-shadow: 0 2px 8px rgb(0 0 0 / 0.5);
  }

  .combo-number {
    display: inline-block;
    color: var(--accent);
  }

  @keyframes combo-bounce {
    0% { translate: 0 0; }
    100% { translate: 0 -4px; }
  }
}
</style>
