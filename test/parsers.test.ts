import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { expandParts } from '../app/utils/emotes.ts'
import { ircToEvents, parseIrc, twitchParts, twitchRoles } from '../app/utils/twitch-irc.ts'
import { kickParts, kickRoles } from '../app/utils/kick-chat.ts'
import { hasPermission } from '../shared/utils/permissions.ts'
import { eventSubToStreamEvent } from '../server/utils/eventsub.ts'
import { donationToAlert, parseSocketIoPacket, streamElementsChannel, streamElementsDonation, streamlabsDonations, tipplyDonation, tipplyId } from '../server/utils/donation-protocols.ts'
import { fillTemplate } from '../shared/utils/template.ts'
import { filterText, speakable } from '../shared/utils/moderation.ts'
import { lastfmTrack, listenBrainzTrack } from '../server/utils/now-playing.ts'
import { formatColor, parseColor } from '../app/utils/color.ts'
import { tokenizeCss } from '../app/utils/css-highlight.ts'
import { applyOps, canvasPath, sanitizeOps, sanitizeScene } from '../shared/canvas.ts'

test('parseIrc reads tags, command and trailing text', () => {
  const msg = parseIrc('@badges=subscriber/36;color=#FF69B4;display-name=Tester;emotes=25:0-4;id=abc;user-id=1\\s2 :tester!tester@tester.tmi.twitch.tv PRIVMSG #chan :Kappa hello')
  assert.equal(msg.command, 'PRIVMSG')
  assert.deepEqual(msg.params, ['#chan'])
  assert.equal(msg.trailing, 'Kappa hello')
  assert.equal(msg.tags['user-id'], '1 2')
})

test('twitchParts splits native emotes by code points', () => {
  const parts = twitchParts('😀 LUL x', '425618:2-4')
  assert.deepEqual(parts.map(p => p.type), ['text', 'emote', 'text'])
  assert.equal((parts[1] as { name: string }).name, 'LUL')
})

test('gift bomb produces one alert', () => {
  const bomb = parseIrc('@msg-id=submysterygift;msg-param-mass-gift-count=5;display-name=Gifter;login=gifter;msg-param-sub-plan=1000 :tmi.twitch.tv USERNOTICE #chan')
  const single = parseIrc('@msg-id=subgift;msg-param-community-gift-id=123;display-name=Gifter;login=gifter :tmi.twitch.tv USERNOTICE #chan')
  assert.deepEqual(ircToEvents(bomb, () => undefined).map(e => e.kind === 'alert' && e.count), [5])
  assert.equal(ircToEvents(single, () => undefined).length, 0)
})

test('kickParts turns emote tags into emotes', () => {
  const parts = kickParts('hi [emote:37226:KEKW]!')
  assert.deepEqual(parts, [
    { type: 'text', text: 'hi ' },
    { type: 'emote', name: 'KEKW', url: 'https://files.kick.com/emotes/37226/fullsize' },
    { type: 'text', text: '!' }
  ])
})

test('expandParts adds 7TV emotes and stacks zero-width ones', () => {
  const emotes: Record<string, { url: string, zeroWidth: boolean }> = {
    OMEGALUL: { url: 'a', zeroWidth: false },
    RainTime: { url: 'b', zeroWidth: true }
  }
  const parts = expandParts([{ type: 'text', text: 'lol OMEGALUL RainTime end' }], name => emotes[name])
  assert.deepEqual(parts, [
    { type: 'text', text: 'lol ' },
    { type: 'emote', name: 'OMEGALUL', url: 'a', layers: ['b'] },
    { type: 'text', text: ' end' }
  ])
})

test('fillTemplate uses language plural rules', () => {
  const pl = '{count} {count|subskrypcję|subskrypcje|subskrypcji}'
  assert.equal(fillTemplate(pl, { count: 1 }, 'pl'), '1 subskrypcję')
  assert.equal(fillTemplate(pl, { count: 3 }, 'pl'), '3 subskrypcje')
  assert.equal(fillTemplate(pl, { count: 25 }, 'pl'), '25 subskrypcji')
  assert.equal(fillTemplate('{count|sub|subs}', { count: 2 }, 'en'), 'subs')
  assert.equal(fillTemplate('{count|подписку|подписки|подписок}', { count: 21 }, 'ru'), 'подписку')
  assert.equal(fillTemplate('{name}{tier}!', { name: 'A', tier: '' }, 'en'), 'A!')
})

test('all locales have the same keys', () => {
  const keys = (obj: object, prefix = ''): string[] => Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])
  const dir = new URL('../i18n/locales/', import.meta.url)
  const [base, ...rest] = readdirSync(dir).map(file => ({ file, keys: keys(JSON.parse(readFileSync(new URL(file, dir), 'utf8'))).sort() }))
  for (const locale of rest) assert.deepEqual(locale.keys, base!.keys, locale.file)
})

