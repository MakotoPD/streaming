const SINGLE_WEIGHT = new Set(['Bebas Neue', 'Press Start 2P'])

export function googleFontUrl(font: string | undefined) {
  if (!font) return undefined
  const family = font.replaceAll(' ', '+')
  const weights = SINGLE_WEIGHT.has(font) ? '' : ':wght@400;500;600;700;800'
  return `https://fonts.googleapis.com/css2?family=${family}${weights}&display=swap`
}
