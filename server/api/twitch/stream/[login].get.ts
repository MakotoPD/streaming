export default defineCachedEventHandler(async (event) => {
  const login = (getRouterParam(event, 'login') ?? '').toLowerCase()
  if (!/^\w{3,25}$/.test(login)) throw createError({ statusCode: 400 })
  const res = await helix<{ data: { started_at: string }[] }>(`/streams?user_login=${login}`).catch(() => undefined)
  return { startedAt: res?.data[0]?.started_at ?? null }
}, { maxAge: 60, getKey: event => (getRouterParam(event, 'login') ?? '').toLowerCase() })
