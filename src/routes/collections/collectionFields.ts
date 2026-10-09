import type { RouteLocationRaw } from 'vue-router'
import type { AnalysisStatus } from '@/types/analysis/drink-analysis'

export interface CollectionField {
  key: string
  label: string
  /** Right side of the label row. */
  aside?: string
  /** Big display number / short value. */
  value?: string | number
  /** Serif line used instead of `value` for names. */
  title?: string
  sub?: string
  variant: 'solid' | 'tint' | 'outline'
  span: number
  progress?: number | null
  to?: RouteLocationRaw
}

interface DrinkLike {
  id: number
  name: string
  rating: number | null
  analysis_status?: AnalysisStatus
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/**
 * Summary fields for a bottle collection. Averages are computed over the
 * loaded page, so the sub-line says so when the collection is larger.
 */
export function drinkFields<T extends DrinkLike>(opts: {
  items: T[]
  total: number
  countLabel: string
  noun: string
  to: (item: T) => RouteLocationRaw
}): CollectionField[] {
  const { items, total } = opts
  const rated = items.filter((i) => i.rating != null)
  const avg = rated.length ? rated.reduce((sum, i) => sum + (i.rating ?? 0), 0) / rated.length : null
  const analysed = items.filter((i) => i.analysis_status === 'complete').length
  const top = [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
  const partial = total > items.length ? ` · latest ${items.length}` : ''

  return [
    {
      key: 'count',
      label: opts.countLabel,
      value: total,
      sub: items[0] ? `Latest: ${items[0].name}` : undefined,
      variant: 'solid',
      span: 4,
    },
    {
      key: 'avg',
      label: 'Average rating',
      value: avg != null ? avg.toFixed(1) : '—',
      sub: `${rated.length} rated${partial}`,
      variant: 'tint',
      span: 3,
    },
    {
      key: 'analysed',
      label: 'AI notes',
      aside: `of ${items.length}`,
      value: analysed,
      variant: 'outline',
      span: 2,
      progress: items.length ? analysed / items.length : 0,
    },
    top
      ? {
          key: 'top',
          label: 'Top rated',
          title: top.name,
          sub: `★ ${top.rating?.toFixed(1)}`,
          variant: 'tint',
          span: 3,
          to: opts.to(top),
        }
      : {
          key: 'top',
          label: 'Top rated',
          title: `Rate a ${opts.noun} to crown one`,
          variant: 'outline',
          span: 3,
        },
  ]
}
