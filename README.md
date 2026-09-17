# Streaming

Stream widgets for OBS: chat, alerts, emote combo and scene screens. Twitch and Kick, with 7TV, BetterTTV and FFZ emotes.
Every widget gets its own link for an OBS **Browser** source. Changes made in the dashboard show up in OBS live.

Stack: Nuxt 4, Nuxt UI, Tailwind CSS, @nuxtjs/i18n (EN, PL, ES, DE, RU), nuxt-auth-utils, PostgreSQL + Drizzle.

## Running locally

```bash
pnpm install
cp .env.example .env
docker compose -f compose.dev.yml up -d
pnpm dev
```

The app runs at http://localhost:3000. Database migrations run automatically when the server starts.

## Environment variables

| Variable | Description |
|---|---|
| `NUXT_DATABASE_URL` | Postgres URL, locally `postgres://stream:stream@localhost:5432/stream` |
| `NUXT_SESSION_PASSWORD` | At least 32 characters. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NUXT_PUBLIC_SITE_URL` | Public app URL. Must be `https://` in production (Twitch webhooks) |
| `NUXT_OAUTH_TWITCH_CLIENT_ID` / `_SECRET` | App from https://dev.twitch.tv/console/apps, redirect: `<SITE_URL>/auth/twitch` |
| `NUXT_TWITCH_WEBHOOK_SECRET` | Random 10–100 character string, signs EventSub webhooks (follow alerts) |
| `NUXT_OAUTH_KICK_CLIENT_ID` / `_SECRET` | App from https://kick.com/settings/developer, redirect: `<SITE_URL>/auth/kick` |
| `NUXT_UPLOAD_DIR` | Directory for uploaded sounds |
| `POSTGRES_PASSWORD` | `docker-compose.yml` only: database password |

Without Twitch app credentials chat still works, but there are no Twitch badges, no Twitch login and no follow alerts.

## Deploying to Dokploy

1. In Dokploy create a **Compose** service from this repository (`docker-compose.yml`).
2. In **Environment** set the variables from the table above plus `POSTGRES_PASSWORD`.
3. In **Domains** point your domain at the `app` service, port `3000`, with HTTPS.
4. The Twitch and Kick apps must redirect to that domain.

Database data and uploaded sounds live in the `pgdata` and `uploads` volumes.

## Where the data comes from

| Platform | Without login | With login |
|---|---|---|
| Twitch | chat, subs, gifts, raids, bits (anonymous IRC), viewer count | follows, channel point rewards, Hype Train, polls and predictions (EventSub webhooks), follower and sub totals (Helix) |
| Kick | chat, subs, gifts, raids, bans, follows (Pusher), viewer and follower counts | — |
| YouTube | planned | planned |

The overlay connects to Twitch and Kick directly from the OBS browser. The server stores settings, accounts and sounds,
and pushes setting changes and follow alerts over SSE.

Signing in with Twitch stores the OAuth tokens encrypted (AES-256-GCM, key derived from `NUXT_SESSION_PASSWORD`) so the server can read follower and sub totals. Changing `NUXT_SESSION_PASSWORD` invalidates stored tokens; users then reconnect Twitch from the dashboard. When new Twitch permissions are added, the dashboard shows a “Reconnect” button.

EventSub webhooks only work when `NUXT_PUBLIC_SITE_URL` is a public `https://` address, so rewards, Hype Train, polls, predictions and Twitch follows cannot be received on localhost.

Known limitations:
- Widget state (poll votes, counters, giveaway entries, subathon time, goals, leaderboards) is stored in the OBS browser source (localStorage), so it is not shared between computers.
- Kick follows only appear when Kick includes the username in the event.
- Live updates work with a single app instance. For multiple replicas the SSE hub needs to move to Postgres LISTEN/NOTIFY.

## Adding a widget (contributing)

Users only configure widgets; new ones are added through pull requests:

1. `shared/widgets/<type>.ts`: settings fields with defaults, style presets (`presets`), animations, test buttons (`tests`), dashboard control buttons (`actions`), the CSS classes users can target (`cssClasses`) and the CSS generated from the current style (`cssTemplate`).
2. `shared/widgets/index.ts`: add it to `WIDGETS`.
3. `app/components/widget/<Type>.vue`: the component receives `settings` and `bus` (chat, alert and `command` events). Use `useWidgetState` for data that must survive an OBS source reload.
4. `app/pages/o/[token].vue`: register the component in the `COMPONENTS` map.
5. Translations in `i18n/locales/*.json` for all 5 languages, including a `cssClasses.<id>` description for every class (tests check both).

The editor form is generated from the field definitions. Fields with `css` become CSS variables on `.widget-root`.

## Scripts

```bash
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm db:generate
```

`pnpm db:generate` creates a migration after changing `server/db/schema.ts`.
