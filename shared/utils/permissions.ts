const ALLOWED_ROLES: Record<string, string[]> = {
  subscribers: ['subscriber', 'vip', 'moderator', 'broadcaster'],
  vips: ['vip', 'moderator', 'broadcaster'],
  moderators: ['moderator', 'broadcaster'],
  broadcaster: ['broadcaster']
}

export function hasPermission(roles: readonly string[], permission: string): boolean {
  const allowed = ALLOWED_ROLES[permission]
  return !allowed || roles.some(role => allowed.includes(role))
}
