import http from '@lib/http'
import type {
  CellarWine,
  CellarWineTasting,
  Paginated,
  StoreCellarWinePayload,
  StoreTastingPayload,
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

export async function analyseWine(
  wineId: number,
  payload?: { force?: boolean; extra_context?: string | null },
): Promise<CellarWine> {
  const { data } = await http.post<CellarWine>(
    `${BASE}/wines/${wineId}/analyse`,
    payload ?? {},
  )
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
