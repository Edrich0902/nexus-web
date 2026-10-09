import type { LibraryBook, LibraryBookStatus } from '@/types/library/library'

export const STATUS_LABEL: Record<LibraryBookStatus, string> = {
  want: 'Want to read',
  reading: 'Reading',
  read: 'Read',
}

export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as LibraryBookStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}))

/** "Dune: The Graphic Novel" → title "Dune", accent "The Graphic Novel". */
export function splitBookTitle(title: string): { title: string; accent?: string } {
  const m = /^(.+?):\s+(.+)$/.exec(title)
  return m?.[1] && m[2] ? { title: `${m[1]}:`, accent: m[2] } : { title }
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function readableDate(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d)
}

/** Local calendar date as YYYY-MM-DD (what the API stores for started/finished). */
export function isoDay(value: Date | null = new Date()): string | null {
  if (!value) return null
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function bookAuthors(book: Pick<LibraryBook, 'authors' | 'catalog'>): string {
  return book.authors || book.catalog?.authors_label || book.catalog?.authors?.join(', ') || 'Unknown author'
}
