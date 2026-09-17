interface BadgeSet {
  set_id: string
  versions: { id: string, image_url_2x: string }[]
}

export default defineCachedEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^\d+$/.test(id)) throw createError({ statusCode: 400 })

  const [global, channel] = await Promise.all([
    helix<{ data: BadgeSet[] }>('/chat/badges/global'),
    helix<{ data: BadgeSet[] }>(`/chat/badges?broadcaster_id=${id}`)
  ]).catch(() => [undefined, undefined])

  const badges: Record<string, string> = {}
  for (const set of [...global?.data ?? [], ...channel?.data ?? []]) {
    for (const version of set.versions) badges[`${set.set_id}/${version.id}`] = version.image_url_2x
  }
  return badges
}, { maxAge: 6 * 60 * 60, getKey: event => getRouterParam(event, 'id') ?? '' })
