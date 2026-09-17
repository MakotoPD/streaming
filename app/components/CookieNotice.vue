<script setup lang="ts">
const KEY = 'cookie-notice'
const { t } = useI18n()
const open = ref(false)

onMounted(() => {
  try {
    open.value = localStorage.getItem(KEY) !== 'ok'
  }
  catch {
    open.value = false
  }
})

function accept() {
  open.value = false
  try {
    localStorage.setItem(KEY, 'ok')
  }
  catch {
    return
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-200"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div v-if="open" class="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div class="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-default bg-default/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
        <UIcon name="i-lucide-cookie" class="size-5 shrink-0 text-primary" />
        <p class="flex-1 text-sm text-muted">
          {{ t('cookieBanner.text') }}
        </p>
        <div class="flex gap-2">
          <UButton to="/cookies" color="neutral" variant="ghost" size="sm" :label="t('cookieBanner.more')" />
          <UButton size="sm" :label="t('cookieBanner.accept')" @click="accept" />
        </div>
      </div>
    </div>
  </Transition>
</template>
