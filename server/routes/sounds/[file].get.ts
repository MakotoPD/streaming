const TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  m4a: 'audio/mp4',
  aac: 'audio/aac'
}

export default defineEventHandler(async (event) => {
  const file = decodeURIComponent(getRouterParam(event, 'file') ?? '')
  const type = TYPES[file.split('.').pop()?.toLowerCase() ?? '']
  if (!type || file.includes('/') || file.includes(':')) throw createError({ statusCode: 404 })

  const data = await useStorage('assets:sounds').getItemRaw<Buffer>(file)
  if (!data) throw createError({ statusCode: 404 })

  setHeaders(event, {
    'Content-Type': type,
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff'
  })
  return data
})
