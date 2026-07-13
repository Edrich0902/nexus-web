import http from '@lib/http'
import type {
  SportsHomeSnapshot,
  SportsOverview,
  SportsStatus,
  SportsSyncResponse,
} from '@/types/sports/sports'

const BASE = '/api/v1/sports'

export async function getStatus(): Promise<SportsStatus> {
  const { data } = await http.get<SportsStatus>(`${BASE}/status`)
  return data
}

export async function sync(type = 'all'): Promise<SportsSyncResponse> {
  const { data } = await http.post<SportsSyncResponse>(`${BASE}/sync`, { type })
  return data
}

export async function getHome(): Promise<SportsHomeSnapshot> {
  const { data } = await http.get<SportsHomeSnapshot>(`${BASE}/home`)
  return data
}

export async function getSportOverview(sport: string): Promise<SportsOverview> {
  const { data } = await http.get<SportsOverview>(`${BASE}/${sport}`)
  return data
}
