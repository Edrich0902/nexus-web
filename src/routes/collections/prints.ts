import { mediaDeliveryUrl } from '@lib/media'
import { drinkNotes, drinkProfile, type DrinkKind } from '@design/profile'
import type { PrintModel } from '@design/prints'
import type { MediaImage } from '@/types/media/media'
import type { DrinkAnalysisFields } from '@/types/analysis/drink-analysis'
import type { CellarWine } from '@/types/food-drink/cellar'
import type { BeerBeer } from '@/types/food-drink/beer'
import type { SpiritSpirit } from '@/types/food-drink/spirits'
import type { KitchenRecipe } from '@/types/food-drink/kitchen'
import type { LibraryBook } from '@/types/library/library'
import { STATUS_LABEL, bookAuthors } from '@routes/library/library'

const thisYear = new Date().getFullYear()
const shortFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const longFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function parseDay(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "12 Sep", or "12 Sep 2024" outside the current year. */
function day(value: string | null | undefined): string | null {
  const d = parseDay(value)
  if (!d) return null
  return (d.getFullYear() === thisYear ? shortFmt : longFmt).format(d)
}

function daysBetween(from: string | null | undefined, to: string | null | undefined = null): number | null {
  const a = parseDay(from)
  const b = to ? parseDay(to) : new Date()
  if (!a || !b) return null
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1)
}

function joined(...parts: (string | number | null | undefined)[]): string {
  return parts.filter((p) => p != null && p !== '').join(' · ')
}