test('every CSS class in widget definitions has a description', () => {
  const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'))
  const dir = new URL('../shared/widgets/', import.meta.url)
  const ids = readdirSync(dir).flatMap(file => [...readFileSync(new URL(file, dir), 'utf8').matchAll(/id: '(\w+)', selector/g)].map(m => m[1]))
  assert.ok(ids.length > 0)
  assert.deepEqual(ids.filter(id => !en.cssClasses[id!]), [])
})

test('parseColor and formatColor round-trip hex, rgb, rgba and hsl', () => {
  assert.equal(formatColor(parseColor('#22D3EE')!, 'hex'), '#22d3ee')
  assert.equal(formatColor(parseColor('#fff8')!, 'hex'), '#ffffff88')
  const rgba = parseColor('rgba(18, 18, 26, 0.82)')!
  assert.deepEqual([rgba.r, rgba.g, rgba.b, rgba.a, rgba.format, rgba.hasAlpha], [18, 18, 26, 0.82, 'rgb', true])
  assert.equal(formatColor(rgba, 'rgb', rgba.hasAlpha), 'rgba(18, 18, 26, 0.82)')
  assert.equal(formatColor(parseColor('rgb(255 0 0 / 50%)')!, 'rgb'), 'rgba(255, 0, 0, 0.5)')
  const hsl = parseColor('hsl(270, 91%, 65%)')!
  assert.equal(formatColor(hsl, 'hsl'), 'hsl(270, 91%, 65%)')
  assert.equal(formatColor({ ...hsl, a: 0.4 }, 'hsl'), 'hsla(270, 91%, 65%, 0.4)')
  assert.equal(parseColor('transparent'), undefined)
})

test('tokenizeCss keeps the source intact and finds colors', () => {
  const code = [
    '/* hi */',
    '.chat-message[data-platform="kick"] {',
    '  background: rgba(18, 18, 26, 0.82);',
    '  color: #fff;',
    '  font-family: "Outfit", sans-serif;',
    '  border-radius: 12px;',
    '  gap: var(--gap)',
    '}',
    '@media (max-width: 400px) { .a { color: hsl(0, 0%, 50%) } }'
  ].join('\n')
  const tokens = tokenizeCss(code)
  assert.equal(tokens.map(t => t.text).join(''), code)
  for (const token of tokens) assert.equal(code.slice(token.start, token.start + token.text.length), token.text)
  assert.deepEqual(tokens.filter(t => t.type === 'color').map(t => t.text), ['rgba(18, 18, 26, 0.82)', '#fff', 'hsl(0, 0%, 50%)'])
  assert.ok(tokens.some(t => t.type === 'property' && t.text === 'border-radius'))
  assert.ok(tokens.some(t => t.type === 'number' && t.text === '12px'))
  assert.ok(tokens.some(t => t.type === 'variable' && t.text === '--gap'))
})

test('chat roles and permissions', () => {
  assert.deepEqual(twitchRoles({ badges: 'vip/1,subscriber/12', mod: '0' }).sort(), ['subscriber', 'vip'])
  assert.deepEqual(twitchRoles({ badges: 'founder/0', mod: '1' }).sort(), ['moderator', 'subscriber'])
  assert.deepEqual(kickRoles([{ type: 'og' }, { type: 'moderator' }, { type: 'verified' }]).sort(), ['moderator', 'subscriber'])
  assert.equal(hasPermission([], 'everyone'), true)
  assert.equal(hasPermission(['subscriber'], 'subscribers'), true)
  assert.equal(hasPermission(['subscriber'], 'moderators'), false)
  assert.equal(hasPermission(['broadcaster'], 'moderators'), true)
  assert.equal(hasPermission(['vip'], 'broadcaster'), false)
})

test('twitch chat flags first message, highlight and bits', () => {
  const msg = parseIrc('@badges=;display-name=New;first-msg=1;msg-id=highlighted-message;bits=100;id=x;user-id=5 :new!new@new.tmi.twitch.tv PRIVMSG #chan :hello cheer100')
  const [chat, bits] = ircToEvents(msg, () => undefined)
  assert.ok(chat?.kind === 'chat' && chat.firstMessage && chat.highlighted && chat.bits === 100)
  assert.ok(bits?.kind === 'alert' && bits.type === 'bits')
})

