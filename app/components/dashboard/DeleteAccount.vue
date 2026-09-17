<script setup lang="ts">
const { t } = useI18n()
const toast = useToast()
const { clear } = useUserSession()

const open = ref(false)
const typed = ref('')
const busy = ref(false)

const word = computed(() => t('account.confirmWord'))
const ready = computed(() => typed.value.trim().toLowerCase() === word.value.toLowerCase())

async function remove() {
  if (!ready.value) return
  busy.value = true
  try {
    await $fetch('/api/me', { method: 'DELETE' })
    await clear()
    clearNuxtData()
    await navigateTo('/')
  }
  catch {
    toast.add({ title: t('account.failed'), color: 'error' })
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <UCard :ui="{ root: 'ring-error/30', body: 'space-y-3' }">
    <template #header>
      <h2 class="font-semibold text-error">
        {{ t('account.title') }}
      </h2>
      <p class="text-sm text-muted">
        {{ t('account.hint') }}
      </p>
    </template>

    <UModal v-model:open="open" :title="t('account.title')" :description="t('account.warning')">
      <UButton icon="i-lucide-user-x" color="error" variant="subtle" :label="t('account.delete')" />

      <template #body>
        <div class="space-y-4">
          <UAlert icon="i-lucide-triangle-alert" color="error" variant="subtle" :title="t('account.warning')" :description="t('account.warningList')" />
          <UFormField :label="t('account.confirmLabel', { word })" name="confirm">
            <UInput v-model="typed" autofocus class="w-full" :placeholder="word" @keydown.enter="remove" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" :label="t('account.cancel')" @click="open = false" />
          <UButton color="error" icon="i-lucide-trash-2" :disabled="!ready" :loading="busy" :label="t('account.delete')" @click="remove" />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
