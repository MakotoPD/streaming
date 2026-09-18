import type { Language } from './define'

interface WidgetTexts {
  alerts: Record<'follow' | 'sub' | 'resub' | 'gifts' | 'raid' | 'bits' | 'donation', string> & { anonymous: string, someone: string }
  scene: Record<'starting' | 'brb' | 'ending', [string, string]> & { status: string }
  poll: { question: string, hint: string, closed: string, votes: string }
  counter: { label: string }
  pinned: { label: string }
  recent: Record<'follow' | 'sub' | 'gifts' | 'raid' | 'bits' | 'donation', string>
  leaderboard: Record<'chatters' | 'gifters' | 'bits' | 'donors', string> & { messages: string, subs: string, bitsUnit: string, empty: string }
  giveaway: { title: string, join: string, entries: string, winner: string, closed: string }
  first: { welcome: string }
  subathon: { title: string, paused: string, ended: string }
  goal: Record<'follows' | 'subs' | 'bits' | 'gifts' | 'donations', string> & { reached: string }
  clock: { uptime: string, offline: string, countdown: string }
  marquee: { welcome: string }
  redemptions: { redeemed: string, points: string }
  hype: { title: string, golden: string, level: string, ended: string, bits: string, sub: string, other: string, idle: string }
  twitchPoll: { votes: string, points: string, users: string, locked: string, winner: string, canceled: string, endsIn: string, ended: string }
  viewers: { label: string, offline: string }
}

