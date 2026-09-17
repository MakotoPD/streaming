export default defineEventHandler(async () => {
  const keys = await useStorage('assets:sounds').getKeys()
  return keys
    .filter(key => /\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(key))
    .map(key => ({ name: key.replace(/\.[^.]+$/, ''), url: `/sounds/${encodeURIComponent(key)}` }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
