<script setup lang="ts">
import type { Settings } from '#shared/types'
import { SOCIALS, widgetTexts } from '#shared/widgets'

const props = defineProps<{ settings: Settings, bus?: EventBus }>()

const texts = computed(() => widgetTexts(props.settings.language).scene)
const mode = computed(() => props.settings.mode as 'starting' | 'brb' | 'ending')
const title = computed(() => props.settings.title || texts.value[mode.value][0])
const accent = computed(() => props.settings.titleAccent || texts.value[mode.value][1])
const socials = computed(() => SOCIALS.map(name => ({ name, handle: props.settings[`social.${name}`] as string })).filter(s => s.handle))

const now = ref(Date.now())
const clock = setInterval(() => {
  now.value = Date.now()
}, 1000)
onBeforeUnmount(() => clearInterval(clock))

const countdown = computed(() => {
  const value = props.settings.countdownTo as string
  if (!value) return ''
  const [hours, minutes] = value.split(':').map(Number)
  const target = new Date(now.value)
  target.setHours(hours!, minutes!, 0, 0)
  if (now.value - target.getTime() > 6 * 3600_000) target.setDate(target.getDate() + 1)
  const left = Math.max(0, Math.round((target.getTime() - now.value) / 1000))
  const h = Math.floor(left / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
})
</script>

<template>
  <div class="scene" :class="`scene-bg-${settings.background}`">
    <div v-if="settings.background === 'gradient'" class="scene-gradient" />
    <div v-else-if="settings.background === 'orbs'" class="scene-orbs">
      <span /><span /><span />
    </div>
    <LazyWidgetSceneThree v-else-if="settings.background === '3d'" :accent1="settings.accent1" :accent2="settings.accent2" :background="settings.backgroundColor" />

    <div class="scene-ui">
      <div class="scene-top">
        <div v-if="settings.status" class="scene-status">
          <div class="scene-status-label">
            {{ texts.status }}
          </div>
          <div class="scene-status-text">
            {{ settings.status }}
          </div>
        </div>
      </div>

      <Transition :enter-active-class="`anim-in-${settings.animIn}`" appear mode="out-in">
        <div :key="`${title}|${accent}`" class="scene-center">
          <div class="scene-card">
            <h1 class="scene-title" :class="{ 'scene-italic': settings.italic }">
              {{ title }} <span class="scene-accent">{{ accent }}</span>
            </h1>
          </div>
          <div v-if="countdown" class="scene-countdown">
            {{ countdown }}
          </div>
        </div>
      </Transition>

      <div class="scene-socials">
        <div v-for="social in socials" :key="social.name" class="scene-social">
          <UIcon :name="`i-simple-icons-${social.name}`" />
          <span>{{ social.handle }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.scene-bg-gradient,
.scene-bg-orbs,
.scene-bg-3d {
  background: var(--bg);
}

.scene-gradient {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(40% 50% at 20% 30%, color-mix(in srgb, var(--accent-1) 45%, transparent), transparent),
    radial-gradient(45% 55% at 80% 70%, color-mix(in srgb, var(--accent-2) 45%, transparent), transparent);
  animation: scene-drift 18s ease-in-out infinite alternate;
}

.scene-orbs span {
  position: absolute;
  width: 45vmax;
  height: 45vmax;
  border-radius: 50%;
  opacity: 0.45;
  filter: blur(90px);
  will-change: transform;
}

.scene-orbs span:nth-child(1) { top: -10%; left: -5%; background: var(--accent-1); animation: scene-orb-a 22s ease-in-out infinite alternate; }
.scene-orbs span:nth-child(2) { right: -10%; bottom: -15%; background: var(--accent-2); animation: scene-orb-b 26s ease-in-out infinite alternate; }
.scene-orbs span:nth-child(3) { top: 35%; left: 40%; width: 25vmax; height: 25vmax; background: color-mix(in srgb, var(--accent-1) 50%, var(--accent-2)); animation: scene-orb-a 30s ease-in-out infinite alternate-reverse; }

.scene-ui {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 5rem;
}

.scene-top {
  align-self: stretch;
  min-height: 3rem;
}

.scene-status-label {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 25%, transparent);
}

.scene-status-text {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent-1);
}

.scene-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.scene-card {
  position: relative;
  padding: 2.5rem 5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.75rem;
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(12px);
}

.scene-card::before {
  position: absolute;
  inset: -4px;
  z-index: -1;
  border-radius: 0.75rem;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  opacity: 0.25;
  filter: blur(8px);
  content: "";
}

.scene-title {
  margin: 0;
  font-size: var(--title-size);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--text);
  filter: drop-shadow(0 0 30px color-mix(in srgb, var(--accent-1) 50%, transparent));
}

.scene-italic {
  font-style: italic;
}

.scene-accent {
  padding-right: 0.08em;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  background-clip: text;
  color: transparent;
}

.scene-countdown {
  font-size: calc(var(--title-size) * 0.45);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  text-shadow: 0 0 24px color-mix(in srgb, var(--accent-2) 60%, transparent);
}

.scene-socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3rem;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 60%, transparent);
}

.scene-social {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.scene-social > span:first-child {
  width: 1.5rem;
  height: 1.5rem;
}

@keyframes scene-drift {
  to { transform: translate3d(4%, -3%, 0) rotate(8deg); }
}

@keyframes scene-orb-a {
  to { transform: translate3d(30vw, 20vh, 0) scale(1.2); }
}

@keyframes scene-orb-b {
  to { transform: translate3d(-25vw, -25vh, 0) scale(0.85); }
}
</style>
