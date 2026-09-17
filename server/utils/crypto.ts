import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function key() {
  return createHash('sha256').update(`token-seal:${useRuntimeConfig().session.password}`).digest()
}

export function seal(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}

export function unseal(value: string | null | undefined) {
  if (!value) return undefined
  try {
    const data = Buffer.from(value, 'base64url')
    const decipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12))
    decipher.setAuthTag(data.subarray(12, 28))
    return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8')
  }
  catch {
    return undefined
  }
}
