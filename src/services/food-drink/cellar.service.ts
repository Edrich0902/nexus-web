import http from '@lib/http'
import type {
  CellarWine,
  CellarWineTasting,
  Paginated,
  StoreCellarWinePayload,
  StoreTastingPayload,
  WineApiQuota,
  WineCandidatesResponse,
} from '@/types/food-drink/cellar'

const BASE = '/api/v1/cellar'

export async function listWines(params?: {
  q?: string
  match_status?: string
  per_page?: number
  page?: number
}): Promise<Paginated<CellarWine>> {
  const { data } = await http.get<Paginated<CellarWine>>(`${BASE}/wines`, {
    params,
  })
  return data
}

export async function getWine(id: number): Promise<CellarWine> {
  const { data } = await http.get<CellarWine>(`${BASE}/wines/${id}`)
  return data
}

export async function createWine(
  payload: StoreCellarWinePayload,
): Promise<CellarWine> {
  const { data } = await http.post<CellarWine>(`${BASE}/wines`, payload)
  return data
}

export async function updateWine(
  id: number,
  payload: Partial<StoreCellarWinePayload>,
): Promise<CellarWine> {
  const { data } = await http.patch<CellarWine>(`${BASE}/wines/${id}`, payload)
  return data
}

export async function deleteWine(id: number): Promise<void> {
  await http.delete(`${BASE}/wines/${id}`)
}

export async function getCandidates(
  wineId: number,
  q?: string,
): Promise<WineCandidatesResponse> {
  const { data } = await http.get<WineCandidatesResponse>(
    `${BASE}/wines/${wineId}/candidates`,
    { params: q ? { q } : undefined },
  )
  return data
}

export async function confirmMatch(
  wineId: number,
  wineapiId: string,
): Promise<CellarWine> {
  const { data } = await http.post<CellarWine>(`${BASE}/wines/${wineId}/match`, {
    wineapi_id: wineapiId,
  })
  return data
}

export async function markNoMatch(wineId: number): Promise<CellarWine> {
  const { data } = await http.post<CellarWine>(
    `${BASE}/wines/${wineId}/no-match`,
  )
  return data
}

export async function clearMatch(wineId: number): Promise<CellarWine> {
  const { data } = await http.delete<CellarWine>(`${BASE}/wines/${wineId}/match`)
  return data
}

export async function createTasting(
  wineId: number,
  payload: StoreTastingPayload,
): Promise<CellarWineTasting> {
  const { data } = await http.post<CellarWineTasting>(
    `${BASE}/wines/${wineId}/tastings`,
    payload,
  )
  return data
}

export async function updateTasting(
  tastingId: number,
  payload: Partial<StoreTastingPayload>,
): Promise<CellarWineTasting> {
  const { data } = await http.patch<CellarWineTasting>(
    `${BASE}/tastings/${tastingId}`,
    payload,
  )
  return data
}

export async function deleteTasting(tastingId: number): Promise<void> {
  await http.delete(`${BASE}/tastings/${tastingId}`)
}

export async function getQuota(): Promise<WineApiQuota> {
  const { data } = await http.get<WineApiQuota>(`${BASE}/quota`)
  return data
}
