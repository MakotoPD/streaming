import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { expandParts } from '../app/utils/emotes.ts'
import { ircToEvents, parseIrc, twitchParts } from '../app/utils/twitch-irc.ts'
import { kickParts } from '../app/utils/kick-chat.ts'
import { fillTemplate } from '../shared/utils/template.ts'

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
