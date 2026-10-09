import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import type {
  F1MeetingSummary,
  F1SessionSummary,
  F1StandingDriver,
} from '@/types/f1/f1'

const FALLBACK_TEAM = '#8a8a8a'

/** OpenF1 sends team colours as bare hex ("00D7B6"). */
export function teamColour(raw: string | null | undefined): string {
  if (!raw) return FALLBACK_TEAM
  const hex = raw.trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : FALLBACK_TEAM
}

/** "Kimi ANTONELLI" → "Kimi Antonelli". */
export function driverName(name: string | null | undefined, fallback = 'Unknown'): string {
  if (!name) return fallback
  return name
    .split(/\s+/)
    .map((w) => (w === w.toUpperCase() && w.length > 1 ? w[0] + w.slice(1).toLowerCase() : w))
    .join(' ')
}

export function surname(name: string | null | undefined): string {
  const full = driverName(name, '')
  return full.split(' ').slice(-1)[0] ?? full
}

/** Team colour per team name, taken from the driver standings. */
export function teamColours(drivers: F1StandingDriver[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const d of drivers) {
    if (d.team_name && d.team_colour && !map.has(d.team_name)) {
      map.set(d.team_name, teamColour(d.team_colour))
    }
  }
  return map
}

export function isTesting(meeting: F1MeetingSummary): boolean {
  return /testing/i.test(meeting.meeting_name)
}

/** Championship rounds only (pre-season testing excluded). */
export function rounds(meetings: F1MeetingSummary[]): F1MeetingSummary[] {
  return meetings.filter((m) => !isTesting(m) && !m.is_cancelled)
}

function ms(value: string | null | undefined): number | null {
  if (!value) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}

export type SessionState = 'done' | 'live' | 'next' | 'upcoming'

/** The session that is live now, or the next one to start. */
export function focusSession(
  sessions: F1SessionSummary[] | undefined,
  now: number,
): F1SessionSummary | null {
  const list = (sessions ?? []).filter((s) => !s.is_cancelled)
  return (
    list.find((s) => {
      const start = ms(s.date_start)
      const end = ms(s.date_end)
      return start !== null && end !== null && start <= now && now < end
    }) ??
    list.find((s) => (ms(s.date_start) ?? 0) > now) ??
    null
  )
}

export function sessionState(
  session: F1SessionSummary,
  focus: F1SessionSummary | null,
  now: number,
): SessionState {
  const start = ms(session.date_start) ?? 0
  const end = ms(session.date_end) ?? start
  if (now >= end) return 'done'
  if (now >= start) return 'live'
  return focus?.session_key === session.session_key ? 'next' : 'upcoming'
}

/** Countdown as serif title + italic accent: "1 day," + "22 hours". */
export function countdown(target: string | null | undefined, now: number): { title: string; accent: string } | null {
  const t = ms(target)
  if (t === null || t <= now) return null
  const mins = Math.floor((t - now) / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const minutes = mins % 60
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  if (days > 0) return { title: `${unit(days, 'day')},`, accent: unit(hours, 'hour') }
  if (hours > 0) return { title: `${unit(hours, 'hour')},`, accent: unit(minutes, 'minute') }
  return { title: 'In', accent: unit(Math.max(1, minutes), 'minute') }
}

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** "Fri 10:30" in the viewer's own timezone. */
export function sessionWhen(value: string | null | undefined): string {
  const t = ms(value)
  if (t === null) return 'TBC'
  const d = new Date(t)
  return `${weekday.format(d)} ${time.format(d)}`
}

/** "Oct 9 – 11" / "9–11 Oct", following the viewer's locale. */
export function meetingDates(meeting: Pick<F1MeetingSummary, 'date_start' | 'date_end'>): string {
  const s = ms(meeting.date_start)
  const e = ms(meeting.date_end)
  if (s === null) return 'TBC'
  if (e === null || e <= s) return dayMonth.format(new Date(s))
  return dayMonth.formatRange(new Date(s), new Date(e))
}

/** "Marina Bay, Singapore" without repeating a city-state's name. */
export function meetingPlace(meeting: Pick<F1MeetingSummary, 'circuit_short_name' | 'location' | 'country_name'>): string {
  const parts = [meeting.circuit_short_name ?? meeting.location, meeting.country_name].filter(
    (p): p is string => Boolean(p),
  )
  return [...new Set(parts)].join(', ')
}

export function meetingState(meeting: F1MeetingSummary, now: number): 'done' | 'live' | 'upcoming' {
  const s = ms(meeting.date_start) ?? 0
  const e = ms(meeting.date_end) ?? s
  if (now >= e) return 'done'
  if (now >= s) return 'live'
  return 'upcoming'
}

/** 91.586 → "1:31.586"; 5812.4 → "1:36:52.400". */
export function lapTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = (seconds % 60).toFixed(3).padStart(6, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${s}`
  return m > 0 ? `${m}:${s}` : s
}

/** OpenF1 durations/gaps are numbers, strings ("+1 LAP") or per-segment arrays (qualifying). */
export function timing(value: unknown, gap = false): string {
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) {
    const parts = value.filter((v) => v != null)
    return parts.length ? parts.map((v) => timing(v, gap)).join(' / ') : '—'
  }
  if (typeof value === 'number') return gap ? `+${value.toFixed(3)}` : lapTime(value)
  return String(value)
}

export function timeOfDay(value: string | null | undefined): string {
  const t = ms(value)
  return t === null ? '—' : time.format(new Date(t))
}

/** "Singapore Grand Prix" → title "Singapore", accent "Grand Prix". */
export function splitMeetingName(name: string): { title: string; accent: string } {
  const gp = name.match(/^(.*?)\s+(Grand Prix)$/i)
  if (gp?.[1]) return { title: gp[1], accent: gp[2] ?? '' }
  const words = name.trim().split(/\s+/)
  if (words.length < 2) return { title: name, accent: '' }
  return { title: words.slice(0, -1).join(' '), accent: words[words.length - 1] ?? '' }
}

/** Where a session's data stands, from the viewer's point of view. */
export function sessionStatus(
  session: F1SessionSummary,
  now: number,
): { label: string; tone: 'ok' | 'live' | 'muted' | 'pending' } {
  if (session.is_cancelled) return { label: 'Cancelled', tone: 'muted' }
  if (session.detail_synced) return { label: 'Results ready', tone: 'ok' }
  const start = ms(session.date_start) ?? 0
  const end = ms(session.date_end) ?? start
  if (now < start) return { label: 'Upcoming', tone: 'muted' }
  if (now < end) return { label: 'Live now', tone: 'live' }
  if (session.historically_available) return { label: 'Ready to sync', tone: 'pending' }
  return { label: 'Processing', tone: 'pending' }
}

/** A clock that ticks every `interval` ms while the component is mounted. */
export function useNow(interval = 30_000): Ref<number> {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    timer = setInterval(() => (now.value = Date.now()), interval)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return now
}
