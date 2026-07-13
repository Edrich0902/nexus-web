export type SportsSlug =
  | 'football'
  | 'tennis'
  | 'rugby'
  | 'golf'
  | 'darts'
  | 'field-hockey'

export interface SportsStatus {
  provider: string
  league_count: number
  event_count: number
  sports: SportsSlug[]
  last_sync: Record<string, string | null>
  last_failed: {
    job: string
    error: string | null
    finished_at: string | null
  } | null
}

export interface SportsEventSummary {
  id: number
  sportsdb_id: number
  sport_slug: SportsSlug | string
  name: string
  league_name: string | null
  event_date: string | null
  event_time: string | null
  status: string | null
  home_team: string | null
  away_team: string | null
  home_badge_url?: string | null
  away_badge_url?: string | null
  league_badge_url?: string | null
  home_score: number | null
  away_score: number | null
  venue?: string | null
  country?: string | null
  thumb_url: string | null
  result_text?: string | null
  is_major: boolean
  series: string | null
}

export interface SportsLeagueSummary {
  id: number
  sportsdb_id: number
  name: string
  badge_url: string | null
  last_synced_at: string | null
}

export interface SportsStandingBlock {
  league_id: number
  league: string | null
  season: string | null
  synced_at: string | null
  rows: Array<Record<string, unknown>>
}

export interface SportsOverview {
  sport: SportsSlug | string
  leagues: SportsLeagueSummary[]
  upcoming: SportsEventSummary[]
  recent: SportsEventSummary[]
  majors: SportsEventSummary[]
  standings: SportsStandingBlock[]
}

export interface SportsFeaturedLane {
  upcoming: SportsEventSummary[]
  recent: SportsEventSummary[]
  next: SportsEventSummary | null
  last: SportsEventSummary | null
}

export interface SportsHomeSnapshot {
  featured?: Record<string, SportsFeaturedLane>
  featured_sports?: SportsSlug[]
  upcoming: SportsEventSummary[]
  recent: SportsEventSummary[]
  next_majors: SportsEventSummary[]
  events_this_week_by_sport: Record<string, number>
  football_table_leaders: Array<{
    league: string | null
    sport_slug: string | null
    season: string | null
    top: Array<{
      team: string | null
      badge?: string | null
      played: number | string | null
      points: number | string | null
      rank: number | string | null
    }>
  }>
  league_count: number
  event_count: number
  last_sync_at: string | null
  computed_at?: string | null
}

export const HOME_FOCUS_SPORTS: SportsSlug[] = ['football', 'rugby', 'golf']


export interface SportsSyncResponse {
  message: string
  type: string
}

export const SPORT_LABELS: Record<SportsSlug, string> = {
  football: 'Football',
  tennis: 'Tennis',
  rugby: 'Rugby',
  golf: 'Golf',
  darts: 'Darts',
  'field-hockey': 'Field Hockey',
}

export const SPORT_ROUTES: SportsSlug[] = [
  'football',
  'tennis',
  'rugby',
  'golf',
  'darts',
  'field-hockey',
]
