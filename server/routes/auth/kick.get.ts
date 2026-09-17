export default defineOAuthKickEventHandler({
  async onSuccess(event, { user }) {
    const slug = user.name.toLowerCase().replaceAll('_', '-')
    await linkAccount(event, {
      provider: 'kick',
      providerId: String(user.user_id),
      login: slug,
      displayName: user.name,
      avatar: user.profile_picture,
      channel: { kick: { slug } }
    })
    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('[auth] kick', error)
    return sendRedirect(event, '/?error=kick')
  }
})
