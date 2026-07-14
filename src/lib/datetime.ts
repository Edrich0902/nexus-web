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
