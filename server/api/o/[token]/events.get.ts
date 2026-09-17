export default defineEventHandler(async (event) => {
  const { widget } = await widgetByToken(event)
  const stream = createEventStream(event)

  const unsubscribe = subscribeUser(widget.userId, (msg) => {
    if (msg.widgetId && msg.widgetId !== widget.id) return
    stream.push(JSON.stringify(msg))
  })
  const keepAlive = setInterval(() => stream.push({ event: 'ping', data: '' }), 25_000)

  stream.onClosed(async () => {
    clearInterval(keepAlive)
    unsubscribe()
    await stream.close()
  })

  return stream.send()
})
