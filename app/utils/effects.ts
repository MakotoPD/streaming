const popAnimations = new WeakMap<Element, Animation>()

export function popElement(el: Element | null | undefined, scale: number, rotate: number, duration = 180) {
  if (!el) return
  popAnimations.get(el)?.cancel()
  popAnimations.set(el, el.animate([
    { scale: 1, rotate: '0deg', easing: 'cubic-bezier(.2,.8,.3,1)' },
    { scale, rotate: `${rotate}deg`, easing: 'cubic-bezier(.4,0,.5,1)', offset: 0.45 },
    { scale: 1, rotate: '0deg' }
  ], { duration, easing: 'linear' }))
}

export function playSound(url: string | undefined, volume: number) {
  if (!url) return
  const audio = new Audio(url)
  audio.volume = Math.min(1, Math.max(0, volume / 100))
  audio.play().catch(err => console.warn('[widget] audio', err))
}
