export default defineOAuthTwitchEventHandler({
  config: {
    scope: ['moderator:read:followers']
  },
  async onSuccess(event, { user }) {
    await linkAccount(event, {
      provider: 'twitch',
      providerId: user.id,
      login: user.login,
      displayName: user.display_name,
      avatar: user.profile_image_url,
      channel: { twitch: { login: user.login, id: user.id } }
    })
    await subscribeTwitchFollows(user.id)
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('[auth] twitch', error)
    return sendRedirect(event, '/?error=twitch')
  }
})
