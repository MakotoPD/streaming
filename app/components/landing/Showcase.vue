<script setup lang="ts">
import { widgetTexts } from '#shared/widgets'

const { t, locale } = useI18n()

const texts = computed(() => widgetTexts(locale.value))
const goalLine = computed(() => texts.value.goal.subs)

const chat = computed(() => [
  { name: 'NightOwl', color: '#22d3ee', text: t('landing.mock.chat1') },
  { name: 'LagMaster', color: '#f472b6', text: t('landing.mock.chat2') },
  { name: 'CozyGamer', color: '#facc15', text: t('landing.mock.chat3') }
])
</script>

<template>
  <div class="scene relative aspect-video w-full overflow-hidden rounded-xl border border-default bg-[#0a0a0f]">
    <div class="absolute inset-0 opacity-70 grid-lines" />

    <div class="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium text-white/70">
      <span class="size-1.5 rounded-full bg-red-500" />
      {{ t('landing.mock.scene') }}
    </div>

    <div class="absolute right-3 top-3 w-[38%] max-w-64 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm alert-pop">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-heart" class="size-4 text-pink-400" />
        <span class="text-[11px] uppercase tracking-wider text-white/50">{{ t('landing.mock.alert') }}</span>
      </div>
      <p class="mt-1 text-sm font-semibold text-white">
        <span class="text-primary">PixelPanda</span> {{ texts.alerts.follow }}
      </p>
    </div>

    <div class="absolute bottom-3 left-3 w-[46%] max-w-72 space-y-1.5">
      <div
        v-for="(line, index) in chat"
        :key="line.name"
        class="chat-line rounded-md bg-black/45 px-2.5 py-1.5 text-xs leading-snug text-white/85"
        :style="{ animationDelay: `${index * 1.2}s` }"
      >
        <span class="font-bold" :style="{ color: line.color }">{{ line.name }}</span>
        <span class="text-white/60">: </span>{{ line.text }}
      </div>
    </div>

    <div class="absolute bottom-3 right-3 w-[38%] max-w-64 rounded-lg bg-black/45 p-2.5">
      <div class="flex items-center justify-between text-[11px] text-white/60">
        <span>{{ goalLine }}</span>
        <span class="font-mono text-white/80">38 / 50</span>
      </div>
      <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div class="goal-fill h-full rounded-full bg-primary" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-lines {
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black, transparent 85%);
}

.chat-line {
  animation: chat-in 6s ease-in-out infinite;
}

.alert-pop {
  animation: alert-in 6s ease-in-out infinite;
}

.goal-fill {
  width: 76%;
  animation: goal-grow 6s ease-in-out infinite;
}

@keyframes chat-in {
  0%, 6% {
    opacity: 0;
    translate: 0 8px;
  }

  14%, 100% {
    opacity: 1;
    translate: 0 0;
  }
}

@keyframes alert-in {
  0%, 10% {
    opacity: 0;
    scale: 0.94;
  }

  20%, 85% {
    opacity: 1;
    scale: 1;
  }

  100% {
    opacity: 0;
    scale: 0.98;
  }
}

@keyframes goal-grow {
  0% {
    width: 62%;
  }

  60%, 100% {
    width: 76%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-line,
  .alert-pop,
  .goal-fill {
    animation: none;
  }
}
</style>
