import type { MeterItem } from '@design/components/NxMeters.vue'
import type { SpotifyArtistRef, SpotifyTrack } from '@/types/spotify/spotify'

const AUDIO_TRAITS = [
  { key: 'energy', label: 'Energy' },
  { key: 'danceability', label: 'Danceability' },
  { key: 'valence', label: 'Mood' },
  { key: 'acousticness', label: 'Acoustic' },
  { key: 'instrumentalness', label: 'Instrumental' },
  { key: 'speechiness', label: 'Spoken word' },
] as const

/** 0–1 audio features (a single track or an average) as meter rows. */
export function audioMeters(source: object | null | undefined): MeterItem[] {
  if (!source) return []
  const values = source as Record<string, unknown>
  return AUDIO_TRAITS.flatMap(({ key, label }) => {
    const v = values[key]
    return typeof v === 'number' ? [{ key, label, value: Math.max(0, Math.min(1, v)) }] : []
  })
}

/**
 * Split a track title into a headline and the italic accent the stage shows,
 * e.g. "Time (You and I)" → "Time" + "(You and I)",
 * "Heroes - 2017 Remaster" → "Heroes" + "2017 Remaster".
 */
export function splitTitle(name: string): { title: string; accent?: string } {
  const paren = /^(.+?)\s*([([][^)\]]+[)\]])\s*$/.exec(name)
  if (paren) return { title: paren[1]!, accent: paren[2] }
  const dash = /^(.+?)\s+[-–]\s+(.+)$/.exec(name)
  if (dash) return { title: dash[1]!, accent: dash[2] }
  return { title: name }
}

export function artistNames(artists: Array<{ name?: string }> | undefined): string {
  return (artists ?? []).map((a) => a.name).filter(Boolean).join(', ') || 'Unknown artist'
}

export function linkedArtists(artists: Array<{ id?: string; name?: string }> | undefined): SpotifyArtistRef[] {
  return (artists ?? []).filter((a): a is SpotifyArtistRef => Boolean(a.id && a.name))
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h) return `${h} hr ${m} min`
  return `${m} min`
}

export function totalDuration(tracks: Pick<SpotifyTrack, 'duration_ms'>[]): string {
  return formatDuration(tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0))
}

export { relativeTime } from '@lib/datetime'

export function releaseYear(date: string | null | undefined): string | null {
  return date ? date.slice(0, 4) : null
}

/** Spotify descriptions arrive HTML-escaped and may contain links; show them as text. */
export function plainText(html: string | null | undefined): string {
  if (!html) return ''
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? ''
}

export function capitalise(value: string | null | undefined): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}
