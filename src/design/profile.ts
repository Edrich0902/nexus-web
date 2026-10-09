import type { DrinkAnalysis } from '@/types/analysis/drink-analysis'
import type { ImagePalette } from '@/types/hub/hub'
import { luminance, shade } from './color'

/** One spoke of a taste fingerprint: 0–1 plus the word it came from. */
export interface ProfileAxis {
  label: string
  value: number
  word: string
}

type Ladder = [RegExp, number][]

/* Ordered most-specific first; the first match wins. */
const INTENSITY: Ladder = [
  [/\b(none|absent|nil|flat|still|no )/, 0.05],
  [/very (low|light|soft|subtle)|barely|trace/, 0.12],
  [/very (high|full|long|firm|intense)|massive|aggressive|huge|heavy|intense|powerful|explosive/, 0.92],
  [/medium[- ]?(plus|full|high|firm)|moderately high|med\+/, 0.68],
  [/medium[- ]?(minus|light|low|soft)|moderately low|med-/, 0.36],
  [/\b(medium|moderate|balanced|mid|average|integrated)/, 0.5],
  [/\b(high|full|bold|rich|firm|pronounced|strong|lively|effervescent|vibrant|bright|crisp|zesty|sharp|robust|big|grippy|assertive)/, 0.82],
  [/\b(low|light|soft|gentle|subtle|faint|delicate|mild|slight|hint|touch|smooth|silky|round)/, 0.24],
]

const SWEETNESS: Ladder = [
  [/bone[- ]dry/, 0.03],
  [/off[- ]dry|semi[- ]dry|just dry/, 0.3],
  [/very sweet|luscious|syrupy|unctuous|dessert/, 0.92],
  [/medium[- ]sweet|semi[- ]sweet/, 0.6],
  [/\bsweet/, 0.78],
  [/\bdry/, 0.12],
]

const FINISH: Ladder = [
  [/very long|endless|lingering for|extremely long/, 0.95],
  [/medium[- ]long|medium[- ]plus/, 0.68],
  [/medium[- ]short|medium[- ]minus/, 0.38],
  [/\blong|lingering|persistent/, 0.8],
  [/\bshort|brief|quick|clipped|snappy/, 0.26],
  [/\bmedium|moderate/, 0.52],
]

function climb(ladder: Ladder, text: string): number | null {
  for (const [re, value] of ladder) if (re.test(text)) return value
  return null
}

/** The leading descriptor: "medium-plus, well-integrated" → "medium-plus". */
function lead(text: string): string {
  return text.split(/[,;/(]/)[0]!.trim()
}

export function levelOf(
  text: string | null | undefined,
  kind: 'intensity' | 'sweetness' | 'finish' = 'intensity',
): { value: number; word: string } | null {
  if (!text?.trim()) return null
  const t = text.toLowerCase()
  const head = lead(t)
  const ladder = kind === 'sweetness' ? SWEETNESS : kind === 'finish' ? FINISH : INTENSITY
  const value = climb(ladder, head) ?? climb(ladder, t) ?? climb(INTENSITY, t)
  return value == null ? null : { value, word: lead(text) }
}

type Level = { value: number; word: string } | null

function axes(labels: string[], levels: Level[]): ProfileAxis[] | null {
  if (levels.filter(Boolean).length < 3) return null
  return labels.map((label, i) => ({ label, ...(levels[i] ?? { value: 0, word: 'unknown' }) }))
}

export type DrinkKind = 'wine' | 'beer' | 'spirit'

/**
 * Five spokes per drink, from the AI analysis. Returns null when fewer than
 * three can be read, so the card can say "no profile yet" instead of guessing.
 */
export function drinkProfile(
  kind: DrinkKind,
  analysis: DrinkAnalysis | null | undefined,
  extras: { abv?: number | null; ibu?: number | null } = {},
): ProfileAxis[] | null {
  const s = analysis?.sensory
  if (!s) return null
  const body = levelOf(s.body ?? s.mouthfeel)
  const sweet = levelOf(s.sweetness, 'sweetness')
  const finish = levelOf(s.finish, 'finish')

  if (kind === 'wine') {
    return axes(
      ['Body', 'Tannin', 'Acidity', 'Sweetness', 'Finish'],
      [body, levelOf(s.tannin), levelOf(s.acidity), sweet, finish],
    )
  }
  if (kind === 'beer') {
    const ibu = s.bitterness_ibu ?? extras.ibu
    const bitter = ibu != null ? { value: clamp(ibu / 80), word: `${Math.round(ibu)} IBU` } : levelOf(s.bitterness)
    return axes(['Body', 'Bitterness', 'Sweetness', 'Fizz', 'Finish'], [body, bitter, sweet, levelOf(s.carbonation), finish])
  }
  const abv = extras.abv ?? analysis?.identity.abv
  const strength = abv != null ? { value: clamp((abv - 25) / 40), word: `${abv}%` } : null
  return axes(['Body', 'Sweetness', 'Smoke', 'Strength', 'Finish'], [body, sweet, levelOf(s.smoke_peat), strength, finish])
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0.05, v))
}

/** Aroma then palate notes, lower-cased and de-duplicated. */
export function drinkNotes(analysis: DrinkAnalysis | null | undefined): string[] {
  const s = analysis?.sensory
  if (!s) return []
  return [...new Set([...(s.aroma_notes ?? []), ...(s.taste_notes ?? [])].map((n) => n.trim().toLowerCase()).filter(Boolean))]
}

/** Most frequent values across a collection, ties broken by first appearance. */
export function topNotes(lists: string[][], limit = 9): string[] {
  const counts = new Map<string, number>()
  lists.forEach((list) => new Set(list).forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1)))
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([n]) => n)
}

/**
 * The artwork panel colour: a saturated swatch from the image, kept in a
 * mid range so cut-outs and multiplied label photos read on it.
 */
export function panelColour(palette: ImagePalette | null | undefined, fallback: string): string {
  const pick = palette?.vibrant || palette?.muted || palette?.dominant
  if (!pick) return fallback
  const l = luminance(pick)
  if (l == null) return fallback
  if (l > 0.6) return shade(pick, -0.12)
  if (l < 0.03) return shade(pick, 0.25)
  return pick
}
