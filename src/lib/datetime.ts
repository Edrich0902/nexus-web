/**
 * Global display helpers for API ISO-8601 instants.
 * Uses the browser locale and timezone — no manual offset math.
 */

export function parseInstant(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDateTime(
  value: string | null | undefined,
  fallback = '—',
): string {
  const parsed = parseInstant(value)
  if (!parsed) return fallback
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(
  value: string | null | undefined,
  fallback = '—',
): string {
  const parsed = parseInstant(value)
  if (!parsed) return fallback
  return parsed.toLocaleDateString(undefined, {
    dateStyle: 'medium',
  })
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** "5 minutes ago", "yesterday"; falls back to a date after a month. */
export function relativeTime(value: string | null | undefined): string {
  const parsed = parseInstant(value)
  if (!parsed) return ''
  const diff = (parsed.getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(
  value: string | null | undefined,
  fallback = '—',
): string {
  const parsed = parseInstant(value)
  if (!parsed) return fallback
  return parsed.toLocaleTimeString(undefined, {
    timeStyle: 'short',
  })
}
