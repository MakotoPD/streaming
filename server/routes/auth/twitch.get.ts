export default defineOAuthTwitchEventHandler({
  config: {
    scope: TWITCH_SCOPES
  },
  async onSuccess(event, { user, tokens }) {
    await linkAccount(event, {
      provider: 'twitch',
      providerId: user.id,
      login: user.login,
      displayName: user.display_name,
      avatar: user.profile_image_url,
      channel: { twitch: { login: user.login, id: user.id } },
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scopes: Array.isArray(tokens.scope) ? tokens.scope : String(tokens.scope ?? '').split(' ').filter(Boolean)
      }
    })
    await subscribeTwitchEvents(user.id)
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('[auth] twitch', error)
    return sendRedirect(event, '/?error=twitch')
  }
})
