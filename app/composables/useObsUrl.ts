export function useObsUrl() {
  const { t } = useI18n()
  const toast = useToast()
  const origin = useRequestURL().origin

  const obsUrl = (token: string) => `${origin}/o/${token}`
  const panelUrl = (token: string, panel: 'chat' | 'actions') => `${origin}/p/${token}/${panel}`

  async function copyObsUrl(token: string) {
    await navigator.clipboard.writeText(obsUrl(token))
    toast.add({ title: t('dashboard.urlCopied'), description: t('dashboard.urlCopiedHint'), color: 'success', icon: 'i-lucide-check' })
  }

  async function copyPanelUrl(token: string, panel: 'chat' | 'actions') {
    await navigator.clipboard.writeText(panelUrl(token, panel))
    toast.add({ title: t('dashboard.urlCopied'), description: t('dashboard.urlCopiedHint'), color: 'success', icon: 'i-lucide-check' })
  }

  return { obsUrl, panelUrl, copyObsUrl, copyPanelUrl }
}