test('eventSubToStreamEvent maps Twitch EventSub payloads', () => {
  assert.deepEqual(eventSubToStreamEvent('channel.channel_points_custom_reward_redemption.add', { id: 'r1', user_name: 'Viewer', user_input: 'hi', reward: { title: 'Hydrate', cost: 500, prompt: '' } }),
    { kind: 'redemption', platform: 'twitch', id: 'r1', name: 'Viewer', input: 'hi', reward: { title: 'Hydrate', cost: 500, prompt: '' } })
  const hype = eventSubToStreamEvent('channel.hype_train.progress', { level: 3, total: 5000, progress: 400, goal: 1800, type: 'golden_kappa', expires_at: 'x', top_contributions: [{ user_name: 'A', type: 'bits', total: 1000 }] })
  assert.ok(hype?.kind === 'hypetrain' && hype.phase === 'progress' && hype.golden && hype.level === 3 && hype.contributors[0]?.name === 'A')
  const poll = eventSubToStreamEvent('channel.poll.end', { id: 'p', title: 'Q', status: 'completed', choices: [{ id: 'a', title: 'Yes', votes: 7 }] })
  assert.ok(poll?.kind === 'twitch-poll' && poll.phase === 'end' && poll.choices[0]?.votes === 7)
  const prediction = eventSubToStreamEvent('channel.prediction.lock', { id: 'x', title: 'T', outcomes: [{ id: 'o', title: 'Yes', color: 'blue', users: 2, channel_points: 900 }] })
  assert.ok(prediction?.kind === 'prediction' && prediction.phase === 'lock' && prediction.outcomes[0]?.points === 900)
  assert.deepEqual(eventSubToStreamEvent('channel.follow', { user_name: 'F' }), { kind: 'alert', type: 'follow', platform: 'twitch', name: 'F' })
  assert.equal(eventSubToStreamEvent('channel.ban', {}), undefined)
})

test('canvas ops apply, upsert and delete', () => {
  const stroke = { id: 'a1', kind: 'draw', shape: 'pencil', points: [0, 0, 10, 10], stroke: '#fff', width: 4, fill: 'none' } as const
  const scene = applyOps({ background: '', objects: [] }, [{ t: 'put', o: { ...stroke } }])
  assert.equal(scene.objects.length, 1)
  const moved = applyOps(scene, [{ t: 'put', o: { ...stroke, points: [5, 5, 20, 20] } }])
  assert.equal(moved.objects.length, 1)
  assert.deepEqual(moved.objects[0]!.kind === 'draw' && moved.objects[0]!.points, [5, 5, 20, 20])
  assert.equal(scene.objects[0]!.kind === 'draw' && scene.objects[0]!.points[0], 0)
  assert.equal(applyOps(moved, [{ t: 'del', ids: ['a1'] }]).objects.length, 0)
  assert.equal(applyOps(moved, [{ t: 'bg', color: '#000' }]).background, '#000')
})

test('canvas sanitizing drops junk and foreign media urls', () => {
  const scene = sanitizeScene({
    background: 'javascript:alert(1)',
    objects: [
      { id: 'ok', kind: 'media', x: 0, y: 0, w: 100, h: 100, url: '/api/images/2b0a1e7c-0000-4000-8000-00000000abcd/file', video: true },
      { id: 'bad', kind: 'media', x: 0, y: 0, w: 100, h: 100, url: 'https://evil.example/x.png' },
      { id: 'weird', kind: 'draw', shape: 'spiral', points: [1, 2] }
    ]
  })
  assert.equal(scene.background, '')
  assert.deepEqual(scene.objects.map(object => object.id), ['ok'])
  assert.deepEqual(sanitizeOps([{ t: 'del', ids: ['a', 5] }, { t: 'nope' }]), [{ t: 'del', ids: ['a'] }])
})

test('canvas paths close shapes and point the arrow head', () => {
  const base = { id: 'x', kind: 'draw', points: [0, 0, 100, 50], stroke: '#fff', width: 4, fill: 'none' } as const
  assert.equal(canvasPath({ ...base, shape: 'rect' }), 'M 0 0 H 100 V 50 H 0 Z')
  assert.equal(canvasPath({ ...base, shape: 'line' }), 'M 0 0 L 100 50')
  assert.ok(canvasPath({ ...base, shape: 'arrow' }).split('M').length === 3)
  assert.equal(canvasPath({ ...base, shape: 'pencil', points: [0, 0, 5, 5, 9, 9] }), 'M 0 0 L 5 5 L 9 9')
})

