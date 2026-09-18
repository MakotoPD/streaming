export default defineEventHandler(async (event) => {
  const user = await creatorPanelByToken(event)
  const stream = createEventStream(event)

  const unsubscribe = subscribeUser(user.id, msg => stream.push(JSON.stringify(msg)))
  const releaseDonations = retainDonations(user.id)
  const releaseSubscribers = retainYouTubeSubscribers(user.id)
  const keepAlive = setInterval(() => stream.push({ event: 'ping', data: '' }), 25_000)

  stream.onClosed(async () => {
    clearInterval(keepAlive)
    releaseDonations()
    releaseSubscribers()
    unsubscribe()
    await stream.close()
  })

  return stream.send()
})
