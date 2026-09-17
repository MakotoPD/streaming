import type { Language } from './define'

export const WIDGET_TEXTS: Record<Language, {
  alerts: Record<'follow' | 'sub' | 'resub' | 'gifts' | 'raid' | 'bits', string> & { anonymous: string, someone: string }
  scene: Record<'starting' | 'brb' | 'ending', [string, string]> & { status: string }
}> = {
  en: {
    alerts: {
      follow: 'just followed!',
      sub: 'just subscribed!{tier}',
      resub: 'subscribed for {months} months!{tier}',
      gifts: 'gifted {count} {count|sub|subs}!{tier}',
      raid: 'is raiding with {count} {count|viewer|viewers}!',
      bits: 'cheered {count} {count|bit|bits}!',
      anonymous: 'Anonymous gifter',
      someone: 'Someone'
    },
    scene: { starting: ['starting', 'soon'], brb: ['be right', 'back'], ending: ['thanks for', 'watching'], status: 'Status' }
  },
  pl: {
    alerts: {
      follow: 'zaczyna obserwować!',
      sub: 'właśnie zasubskrybował!{tier}',
      resub: 'subskrybuje {months}. miesiąc!{tier}',
      gifts: 'podarował {count} {count|subskrypcję|subskrypcje|subskrypcji}!{tier}',
      raid: 'wpada z {count} {count|widzem|widzami|widzami}!',
      bits: 'wysyła {count} {count|bit|bity|bitów}!',
      anonymous: 'Anonimowy Gifter',
      someone: 'Ktoś'
    },
    scene: { starting: ['zaraz', 'startujemy'], brb: ['zaraz', 'wracam'], ending: ['dzięki za', 'dziś'], status: 'Status' }
  },
  es: {
    alerts: {
      follow: '¡empieza a seguir!',
      sub: '¡se acaba de suscribir!{tier}',
      resub: '¡lleva {months} meses suscrito!{tier}',
      gifts: '¡regaló {count} {count|suscripción|suscripciones}!{tier}',
      raid: '¡llega con {count} {count|espectador|espectadores}!',
      bits: '¡envió {count} {count|bit|bits}!',
      anonymous: 'Regalo anónimo',
      someone: 'Alguien'
    },
    scene: { starting: ['empezamos', 'pronto'], brb: ['ahora', 'vuelvo'], ending: ['gracias por', 'ver'], status: 'Estado' }
  },
  de: {
    alerts: {
      follow: 'folgt jetzt!',
      sub: 'hat gerade abonniert!{tier}',
      resub: 'ist seit {months} Monaten dabei!{tier}',
      gifts: 'hat {count} {count|Abo|Abos} verschenkt!{tier}',
      raid: 'raidet mit {count} {count|Zuschauer|Zuschauern}!',
      bits: 'hat {count} {count|Bit|Bits} gecheert!',
      anonymous: 'Anonymer Schenker',
      someone: 'Jemand'
    },
    scene: { starting: ['gleich', 'geht’s los'], brb: ['bin gleich', 'zurück'], ending: ['danke fürs', 'zuschauen'], status: 'Status' }
  },
  ru: {
    alerts: {
      follow: 'теперь отслеживает канал!',
      sub: 'только что подписался!{tier}',
      resub: 'подписан уже {months} мес.!{tier}',
      gifts: 'дарит {count} {count|подписку|подписки|подписок}!{tier}',
      raid: 'врывается с {count} {count|зрителем|зрителями|зрителями}!',
      bits: 'отправляет {count} {count|бит|бита|битов}!',
      anonymous: 'Анонимный даритель',
      someone: 'Кто-то'
    },
    scene: { starting: ['скоро', 'начнём'], brb: ['скоро', 'вернусь'], ending: ['спасибо за', 'просмотр'], status: 'Статус' }
  }
}

export function widgetTexts(language: string) {
  return WIDGET_TEXTS[language as Language] ?? WIDGET_TEXTS.en
}
