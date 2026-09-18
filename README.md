# Streaming

Stream widgets for OBS: chat, alerts, emote combo, scene screens and a shared drawing canvas. Twitch and Kick, with 7TV, BetterTTV and FFZ emotes.
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
| `NUXT_UPLOAD_DIR` | Directory for uploaded sounds, images and videos |
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

Built-in alert sounds live in `server/assets/sounds/`. The editor lists whatever is in that folder (`GET /api/sounds/builtin`), so adding a sound only means dropping the file there and redeploying; file names become the labels. They are served from `/sounds/<file>`.

Uploaded images are re-encoded with sharp: GIFs become animated WebP, PNG stays PNG, everything is resized to fit 1024 px and stripped of metadata. Anything that is not a real PNG, WebP or GIF is rejected. Files are served with `X-Content-Type-Options: nosniff` and a `default-src 'none'; sandbox` CSP.

Videos (MP4, WebM, up to 25 MB) are accepted for the drawing canvas and the Library. They are not re-encoded, only sniffed by magic bytes and served with the same headers.

The dashboard has a **Library** page listing uploaded images, videos and sounds with the widgets and fields that use them. Replacing a file keeps its URL (widgets using it reload), and deleting one also clears it from those widgets.

Guest users (nickname only, no linked Twitch or Kick account) expire 48 hours after they are created: `server/plugins/guests.ts` runs every 10 minutes and deletes them with all their widgets. Linking an account before that turns the guest into a normal user. The dashboard shows guests when their widgets will disappear.

Deleting the account (dashboard, bottom of the page, `DELETE /api/me`) removes the user row — widgets, styles, linked accounts and files cascade with it, and uploaded files are removed from disk.

## Donations

The dashboard **Donations** card connects StreamElements (JWT token), Tipply (tip alert widget link, unofficial socket) and Streamlabs (Socket API token). Credentials are verified against the service when saved, stored in `users.donations` (tokens sealed like the Twitch tokens) and never reach the browser.

The server holds one connection per source per user while at least one overlay of that user is open (`retainDonations` in `server/utils/donations.ts`, closed 60 s after the last overlay disconnects) and forwards each donation to the overlays over SSE as an `alert` event of type `donation` (amount, currency, message). Donor e-mails and payment data from the services are dropped. Protocol parsing lives in `server/utils/donation-protocols.ts` and is covered by tests.

Widgets using donations: alerts (own section, minimum amount, message toggle), emote rain trigger, goal bar (amount), leaderboard (top donors), recent events and subathon (seconds per currency unit). StreamElements tips waiting in its moderation queue are skipped.

## Text to speech, tiers and moderation

Text to speech uses [Piper](https://github.com/OHF-Voice/piper1-gpl) running as the `tts` service (`piper/Dockerfile`, HTTP API on port 5000, Polish, English, German, Spanish and Russian voices baked into the image). The app talks to it through `NUXT_PIPER_URL` (`http://tts:5000` in `docker-compose.yml`; locally `docker compose -f compose.dev.yml up -d tts` exposes it on port 5100 because 5000 is often reserved on Windows). Overlays request speech from `POST /api/o/<token>/tts`, which checks the widget token, allows only known voices and 400 characters, caches recent results and limits each widget to 30 new clips per minute.

In the alerts widget the alert sound plays first and the speech starts when it ends, so they never overlap; the alert stays on screen until reading finishes. TTS can be limited to donations and/or bits with a message, from a minimum amount. With the "service voice" option a Tipply donation plays the recordings Tipply sends with it; StreamElements and Streamlabs send none, so Piper reads those. "Skip current alert" in the editor stops the alert and its speech on stream.

Every alert type except follows can have tiers (`<type>.variants`): from an amount, number of months, bits, gifts or raiders, and for subs and gifts optionally a specific tier. The highest matching tier replaces the text, image, sound and colour, and the alert gets `data-variant="<name>"` for custom CSS.

Moderation (`shared/utils/moderation.ts`) applies to names and messages on screen and to TTS: a built-in list of slurs banned on Twitch and Kick in all five languages (toggle), the user's own word list (`word*` also matches longer forms), link removal, and a choice between masking the word and dropping the whole message. Matching ignores case, diacritics, repeated letters, l33t and spaced-out letters.

## Drawing canvas

The `canvas` widget is a 2560x1440 board. Besides the OBS link it has a second, separately generated link (`/c/<editToken>`) that opens a full-screen editor with a floating toolbar: move, pencil, line, square, circle, triangle, arrow, text, fill and eraser, undo/redo, image/GIF/video upload and text formatting (font, size, bold, italic, underline, strikethrough).

- The scene is a list of objects (`shared/canvas.ts`) rendered as one SVG, shared by the editor and the overlay.
- Edits are sent as ops (`put`, `del`, `bg`, `set`) to `POST /api/canvas/<token>/ops`, validated server side, applied to the scene held in memory, flushed to Postgres after 1.5 s and published over SSE, so the OBS source and every other open editor update live.
- Undo and redo are per editor and replace the whole scene, so the last full-scene op wins when two people edit at once.
- The eraser removes whole objects; the fill tool paints a shape (or the background when nothing is clicked).
- Media uploaded from a drawing link is stored under the board owner and marked `images.canvas`. Once such a file is no longer on any board it is deleted from the database and from disk (5 minute grace period, so undo still works).

## Public pages and SEO

`/privacy`, `/terms` and `/cookies` are rendered from `legal.*` in `i18n/locales/*.json` by `app/components/LegalDoc.vue`, so all five languages stay in sync. A cookie notice sits in the default layout and is dismissed into local storage.

`robots.txt`, `sitemap.xml` and `llms.txt` are generated in `server/routes/` from `NUXT_PUBLIC_SITE_URL`. Overlay (`/o/`) and drawing (`/c/`) pages send `noindex`. Titles, description, canonical, Open Graph and Twitter tags come from `app/app.vue`; the share image is `public/og.png`.

Icons in `public/` (`favicon.ico` with 16-256 px frames, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `og.png`) are generated from `public/favicon.webp` and declared in `app/app.vue`.

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
6. If the widget needs a page outside the overlay (like the canvas editor), add it to `PUBLIC_PAGES` in `server/utils/site.ts` only when it should be indexed.

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
