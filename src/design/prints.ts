import type { RouteLocationRaw } from 'vue-router'
import type { MediaImage } from '@/types/media/media'
import type { IconName } from './icons'
import type { ProfileAxis } from './profile'

/**
 * How artwork sits on the colour panel:
 * - `multiply`: product photo on white; the white drops out into the panel.
 * - `cutout`: transparent PNG standing on the panel.
 * - `cover`: a book cover, floated with a shadow.
 * - `photo`: full-bleed photograph (meals).
 */
export type PrintArtMode = 'multiply' | 'cutout' | 'cover' | 'photo'

/** Everything a fingerprint card shows, mapped from a collection item. */
export interface PrintModel {
  key: string | number
  to: RouteLocationRaw
  title: string
  by?: string | null
  head: { left: string; right?: string | null }
  art: { mode: PrintArtMode; media?: MediaImage | null; src?: string | null; icon: IconName }
  /** Image URL used for the panel colour lookup. */
  paletteUrl: string | null
  /** Panel colour until (or unless) a palette is available. */
  fallbackBg: string
  /** Traits the note filter matches against. */
  notes: string[]
  /** Traits shown on the card; defaults to `notes`. */
  tags?: string[]
  profile?: ProfileAxis[] | null
  /** Shown instead of a profile when there is none (analysing, no photo…). */
  status?: { text: string; tone: 'busy' | 'quiet' | 'error' } | null
  progress?: { step: 1 | 2 | 3; left: string; right?: string | null }
  blurb?: string | null
  facts?: { label: string; value: string }[]
  cooked?: { count: number; note?: string | null }
  foot: { text: string; mono?: boolean; pair?: string | null }
  rating?: number | null
  favourite?: boolean
}
