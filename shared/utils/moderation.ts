const LEET: Record<string, string> = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'i' }

const SLURS = [
  'niger', 'nigers', 'niga', 'nigas', 'nigah', 'nigerz', 'nigaz', 'fag', 'fags', 'fagot*', 'fagit*', 'retard*', 'trany*', 'tranie*',
  'chink*', 'spic', 'spics', 'kike*', 'wetback*', 'gok', 'goks', 'dyke*', 'raghead*', 'sandnig*', 'beaner*',
  'pedal*', 'pedzio*', 'ciot*', 'cwel*', 'czarnuch*', 'ciapat*', 'zydzi*', 'zydowa*', 'pedziu*',
  'kanake*', 'schwuchtel*', 'neger*', 'kanacke*',
  'maricon*', 'marica*', 'sudaca*', 'negrata*', 'mariquit*',
  'пидор*', 'пидар*', 'педик*', 'хач', 'хачи', 'хачей', 'чурка*', 'чурок', 'жид', 'жиды', 'жидов*', 'ниггер*', 'нигер*', 'хохол', 'хохлы', 'хохлов', 'кацап*'
]

export interface ModerationOptions {
  banned?: string[]
  slurs?: boolean
  links?: boolean
}

export function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split('')
    .map(char => LEET[char] ?? char)
    .join('')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .replace(/(.)\1+/gu, '$1')
}

function compile(list: string[]) {
  return list.flatMap((entry) => {
    const prefix = entry.trim().endsWith('*')
    const stem = normalizeWord(entry.replace(/\*$/, ''))
    return stem ? [{ stem, prefix }] : []
  })
}

const SLUR_RULES = compile(SLURS)
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|pl|net|org|tv|gg|ru|de|es|io|xyz|ly|me|co|app|link|click)\b\S*/giu

export function filterText(text: string, options: ModerationOptions): { text: string, flagged: boolean } {
  const rules = [...(options.slurs ? SLUR_RULES : []), ...compile(options.banned ?? [])]
  let flagged = false
  let result = text

  if (options.links) {
    result = result.replace(LINK, () => {
      flagged = true
      return '***'
    })
  }
  if (!rules.length) return { text: result, flagged }

  const matches = (word: string) => {
    const normalized = normalizeWord(word)
    return !!normalized && rules.some(rule => (rule.prefix ? normalized.startsWith(rule.stem) : normalized === rule.stem))
  }

  const tokens = result.split(/(\s+)/)
  const words = tokens.map((token, index) => ({ token, index })).filter(item => item.token.trim())
  const masked = new Set<number>()

  for (const item of words) {
    if (matches(item.token)) masked.add(item.index)
  }

  let run: number[] = []
  const flush = () => {
    if (run.length >= 3 && matches(run.map(index => tokens[index]).join(''))) run.forEach(index => masked.add(index))
    run = []
  }
  for (const item of words) {
    if (normalizeWord(item.token).length === 1) run.push(item.index)
    else flush()
  }
  flush()

  if (masked.size) flagged = true
  for (const index of masked) tokens[index] = '***'
  return { text: tokens.join(''), flagged }
}

export function speakable(text: string) {
  return text.replace(/\*{3}/g, ' ').replace(/\s+/g, ' ').trim()
}
