import type { SportsEventSummary, SportsStandingBlock } from '@/types/sports/sports'

/** TheSportsDB serves resized artwork at /tiny (50px), /small (250px) and /medium (500px). */
export function sizedImage(url: string | null | undefined, size: 'tiny' | 'small' | 'medium'): string | null {
  if (!url) return null
  return `${url.replace(/\/(tiny|small|medium)\/?$/, '')}/${size}`
}

/** National rugby sides arrive as "Ireland Rugby"; the sport is already on screen. */
export function teamLabel(name: string | null | undefined, sport: string): string {
  if (!name) return 'TBC'
  return sport === 'rugby' ? name.replace(/\s+Rugby$/i, '') : name
}

export function hasMatchup(e: SportsEventSummary): boolean {
  return Boolean(e.home_team && e.away_team)
}

export function hasScore(e: SportsEventSummary): boolean {
  return e.home_score != null || e.away_score != null
}

export function eventName(e: SportsEventSummary): string {
  return e.name.replace(/\s{2,}/g, ' ').trim()
}

function isDateOnly(iso: string): boolean {
  return /T00:00:00(\.000)?(Z|\+00:00)$/.test(iso)
}

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

/** "Sat 5 Feb · 20:10", or just the date when the feed has no kick-off time. */
export function eventWhen(e: SportsEventSummary): string {
  const iso = e.starts_at ?? e.event_date
  if (!iso) return 'TBC'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  if (Number.isNaN(d.getTime())) return 'TBC'
  if (iso.length === 10 || isDateOnly(iso)) return dateFmt.format(d)
  return `${dateFmt.format(d)} · ${timeFmt.format(d)}`
}

/** Result text arrives as HTML fragments; keep the lines, drop the markup. */
export function resultLines(raw: string | null | undefined, max = 6): string[] {
  if (!raw) return []
  const html = raw.replace(/<br\s*\/?>/gi, '\n')
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, max)
}

export interface TableRow {
  rank: number
  team: string
  badge: string | null
  played: string
  gd: string
  points: string
  form: string[]
  note: string
}

export function tableRows(block: SportsStandingBlock, limit = 20): TableRow[] {
  const str = (v: unknown, fallback = '—') => (v == null || v === '' ? fallback : String(v))
  return (block.rows ?? []).slice(0, limit).map((row, i) => ({
    rank: Number(row.intRank ?? i + 1),
    team: str(row.strTeam ?? row.name),
    badge: typeof row.strBadge === 'string' ? row.strBadge : null,
    played: str(row.intPlayed),
    gd: str(row.intGoalDifference),
    points: str(row.intPoints),
    form: typeof row.strForm === 'string' ? row.strForm.slice(-5).split('') : [],
    note: typeof row.strDescription === 'string' ? row.strDescription : '',
  }))
}