test('socket.io packets from Tipply and Streamlabs', () => {
  assert.deepEqual(parseSocketIoPacket('0{"sid":"x","pingInterval":25000}'), { kind: 'open', pingInterval: 25000 })
  assert.deepEqual(parseSocketIoPacket('40/abc123,'), { kind: 'connect', namespace: '/abc123' })
  assert.deepEqual(parseSocketIoPacket('44/abc123,"Invalid namespace"'), { kind: 'error', namespace: '/abc123', reason: 'Invalid namespace' })
  assert.deepEqual(parseSocketIoPacket('44"Authentication error"'), { kind: 'error', namespace: '', reason: 'Authentication error' })
  const event = parseSocketIoPacket('42/abc123,["alert",{"id":"t1","nickname":"Ania","amount":1550,"email":"a@b.pl","message":"hej"}]')
  assert.ok(event.kind === 'event' && event.name === 'alert')
  const donation = tipplyDonation(event.kind === 'event' ? event.payload : null)
  assert.deepEqual(donation, { id: 't1', name: 'Ania', amount: 15.5, currency: 'PLN', message: 'hej' })
  assert.ok(!JSON.stringify(donationToAlert(donation!, 'tipply')).includes('a@b.pl'))
})

test('donation payloads from StreamElements and Streamlabs', () => {
  const tip = { _id: 'se1', status: 'success', approved: 'allowed', donation: { user: { username: 'Bob', email: 'x@y.z' }, amount: 4.2, currency: 'usd', message: '' } }
  assert.deepEqual(streamElementsDonation(tip), { id: 'se1', name: 'Bob', amount: 4.2, currency: 'USD', message: '' })
  assert.equal(streamElementsDonation({ ...tip, approved: 'pending' }), undefined)
  assert.deepEqual(streamlabsDonations({ type: 'donation', message: [{ _id: 's1', name: 'Eve', amount: '13.37', currency: 'EUR', message: 'gg' }] }).map(d => d.amount), [13.37])
  assert.deepEqual(streamlabsDonations({ type: 'follow', for: 'twitch_account', message: [{}] }), [])
  const jwt = `x.${Buffer.from(JSON.stringify({ channel: '5ad23dcc18fff500d78c5348' })).toString('base64url')}.y`
  assert.equal(streamElementsChannel(jwt), '5ad23dcc18fff500d78c5348')
  assert.equal(streamElementsChannel('garbage'), undefined)
  assert.equal(tipplyId('https://widgets.tipply.pl/TIP_ALERT/7f3c9a1e-aaaa-bbbb'), '7f3c9a1e-aaaa-bbbb')
  assert.equal(tipplyId('https://evil.example/x y'), undefined)
})

test('moderation masks slurs, custom words, spaced letters and links', () => {
  assert.equal(filterText('you are a n1gg3r lol', { slurs: true }).text, 'you are a *** lol')
  assert.equal(filterText('ty p e d a l e', { slurs: true }).text, 'ty *** *** *** *** *** ***')
  assert.equal(filterText('Niger is a country near Nigeria', { slurs: false }).flagged, false)
  assert.equal(filterText('idioci wszędzie', { banned: ['idio*'] }).text, '*** wszędzie')
  assert.equal(filterText('Żółw', { banned: ['zolw'] }).text, '***')
  assert.equal(filterText('wbij na example.com/x teraz', { links: true }).text, 'wbij na *** teraz')
  assert.equal(filterText('good game', { slurs: true, links: true }).flagged, false)
  assert.equal(speakable('hej *** tam'), 'hej tam')
})

test('now playing parses Last.fm and ListenBrainz', () => {
  const lastfm = { recenttracks: { track: [{ name: 'Midnight City', artist: { '#text': 'M83' }, album: { '#text': 'Hurry Up' }, image: [{ '#text': 'https://lastfm.freetls.fastly.net/i/u/34s/a.jpg', size: 'small' }, { '#text': 'https://lastfm.freetls.fastly.net/i/u/300x300/a.jpg', size: 'extralarge' }], '@attr': { nowplaying: 'true' } }] } }
  assert.deepEqual(lastfmTrack(lastfm), { title: 'Midnight City', artist: 'M83', album: 'Hurry Up', cover: 'https://lastfm.freetls.fastly.net/i/u/300x300/a.jpg' })
  assert.equal(lastfmTrack({ recenttracks: { track: [{ name: 'Old', artist: { '#text': 'X' } }] } }), null)
  const lb = { payload: { listens: [{ track_metadata: { track_name: 'Some Resolve', artist_name: 'Röyksopp', release_name: 'The Understanding', additional_info: { release_mbid: 'f1418001-7f1e-46af-bfdb-95faeded8841' } } }], playing_now: true } }
  assert.equal(listenBrainzTrack(lb)?.cover, 'https://coverartarchive.org/release/f1418001-7f1e-46af-bfdb-95faeded8841/front-250')
  assert.equal(listenBrainzTrack({ payload: { listens: [], playing_now: true } }), null)
})
