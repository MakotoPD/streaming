export const PUBLIC_PAGES = ['/', '/privacy', '/terms', '/cookies']

export function siteUrl() {
  return useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
}
