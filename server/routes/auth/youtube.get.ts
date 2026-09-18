interface ChannelList {
  items?: { id: string, snippet: { title: string, customUrl?: string, thumbnails?: { default?: { url?: string } } } }[]
}

export default defineOAuthGoogleEventHandler({
  config: {
    scope: YOUTUBE_SCOPES,
    authorizationParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' }
  },
  async onSuccess(event, { tokens }) {
    const list = await $fetch<ChannelList>('https://www.googleapis.com/youtube/v3/channels', {
      query: { part: 'snippet', mine: 'true' },
      headers: { authorization: `Bearer ${tokens.access_token}` }
    }).catch(() => undefined)
    const channel = list?.items?.[0]
    if (!channel) return sendRedirect(event, '/?error=youtube_no_channel')

    const handle = channel.snippet.customUrl?.startsWith('@') ? channel.snippet.customUrl : channel.id
    await linkAccount(event, {
      provider: 'youtube',
      providerId: channel.id,
      login: handle,
      displayName: channel.snippet.title,
      avatar: channel.snippet.thumbnails?.default?.url,
      channel: { youtube: { handle, id: channel.id } },
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? '',
        expiresIn: tokens.expires_in,
        scopes: String(tokens.scope ?? '').split(' ').filter(Boolean)
      }
    })
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('[auth] youtube', error)
    return sendRedirect(event, '/?error=youtube')
  }
})
