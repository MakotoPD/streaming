import { eq } from 'drizzle-orm'
import type { DonationCredentials, DonationSource } from '#shared/types'
import {
  donationToAlert,
  parseSocketIoPacket,
  streamElementsDonation,
  streamlabsDonations,
  tipplyDonation,
  type Donation
} from './donation-protocols'

export type DonationStatus = 'connecting' | 'connected' | 'error'

interface Handlers {
  ready: () => void
  fail: (reason: string) => void
  donation: (donation: Donation) => void
  closed: () => void
}

interface Secrets {
  streamelements?: { token: string, channel: string }
  tipply?: { id: string }
  streamlabs?: { token: string }
}

function socketIo(url: string, namespace: string, event: string, parse: (payload: unknown) => Donation[], handlers: Handlers) {
  const ws = new WebSocket(url)
  let ping: ReturnType<typeof setInterval> | undefined

  ws.onmessage = ({ data }) => {
    const packet = parseSocketIoPacket(String(data))
    if (packet.kind === 'open') {
      ping = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('2'), packet.pingInterval)
      if (namespace) ws.send(`40${namespace},`)
    }
    else if (packet.kind === 'connect' && packet.namespace === namespace) handlers.ready()
    else if (packet.kind === 'error' && (packet.namespace === namespace || !packet.namespace)) {
      handlers.fail(packet.reason)
      ws.close()
    }
    else if (packet.kind === 'event' && packet.namespace === namespace && packet.name === event) parse(packet.payload).forEach(handlers.donation)
  }
  ws.onclose = () => {
    clearInterval(ping)
    handlers.closed()
  }
  ws.onerror = () => undefined
  return () => ws.close()
}

function streamElements(token: string, channel: string, handlers: Handlers) {
  const ws = new WebSocket('wss://astro.streamelements.com/')
  ws.onmessage = ({ data }) => {
    let msg: Record<string, any>
    try {
      msg = JSON.parse(String(data))
    }
    catch {
      return
    }
    if (msg.type === 'welcome') {
      ws.send(JSON.stringify({ type: 'subscribe', nonce: 'tips', data: { topic: 'channel.tips', room: channel, token, token_type: 'jwt' } }))
    }
    else if (msg.type === 'response' && msg.nonce === 'tips') {
      if (msg.error) {
        handlers.fail(msg.error)
        ws.close()
      }
      else handlers.ready()
    }
    else if (msg.type === 'message' && msg.topic === 'channel.tips') {
      const donation = streamElementsDonation(msg.data)
      if (donation) handlers.donation(donation)
    }
    else if (msg.type === 'reconnect') ws.close()
  }
  ws.onclose = () => handlers.closed()
  ws.onerror = () => undefined
  return () => ws.close()
}

function connect(source: DonationSource, secrets: Secrets, handlers: Handlers) {
  if (source === 'streamelements' && secrets.streamelements) {
    return streamElements(secrets.streamelements.token, secrets.streamelements.channel, handlers)
  }
  if (source === 'tipply' && secrets.tipply) {
    return socketIo('wss://alert-ws.tipply.pl/socket.io/?EIO=3&transport=websocket', `/${secrets.tipply.id}`, 'alert', payload => [tipplyDonation(payload)].filter(donation => !!donation), handlers)
  }
  if (source === 'streamlabs' && secrets.streamlabs) {
    return socketIo(`wss://sockets.streamlabs.com/socket.io/?EIO=3&transport=websocket&token=${encodeURIComponent(secrets.streamlabs.token)}`, '', 'event', streamlabsDonations, handlers)
  }
}

export function verifyDonationSource(source: DonationSource, secrets: Secrets): Promise<'ok' | string> {
  return new Promise((resolve) => {
    let close: (() => void) | undefined
    const finish = (result: string) => {
      clearTimeout(timer)
      close?.()
      resolve(result)
    }
    const timer = setTimeout(() => finish('timeout'), 8000)
    close = connect(source, secrets, {
      ready: () => finish('ok'),
      fail: reason => finish(reason || 'unauthorized'),
      donation: () => undefined,
      closed: () => finish('closed')
    })
  })
}

export function unsealDonations(stored: DonationCredentials): Secrets {
  const secrets: Secrets = {}
  const se = stored.streamelements && unseal(stored.streamelements.token)
  if (se && stored.streamelements) secrets.streamelements = { token: se, channel: stored.streamelements.channel }
  if (stored.tipply) secrets.tipply = { id: stored.tipply.id }
  const sl = stored.streamlabs && unseal(stored.streamlabs.token)
  if (sl) secrets.streamlabs = { token: sl }
  return secrets
}

interface Session {
  listeners: number
  stops: (() => void)[]
  status: Partial<Record<DonationSource, DonationStatus>>
  seen: string[]
  idle?: ReturnType<typeof setTimeout>
}

const sessions = new Map<string, Session>()

function start(userId: string, session: Session, secrets: Secrets) {
  for (const source of Object.keys(secrets) as DonationSource[]) {
    let attempt = 0
    let stopped = false
    let rejected = false
    let close: (() => void) | undefined
    let retry: ReturnType<typeof setTimeout> | undefined

    const open = () => {
      session.status[source] = 'connecting'
      close = connect(source, secrets, {
        ready: () => {
          attempt = 0
          session.status[source] = 'connected'
        },
        fail: (reason) => {
          rejected = true
          session.status[source] = 'error'
          console.warn(`[donations] ${source} rejected: ${reason}`)
        },
        donation: (donation) => {
          const key = `${source}:${donation.id}`
          if (session.seen.includes(key)) return
          session.seen = [...session.seen.slice(-199), key]
          publishToUser(userId, { kind: 'event', event: donationToAlert(donation, source) })
        },
        closed: () => {
          if (stopped || rejected) return
          session.status[source] = 'connecting'
          retry = setTimeout(open, Math.min(60_000, 2000 * 2 ** attempt++))
        }
      })
    }

    open()
    session.stops.push(() => {
      stopped = true
      clearTimeout(retry)
      close?.()
    })
  }
}

async function loadSecrets(userId: string) {
  const [user] = await useDb().select({ donations: tables.users.donations }).from(tables.users).where(eq(tables.users.id, userId))
  return unsealDonations(user?.donations ?? {})
}

function stop(session: Session) {
  session.stops.forEach(fn => fn())
  session.stops = []
  session.status = {}
}

export function retainDonations(userId: string) {
  let session = sessions.get(userId)
  if (session) {
    clearTimeout(session.idle)
    session.listeners++
  }
  else {
    session = { listeners: 1, stops: [], status: {}, seen: [] }
    sessions.set(userId, session)
    const created = session
    loadSecrets(userId)
      .then(secrets => sessions.get(userId) === created && start(userId, created, secrets))
      .catch(err => console.error('[donations] load failed', err))
  }

  const current = session
  let released = false
  return () => {
    if (released) return
    released = true
    current.listeners--
    if (current.listeners > 0) return
    current.idle = setTimeout(() => {
      if (current.listeners > 0) return
      stop(current)
      sessions.delete(userId)
    }, 60_000)
  }
}

export async function restartDonations(userId: string) {
  const session = sessions.get(userId)
  if (!session) return
  stop(session)
  start(userId, session, await loadSecrets(userId))
}

export function donationStatus(userId: string) {
  return sessions.get(userId)?.status ?? {}
}
