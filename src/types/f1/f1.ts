export type F1MeetingSummary = {
  meeting_key: number
  meeting_name: string
  meeting_official_name?: string | null
  circuit_short_name?: string | null
  circuit_image?: string | null
  circuit_type?: string | null
  country_name?: string | null
  country_flag?: string | null
  location?: string | null
  gmt_offset?: string | null
  date_start?: string | null
  date_end?: string | null
  is_cancelled?: boolean
  year: number
  sessions?: F1SessionSummary[]
}

export type F1SessionSummary = {
  session_key: number
  meeting_key: number
  session_name: string
  session_type?: string | null
  date_start?: string | null
  date_end?: string | null
  is_cancelled?: boolean
  detail_synced?: boolean
  replay_status?: string | null
  historically_available?: boolean
  year: number
}

export type F1Driver = {
  driver_number: number
  broadcast_name?: string | null
  full_name?: string | null
  name_acronym?: string | null
  team_name?: string | null
  team_colour?: string | null
  headshot_url?: string | null
}

export type F1StandingDriver = {
  driver_number: number
  position: number | null
  position_start?: number | null
  points: number | null
  points_start?: number | null
  name?: string | null
  team_name?: string | null
  team_colour?: string | null
  name_acronym?: string | null
  headshot_url?: string | null
}

export type F1StandingTeam = {
  team_name: string
  position: number | null
  position_start?: number | null
  points: number | null
  points_start?: number | null
}

export type F1HomeSnapshot = {
  year: number
  next_meeting: F1MeetingSummary | null
  last_meeting: F1MeetingSummary | null
  standings_drivers_top: F1StandingDriver[]
  standings_teams_top: F1StandingTeam[]
  meeting_count: number
  session_count: number
  last_sync_at?: string | null
  live_tracking: boolean
  note?: string
  computed_at?: string
}

export type F1Status = {
  provider: string
  year: number
  meeting_count: number
  session_count: number
  detail_pending: number
  last_ok_by_job: Record<string, string | null | undefined>
  last_failed: { job: string; error: string | null; finished_at: string | null } | null
  live_tracking: boolean
  rate_limit?: Record<string, number>
}

export type F1Season = {
  year: number
  meetings: F1MeetingSummary[]
}

export type F1Standings = {
  year: number
  session_key: number | null
  drivers: F1StandingDriver[]
  teams: F1StandingTeam[]
}

export type F1SessionDetail = {
  session: F1SessionSummary
  meeting: F1MeetingSummary | null
  detail_synced: boolean
  detail_available: boolean
  replay_status?: string | null
  drivers: F1Driver[]
  results: Array<{
    driver_number: number
    position: number | null
    duration: unknown
    gap_to_leader: unknown
    number_of_laps: number | null
    dnf: boolean
    dns: boolean
    dsq: boolean
  }>
  starting_grid: Array<{
    driver_number: number
    position: number | null
    lap_duration: number | null
  }>
}

export type F1Analysis = {
  session_key: number
  detail_synced: boolean
  detail_available: boolean
  laps: Array<Record<string, unknown>>
  pits: Array<Record<string, unknown>>
  stints: Array<Record<string, unknown>>
  positions: Array<{ driver_number: number; date: string | null; position: number }>
  race_control: Array<Record<string, unknown>>
  weather: Array<Record<string, unknown>>
  overtakes: Array<Record<string, unknown>>
}

export type F1ReplayStatus = {
  session_key: number
  status: string
  error?: string | null
  available?: boolean
  synced_at?: string | null
  message?: string
  partial?: boolean
  location_count?: number
}

export type F1ReplayPayload = {
  session_key: number
  status: string
  message?: string | null
  partial?: boolean
  drivers: F1Driver[]
  location: Array<{
    driver_number: number
    date: string | null
    x: number
    y: number
    z: number | null
  }>
  bounds: { min_x: number; max_x: number; min_y: number; max_y: number } | null
  car_data: {
    status: string
    driver_number: number
    sample_count: number
    samples?: Array<{
      date: string | null
      speed: number | null
      rpm: number | null
      n_gear: number | null
      throttle: number | null
      brake: number | null
      drs: number | null
    }>
  } | null
  hz?: number
}

export type F1SyncResponse = {
  message: string
  type: string
  year?: number | null
}

export const F1_ACCENT = 'var(--sport-f1)'
