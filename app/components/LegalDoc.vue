<script setup lang="ts">
const props = defineProps<{ doc: 'privacy' | 'terms' | 'cookies' }>()

const { t, tm, rt, locale } = useI18n()

interface Section { title: unknown, body: unknown[] }

const sections = computed(() => (tm(`legal.${props.doc}.sections`) as Section[]).map(section => ({
  title: rt(section.title as string),
  body: (section.body as string[]).map(paragraph => rt(paragraph))
})))

const updated = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date('2026-09-18')))

useHead({ title: () => t(`legal.${props.doc}.title`) })
useSeoMeta({
  title: () => t(`legal.${props.doc}.title`),
  description: () => t(`legal.${props.doc}.intro`),
  ogTitle: () => t(`legal.${props.doc}.title`),
  ogDescription: () => t(`legal.${props.doc}.intro`)
})
</script>

<template>
  <UContainer class="max-w-3xl py-12 lg:py-16">
    <UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="link" class="-ms-3 mb-4" :label="t('legal.backHome')" />

    <h1 class="text-3xl font-bold tracking-tight text-highlighted lg:text-4xl">
      {{ t(`legal.${doc}.title`) }}
    </h1>
    <p class="mt-3 text-lg text-muted">
      {{ t(`legal.${doc}.intro`) }}
    </p>
    <p class="mt-2 text-sm text-dimmed">
      {{ t('legal.updated', { date: updated }) }}
    </p>

    <div class="mt-10 space-y-10">
      <section v-for="(section, index) in sections" :key="index">
        <h2 class="flex items-baseline gap-3 text-xl font-semibold text-highlighted">
          <span class="text-sm font-mono text-primary">{{ String(index + 1).padStart(2, '0') }}</span>
          {{ section.title }}
        </h2>
        <div class="mt-3 space-y-3 border-s border-default ps-4 text-muted">
          <p v-for="(paragraph, line) in section.body" :key="line">
            {{ paragraph }}
          </p>
        </div>
      </section>
    </div>

    <USeparator class="my-10" />

    <div class="flex flex-wrap gap-2">
      <UButton to="/privacy" :color="doc === 'privacy' ? 'primary' : 'neutral'" variant="subtle" :label="t('nav.privacy')" />
      <UButton to="/terms" :color="doc === 'terms' ? 'primary' : 'neutral'" variant="subtle" :label="t('nav.terms')" />
      <UButton to="/cookies" :color="doc === 'cookies' ? 'primary' : 'neutral'" variant="subtle" :label="t('nav.cookies')" />
    </div>
  </UContainer>
</template>