export const WIDGET_TEXTS: Record<Language, WidgetTexts> = {
  en: {
    alerts: {
      follow: 'just followed!',
      sub: 'just subscribed!{tier}',
      resub: 'subscribed for {months} months!{tier}',
      gifts: 'gifted {count} {count|sub|subs}!{tier}',
      raid: 'is raiding with {count} {count|viewer|viewers}!',
      bits: 'cheered {count} {count|bit|bits}!',
      donation: 'donated {amount}!',
      anonymous: 'Anonymous gifter',
      someone: 'Someone'
    },
    scene: { starting: ['starting', 'soon'], brb: ['be right', 'back'], ending: ['thanks for', 'watching'], status: 'Status' },
    poll: { question: 'Vote in chat!', hint: 'Type {commands} to vote', closed: 'Voting closed', votes: '{count} {count|vote|votes}' },
    counter: { label: 'Deaths' },
    pinned: { label: 'Pinned' },
    recent: { follow: 'Latest follower', sub: 'Latest sub', gifts: 'Latest gifter', raid: 'Latest raid', bits: 'Latest cheer', donation: 'Latest donation' },
    leaderboard: { chatters: 'Top chatters', gifters: 'Top gifters', bits: 'Top cheerers', donors: 'Top donors', messages: '{count|message|messages}', subs: '{count|sub|subs}', bitsUnit: '{count|bit|bits}', empty: 'Nobody yet' },
    giveaway: { title: 'Giveaway', join: 'Type {keyword} to join', entries: '{count} {count|entry|entries}', winner: 'Winner', closed: 'Entries closed' },
    first: { welcome: 'first message in chat, welcome!' },
    subathon: { title: 'Subathon', paused: 'Paused', ended: 'Ended' },
    goal: { follows: 'Follower goal', subs: 'Sub goal', bits: 'Bits goal', gifts: 'Gift goal', donations: 'Donation goal', reached: 'Goal reached!' },
    clock: { uptime: 'Live for', offline: 'Offline', countdown: 'Starting in' },
    marquee: { welcome: 'Welcome to the stream!' },
    redemptions: { redeemed: 'redeemed {reward}', points: '{count} {count|point|points}' },
    hype: { title: 'Hype Train', golden: 'Golden Kappa Train', level: 'Level {level}', ended: 'Hype Train finished at level {level}!', bits: '{count} bits', sub: 'Tier {tier} sub', other: '{count} points', idle: 'Waiting for the next Hype Train' },
    twitchPoll: { votes: '{count} {count|vote|votes}', points: '{count} {count|point|points}', users: '{count} {count|person|people}', locked: 'Predictions closed', winner: 'Winner', canceled: 'Canceled, points refunded', endsIn: 'Ends in {time}', ended: 'Poll ended' },
    viewers: { label: '{count|viewer|viewers}', offline: 'Offline' }
  },
  pl: {
    alerts: {
      follow: 'zaczyna obserwować!',
      sub: 'właśnie zasubskrybował!{tier}',
      resub: 'subskrybuje {months}. miesiąc!{tier}',
      gifts: 'podarował {count} {count|subskrypcję|subskrypcje|subskrypcji}!{tier}',
      raid: 'wpada z {count} {count|widzem|widzami|widzami}!',
      bits: 'wysyła {count} {count|bit|bity|bitów}!',
      donation: 'wpłaca {amount}!',
      anonymous: 'Anonimowy Gifter',
      someone: 'Ktoś'
    },
    scene: { starting: ['zaraz', 'startujemy'], brb: ['zaraz', 'wracam'], ending: ['dzięki za', 'dziś'], status: 'Status' },
    poll: { question: 'Głosuj na czacie!', hint: 'Wpisz {commands}, żeby zagłosować', closed: 'Głosowanie zakończone', votes: '{count} {count|głos|głosy|głosów}' },
    counter: { label: 'Zgony' },
    pinned: { label: 'Przypięte' },
    recent: { follow: 'Ostatni obserwujący', sub: 'Ostatni sub', gifts: 'Ostatni gifter', raid: 'Ostatni raid', bits: 'Ostatnie bity', donation: 'Ostatni donejt' },
    leaderboard: { chatters: 'Najaktywniejsi na czacie', gifters: 'Top gifterzy', bits: 'Top bity', donors: 'Top donatorzy', messages: '{count|wiadomość|wiadomości|wiadomości}', subs: '{count|sub|suby|subów}', bitsUnit: '{count|bit|bity|bitów}', empty: 'Jeszcze nikogo' },
    giveaway: { title: 'Losowanie', join: 'Wpisz {keyword}, żeby dołączyć', entries: '{count} {count|zgłoszenie|zgłoszenia|zgłoszeń}', winner: 'Zwycięzca', closed: 'Zapisy zamknięte' },
    first: { welcome: 'pierwszy raz na czacie, witaj!' },
    subathon: { title: 'Subathon', paused: 'Pauza', ended: 'Koniec' },
    goal: { follows: 'Cel obserwujących', subs: 'Cel subów', bits: 'Cel bitów', gifts: 'Cel giftów', donations: 'Cel donejtów', reached: 'Cel osiągnięty!' },
    clock: { uptime: 'Na żywo od', offline: 'Offline', countdown: 'Start za' },
    marquee: { welcome: 'Witaj na streamie!' },
    redemptions: { redeemed: 'odbiera {reward}', points: '{count} {count|punkt|punkty|punktów}' },
    hype: { title: 'Hype Train', golden: 'Złoty Hype Train', level: 'Poziom {level}', ended: 'Hype Train zakończony na poziomie {level}!', bits: '{count} bitów', sub: 'sub Tier {tier}', other: '{count} pkt', idle: 'Czekamy na kolejny Hype Train' },
    twitchPoll: { votes: '{count} {count|głos|głosy|głosów}', points: '{count} {count|punkt|punkty|punktów}', users: '{count} {count|osoba|osoby|osób}', locked: 'Przewidywania zamknięte', winner: 'Wygrywa', canceled: 'Anulowane, punkty zwrócone', endsIn: 'Koniec za {time}', ended: 'Ankieta zakończona' },
    viewers: { label: '{count|widz|widzów|widzów}', offline: 'Offline' }
  },
  es: {
    alerts: {
      follow: '¡empieza a seguir!',
      sub: '¡se acaba de suscribir!{tier}',
      resub: '¡lleva {months} meses suscrito!{tier}',
      gifts: '¡regaló {count} {count|suscripción|suscripciones}!{tier}',
      raid: '¡llega con {count} {count|espectador|espectadores}!',
      bits: '¡envió {count} {count|bit|bits}!',
      donation: '¡donó {amount}!',
      anonymous: 'Regalo anónimo',
      someone: 'Alguien'
    },
    scene: { starting: ['empezamos', 'pronto'], brb: ['ahora', 'vuelvo'], ending: ['gracias por', 'ver'], status: 'Estado' },
    poll: { question: '¡Vota en el chat!', hint: 'Escribe {commands} para votar', closed: 'Votación cerrada', votes: '{count} {count|voto|votos}' },
    counter: { label: 'Muertes' },
    pinned: { label: 'Fijado' },
    recent: { follow: 'Último seguidor', sub: 'Último sub', gifts: 'Último regalo', raid: 'Última raid', bits: 'Últimos bits', donation: 'Última donación' },
    leaderboard: { chatters: 'Más activos en el chat', gifters: 'Top regaladores', bits: 'Top bits', donors: 'Top donantes', messages: '{count|mensaje|mensajes}', subs: '{count|suscripción|suscripciones}', bitsUnit: '{count|bit|bits}', empty: 'Nadie todavía' },
    giveaway: { title: 'Sorteo', join: 'Escribe {keyword} para participar', entries: '{count} {count|participante|participantes}', winner: 'Ganador', closed: 'Inscripciones cerradas' },
    first: { welcome: 'primer mensaje en el chat, ¡bienvenido!' },
    subathon: { title: 'Subathon', paused: 'En pausa', ended: 'Terminado' },
    goal: { follows: 'Meta de seguidores', subs: 'Meta de subs', bits: 'Meta de bits', gifts: 'Meta de regalos', donations: 'Meta de donaciones', reached: '¡Meta alcanzada!' },
    clock: { uptime: 'En directo desde hace', offline: 'Desconectado', countdown: 'Empieza en' },
    marquee: { welcome: '¡Bienvenido al directo!' },
    redemptions: { redeemed: 'canjeó {reward}', points: '{count} {count|punto|puntos}' },
    hype: { title: 'Hype Train', golden: 'Hype Train dorado', level: 'Nivel {level}', ended: '¡Hype Train terminado en el nivel {level}!', bits: '{count} bits', sub: 'sub nivel {tier}', other: '{count} puntos', idle: 'Esperando el próximo Hype Train' },
    twitchPoll: { votes: '{count} {count|voto|votos}', points: '{count} {count|punto|puntos}', users: '{count} {count|persona|personas}', locked: 'Predicciones cerradas', winner: 'Ganador', canceled: 'Cancelada, puntos devueltos', endsIn: 'Termina en {time}', ended: 'Encuesta terminada' },
    viewers: { label: '{count|espectador|espectadores}', offline: 'Desconectado' }
  },
  de: {
    alerts: {
      follow: 'folgt jetzt!',
      sub: 'hat gerade abonniert!{tier}',
      resub: 'ist seit {months} Monaten dabei!{tier}',
      gifts: 'hat {count} {count|Abo|Abos} verschenkt!{tier}',
      raid: 'raidet mit {count} {count|Zuschauer|Zuschauern}!',
      bits: 'hat {count} {count|Bit|Bits} gecheert!',
      donation: 'hat {amount} gespendet!',
      anonymous: 'Anonymer Schenker',
      someone: 'Jemand'
    },
    scene: { starting: ['gleich', 'geht’s los'], brb: ['bin gleich', 'zurück'], ending: ['danke fürs', 'zuschauen'], status: 'Status' },
    poll: { question: 'Stimm im Chat ab!', hint: 'Schreib {commands} zum Abstimmen', closed: 'Abstimmung beendet', votes: '{count} {count|Stimme|Stimmen}' },
    counter: { label: 'Tode' },
    pinned: { label: 'Angeheftet' },
    recent: { follow: 'Neuester Follower', sub: 'Neuestes Abo', gifts: 'Neuester Schenker', raid: 'Neuester Raid', bits: 'Neueste Bits', donation: 'Neueste Spende' },
    leaderboard: { chatters: 'Aktivste im Chat', gifters: 'Top-Schenker', bits: 'Top-Bits', donors: 'Top-Spender', messages: '{count|Nachricht|Nachrichten}', subs: '{count|Abo|Abos}', bitsUnit: '{count|Bit|Bits}', empty: 'Noch niemand' },
    giveaway: { title: 'Gewinnspiel', join: 'Schreib {keyword} zum Mitmachen', entries: '{count} {count|Teilnehmer|Teilnehmer}', winner: 'Gewinner', closed: 'Teilnahme geschlossen' },
    first: { welcome: 'erste Nachricht im Chat, willkommen!' },
    subathon: { title: 'Subathon', paused: 'Pausiert', ended: 'Beendet' },
    goal: { follows: 'Follower-Ziel', subs: 'Abo-Ziel', bits: 'Bits-Ziel', gifts: 'Geschenk-Ziel', donations: 'Spendenziel', reached: 'Ziel erreicht!' },
    clock: { uptime: 'Live seit', offline: 'Offline', countdown: 'Start in' },
    marquee: { welcome: 'Willkommen im Stream!' },
    redemptions: { redeemed: 'löst {reward} ein', points: '{count} {count|Punkt|Punkte}' },
    hype: { title: 'Hype Train', golden: 'Goldener Hype Train', level: 'Stufe {level}', ended: 'Hype Train auf Stufe {level} beendet!', bits: '{count} Bits', sub: 'Stufe-{tier}-Abo', other: '{count} Punkte', idle: 'Warten auf den nächsten Hype Train' },
    twitchPoll: { votes: '{count} {count|Stimme|Stimmen}', points: '{count} {count|Punkt|Punkte}', users: '{count} {count|Person|Personen}', locked: 'Vorhersagen geschlossen', winner: 'Gewinner', canceled: 'Abgebrochen, Punkte erstattet', endsIn: 'Endet in {time}', ended: 'Umfrage beendet' },
    viewers: { label: '{count|Zuschauer|Zuschauer}', offline: 'Offline' }
  },
  ru: {
    alerts: {
      follow: 'теперь отслеживает канал!',
      sub: 'только что подписался!{tier}',
      resub: 'подписан уже {months} мес.!{tier}',
      gifts: 'дарит {count} {count|подписку|подписки|подписок}!{tier}',
      raid: 'врывается с {count} {count|зрителем|зрителями|зрителями}!',
      bits: 'отправляет {count} {count|бит|бита|битов}!',
      donation: 'донатит {amount}!',
      anonymous: 'Анонимный даритель',
      someone: 'Кто-то'
    },
    scene: { starting: ['скоро', 'начнём'], brb: ['скоро', 'вернусь'], ending: ['спасибо за', 'просмотр'], status: 'Статус' },
    poll: { question: 'Голосуйте в чате!', hint: 'Напишите {commands}, чтобы проголосовать', closed: 'Голосование завершено', votes: '{count} {count|голос|голоса|голосов}' },
    counter: { label: 'Смерти' },
    pinned: { label: 'Закреплено' },
    recent: { follow: 'Последний фолловер', sub: 'Последний саб', gifts: 'Последний даритель', raid: 'Последний рейд', bits: 'Последние биты', donation: 'Последний донат' },
    leaderboard: { chatters: 'Самые активные в чате', gifters: 'Топ дарителей', bits: 'Топ по битам', donors: 'Топ донатеров', messages: '{count|сообщение|сообщения|сообщений}', subs: '{count|подписка|подписки|подписок}', bitsUnit: '{count|бит|бита|битов}', empty: 'Пока никого' },
    giveaway: { title: 'Розыгрыш', join: 'Напишите {keyword}, чтобы участвовать', entries: '{count} {count|участник|участника|участников}', winner: 'Победитель', closed: 'Запись закрыта' },
    first: { welcome: 'первое сообщение в чате, добро пожаловать!' },
    subathon: { title: 'Сабатон', paused: 'Пауза', ended: 'Завершён' },
    goal: { follows: 'Цель по фолловерам', subs: 'Цель по подпискам', bits: 'Цель по битам', gifts: 'Цель по подаркам', donations: 'Цель по донатам', reached: 'Цель достигнута!' },
    clock: { uptime: 'В эфире', offline: 'Не в сети', countdown: 'Старт через' },
    marquee: { welcome: 'Добро пожаловать на стрим!' },
    redemptions: { redeemed: 'получает {reward}', points: '{count} {count|балл|балла|баллов}' },
    hype: { title: 'Hype Train', golden: 'Золотой Hype Train', level: 'Уровень {level}', ended: 'Hype Train завершён на уровне {level}!', bits: '{count} битов', sub: 'подписка уровня {tier}', other: '{count} очков', idle: 'Ждём следующий Hype Train' },
    twitchPoll: { votes: '{count} {count|голос|голоса|голосов}', points: '{count} {count|балл|балла|баллов}', users: '{count} {count|человек|человека|человек}', locked: 'Прогнозы закрыты', winner: 'Победа', canceled: 'Отменено, баллы возвращены', endsIn: 'До конца {time}', ended: 'Опрос завершён' },
    viewers: { label: '{count|зритель|зрителя|зрителей}', offline: 'Не в сети' }
  }
}

export function widgetTexts(language: string) {
  return WIDGET_TEXTS[language as Language] ?? WIDGET_TEXTS.en
}
