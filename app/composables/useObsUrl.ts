export function useObsUrl() {
  const { t } = useI18n()
  const toast = useToast()
  const origin = useRequestURL().origin

  const obsUrl = (token: string) => `${origin}/o/${token}`

  async function copyObsUrl(token: string) {
    await navigator.clipboard.writeText(obsUrl(token))
    toast.add({ title: t('dashboard.urlCopied'), description: t('dashboard.urlCopiedHint'), color: 'success', icon: 'i-lucide-check' })
  }

  return { obsUrl, copyObsUrl }
}
