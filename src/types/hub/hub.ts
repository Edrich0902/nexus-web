export interface ImagePalette {
  dominant: string
  vibrant: string
  muted: string
  dark: string
  light: string
  colors: string[]
}

export type NowMoment =
  | 'music'
  | 'race'
  | 'cellar'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'

export interface NowAction {
  label: string
  to: string
  kind: 'primary' | 'secondary'
}

export interface NowPayload {
  moment: NowMoment
  daypart: 'morning' | 'afternoon' | 'evening' | 'night'
  live: boolean
  eyebrow: string
  title: string
  accent: string | null
  lede: string | null
  image: string | null
  palette: ImagePalette | null
  progress: number | null
  subject: { type: string; id: number | string } | null
  actions: NowAction[]
  generated_at: string
}

export type ActivityModule =
  | 'listening'
  | 'cellar'
  | 'beer'
  | 'spirits'
  | 'kitchen'
  | 'library'
  | 'code'

export interface ActivityEvent {
  id: number
  module: ActivityModule
  type: string
  title: string
  body: string | null
  meta: Record<string, unknown>
  subject: { type: string; id: number } | null
  occurred_at: string
}

export interface ActivityPage {
  data: ActivityEvent[]
  next_cursor: string | null
}

export interface SearchItem {
  type: string
  id: number | string
  title: string
  subtitle: string | null
  image: string | null
  owner?: string
  repo?: string
}

export interface SearchGroup {
  key: string
  label: string
  items: SearchItem[]
}

export interface SearchResponse {
  query: string
  groups: SearchGroup[]
}

export interface PaletteResponse {
  status: 'pending' | 'ready' | 'failed'
  palette: ImagePalette | null
}
