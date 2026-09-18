export default defineNitroPlugin((nitro) => {
  const sweep = () => removeExpiredGuests()
    .then((count) => {
      if (count) console.info(`[guests] removed ${count} expired guest account(s)`)
    })
    .catch(err => console.error('[guests] cleanup failed', err))

  const first = setTimeout(sweep, 30_000)
  const timer = setInterval(sweep, 10 * 60 * 1000)
  nitro.hooks.hook('close', () => {
    clearTimeout(first)
    clearInterval(timer)
  })
})