function paletteUrl(media: MediaImage | null | undefined, src: string | null | undefined): string | null {
  return mediaDeliveryUrl(media, 'thumb') ?? src ?? null
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/* ── Drinks ─────────────────────────────────────────────── */

type Drink = DrinkAnalysisFields & { media?: MediaImage | null; image_url?: string | null }

function drinkInsight(kind: DrinkKind, item: Drink, extras: { abv?: number | null; ibu?: number | null } = {}) {
  const profile = drinkProfile(kind, item.ai_analysis, extras)
  const hasArt = Boolean(item.media || item.image_url)
  let status: PrintModel['status'] = null
  let blurb: string | null = null
  if (!profile) {
    if (item.analysis_status === 'pending') status = { text: 'Reading the label…', tone: 'busy' }
    else if (item.analysis_status === 'failed') status = { text: 'Couldn’t read this label', tone: 'error' }
    else if (item.ai_analysis?.narrative.tasting_notes) blurb = item.ai_analysis.narrative.tasting_notes
    else if (!hasArt) status = { text: 'Add a label photo for a taste profile', tone: 'quiet' }
    else status = { text: 'No taste profile yet', tone: 'quiet' }
  }
  return { profile, status, blurb, notes: drinkNotes(item.ai_analysis) }
}

const WINE_BG: [RegExp, string][] = [
  [/ros[eé]|blush/i, '#d98a86'],
  [/sparkling|champagne|cap classique|cava|prosecco/i, '#cdb777'],
  [/white|blanc|chardonnay/i, '#c9b06a'],
  [/dessert|fortified|port|sherry|noble/i, '#a8641f'],
  [/orange|skin/i, '#c7752e'],
]

export function winePrint(w: CellarWine): PrintModel {
  const tastings = w.tastings_count ?? 0
  return {
    key: w.id,
    to: { name: 'cellar-wine', params: { wineId: w.id } },
    title: w.name,
    by: w.producer_name,
    head: { left: joined(w.wine_type, w.region_name ?? w.country), right: w.vintage ? String(w.vintage) : 'NV' },
    art: { mode: 'multiply', media: w.media, src: w.image_url, icon: 'wine' },
    paletteUrl: paletteUrl(w.media, w.image_url),
    fallbackBg: WINE_BG.find(([re]) => re.test(w.wine_type ?? ''))?.[1] ?? '#7a1f2e',
    ...drinkInsight('wine', w),
    foot: { text: tastings ? plural(tastings, 'tasting') : 'Not tasted yet', mono: true },
    rating: w.rating,
  }
}

const BEER_BG: [RegExp, string][] = [
  [/stout|porter|black|schwarz/i, '#4a2c1c'],
  [/sour|gose|lambic|berliner|fruit/i, '#b8475e'],
  [/ipa|pale ale|apa|amber|red/i, '#b8661b'],
  [/wheat|weiss|wit|hefe/i, '#e0b13a'],
]

export function beerPrint(b: BeerBeer): PrintModel {
  const style = b.style?.name ?? null
  return {
    key: b.id,
    to: { name: 'beer-detail', params: { beerId: b.id } },
    title: b.name,
    by: b.brewery?.name,
    head: {
      left: joined(style, b.brewery?.city ?? b.brewery?.country),
      right: b.abv != null ? `${b.abv.toFixed(1)}% ABV` : null,
    },
    art: { mode: 'cutout', media: b.media, src: b.image_url, icon: 'beer' },
    paletteUrl: paletteUrl(b.media, b.image_url),
    fallbackBg: BEER_BG.find(([re]) => re.test(`${style ?? ''} ${b.style?.family ?? ''}`))?.[1] ?? '#d39a17',
    ...drinkInsight('beer', b, { ibu: b.ibu }),
    foot: { text: joined(b.created_at ? `Logged ${day(b.created_at)}` : null, b.format), mono: true },
    rating: b.rating,
  }
}

const SPIRIT_BG: [RegExp, string][] = [
  [/gin/i, '#4f7f7a'],
  [/rum/i, '#7a3b1c'],
  [/brandy|cognac|armagnac/i, '#8a4520'],
  [/tequila|mezcal|agave/i, '#8d9a4e'],
  [/vodka/i, '#6f7f99'],
  [/liqueur|amaro|cream/i, '#8a3a5c'],
  [/whisk|bourbon|scotch|rye/i, '#a8641f'],
]

export function spiritPrint(s: SpiritSpirit): PrintModel {
  return {
    key: s.id,
    to: { name: 'spirit-detail', params: { spiritId: s.id } },
    title: s.name,
    by: s.producer,
    head: {
      left: joined(s.category, s.region ?? s.country),
      right: joined(s.age_statement, s.abv != null ? `${s.abv}%` : null) || null,
    },
    art: { mode: 'multiply', media: s.media, src: s.image_url, icon: 'spirits' },
    paletteUrl: paletteUrl(s.media, s.image_url),
    fallbackBg: SPIRIT_BG.find(([re]) => re.test(s.category ?? ''))?.[1] ?? '#c8743a',
    ...drinkInsight('spirit', s, { abv: s.abv }),
    foot: { text: s.created_at ? `Added ${day(s.created_at)}` : 'On the shelf', mono: true },
    rating: s.rating,
  }
}

/* ── Books ──────────────────────────────────────────────── */

/** First paragraph of an Open Library description, without markdown links. */
function firstParagraph(text: string | null | undefined): string | null {
  if (!text) return null
  const para = text
    .split(/\n\s*\n|-{3,}/)[0]!
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return para || null
}

export function bookAuthorList(b: LibraryBook): string[] {
  const list = b.catalog?.authors?.length ? b.catalog.authors : (b.authors ?? '').split(/\s*(?:,|&|\band\b)\s*/)
  return [...new Set(list.map((a) => a.trim()).filter(Boolean))]
}

export function bookPrint(b: LibraryBook): PrintModel {
  const pages = b.catalog?.page_count
  let progress: NonNullable<PrintModel['progress']>
  let foot: string
  if (b.status === 'reading') {
    const days = daysBetween(b.started_at)
    progress = { step: 2, left: days ? `Reading · day ${days}` : 'Reading' }
    foot = b.started_at ? `Started ${day(b.started_at)}` : 'Reading now'
  } else if (b.status === 'read') {
    const days = b.started_at && b.finished_at ? daysBetween(b.started_at, b.finished_at) : null
    progress = { step: 3, left: days ? `Read in ${plural(days, 'day')}` : 'Read' }
    foot = b.finished_at ? `Finished ${day(b.finished_at)}` : 'Finished'
  } else {
    progress = { step: 1, left: 'Not started' }
    foot = b.created_at ? `Added ${day(b.created_at)}` : 'On the wishlist'
  }
  progress.right = pages ? `${pages} pages` : null

  return {
    key: b.id,
    to: { name: 'library-book', params: { bookId: b.id } },
    title: b.title,
    by: bookAuthors(b),
    head: { left: STATUS_LABEL[b.status], right: b.catalog?.publish_year ? String(b.catalog.publish_year) : null },
    art: { mode: 'cover', media: b.media, src: b.image_url, icon: 'library' },
    paletteUrl: paletteUrl(b.media, b.image_url),
    fallbackBg: '#3e4a6e',
    notes: bookAuthorList(b),
    tags: [],
    progress,
    blurb: firstParagraph(b.catalog?.description),
    foot: { text: foot },
    rating: b.rating,
  }
}

/* ── Recipes ────────────────────────────────────────────── */

export function recipePrint(r: KitchenRecipe, pair: string | null = null): PrintModel {
  const meal = r.meal
  const traits = [meal?.category, meal?.area, ...(meal?.tags ?? [])]
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t))
  const notes = [...new Set(traits)]
  const extraTags = notes.filter((t) => t !== meal?.category && t !== meal?.area)
  const src = r.image_url ?? meal?.thumb_url ?? null

  return {
    key: r.id,
    to: { name: 'kitchen-recipe', params: { recipeId: r.id } },
    title: meal?.name ?? 'Recipe',
    by: r.notes?.split('\n')[0] || null,
    head: { left: joined(meal?.area, meal?.category) },
    art: { mode: 'photo', media: r.media, src, icon: 'kitchen' },
    paletteUrl: paletteUrl(r.media, src),
    fallbackBg: '#4f6b47',
    notes,
    tags: extraTags.length ? extraTags : notes,
    facts: [
      { label: 'Ingredients', value: meal?.ingredients.length ? String(meal.ingredients.length) : '—' },
      { label: 'Cooked', value: `${r.cooked_count}×` },
      { label: 'Last cooked', value: day(r.last_cooked_on) ?? 'Not yet' },
    ],
    cooked: { count: r.cooked_count, note: r.cooked_count > 6 ? `+${r.cooked_count - 6} more` : null },
    foot: {
      pair,
      text: r.is_favourite ? 'A favourite' : r.created_at ? `Saved ${day(r.created_at)}` : 'Saved',
    },
    rating: r.rating,
    favourite: r.is_favourite,
  }
}
