export interface Track {
  title: string
  artist: string
  album: string
  cover: string
}

const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

function text(value: unknown, max = 200) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

export function lastfmTrack(body: unknown): Track | null {
  const tracks = (body as any)?.recenttracks?.track
  const track = Array.isArray(tracks) ? tracks[0] : tracks
  if (!track || track['@attr']?.nowplaying !== 'true') return null
  const images: { '#text'?: string, size?: string }[] = Array.isArray(track.image) ? track.image : []
  const cover = [...images].reverse().find(image => image['#text'])?.['#text'] ?? ''
  return {
    title: text(track.name),
    artist: text(track.artist?.['#text'] ?? track.artist?.name),
    album: text(track.album?.['#text']),
    cover: cover.startsWith('https://') && !cover.includes(LASTFM_PLACEHOLDER) ? cover : ''
  }
}

export function listenBrainzTrack(body: unknown): Track | null {
  const listen = (body as any)?.payload?.listens?.[0]
  const meta = listen?.track_metadata
  if (!meta?.track_name) return null
  const release = meta.mbid_mapping?.caa_release_mbid ?? meta.additional_info?.release_mbid
  return {
    title: text(meta.track_name),
    artist: text(meta.artist_name),
    album: text(meta.release_name),
    cover: typeof release === 'string' && /^[\da-f-]{36}$/.test(release) ? `https://coverartarchive.org/release/${release}/front-250` : ''
  }
}
