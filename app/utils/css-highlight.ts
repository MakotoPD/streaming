export type CssTokenType = 'comment' | 'string' | 'selector' | 'property' | 'punct' | 'color' | 'variable' | 'number' | 'function' | 'value' | 'text'

export interface CssToken {
  type: CssTokenType
  text: string
  start: number
}

export const CSS_COLOR = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{3,4}\b|(?:rgba?|hsla?)\([^()]*\)/iy

const COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y
const STRING = /"[^"\n]*"?|'[^'\n]*'?/y
const PROPERTY = /-{0,2}[a-z][\w-]*(?=\s*:)/iy
const VARIABLE = /--[\w-]+/y
const FUNCTION = /[a-z][\w-]*(?=\()/iy
const NUMBER = /-?(?:\d*\.)?\d+(?:[a-z]+|%)?/iy
const SELECTOR = /[^{};/"']+/y
const WORD = /[^\s{};:(),/"'#-]+|\s+|./y

export function tokenizeCss(code: string): CssToken[] {
  const tokens: CssToken[] = []
  let index = 0
  let depth = 0
  let inValue = false

  const take = (regex: RegExp) => {
    regex.lastIndex = index
    return regex.exec(code)?.[0]
  }

  const push = (type: CssTokenType, text: string) => {
    const last = tokens.at(-1)
    if (last && last.type === type && type !== 'color') last.text += text
    else tokens.push({ type, text, start: index })
    index += text.length
  }

  while (index < code.length) {
    const char = code[index]!
    let match: string | undefined

    if ((match = take(COMMENT)) && code.startsWith('/*', index)) push('comment', match)
    else if (char === '"' || char === '\'') push('string', take(STRING)!)
    else if (char === '{') {
      depth++
      inValue = false
      push('punct', char)
    }
    else if (char === '}') {
      depth = Math.max(0, depth - 1)
      inValue = false
      push('punct', char)
    }
    else if (char === ';') {
      inValue = false
      push('punct', char)
    }
    else if (inValue) {
      if ((match = take(CSS_COLOR))) push('color', match)
      else if ((match = take(VARIABLE))) push('variable', match)
      else if ((match = take(FUNCTION))) push('function', match)
      else if ((match = take(NUMBER))) push('number', match)
      else push('value', take(WORD)!)
    }
    else if (depth > 0 && (match = take(PROPERTY))) push('property', match)
    else if (depth > 0 && char === ':') {
      inValue = true
      push('punct', char)
    }
    else if (depth === 0 && (match = take(SELECTOR))) push('selector', match)
    else push('text', take(WORD)!)
  }

  return tokens
}
