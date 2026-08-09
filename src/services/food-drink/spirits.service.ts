import http from '@lib/http'
import type { Paginated } from '@/types/food-drink/cellar'
import type { SpiritSpirit, StoreSpiritPayload } from '@/types/food-drink/spirits'

const BASE = '/api/v1/spirits'

export async function listSpirits(params?: {
  q?: string
  page?: number
}): Promise<Paginated<SpiritSpirit>> {
  const { data } = await http.get<Paginated<SpiritSpirit>>(`${BASE}/spirits`, {
    params,
  })
  return data
}

export async function getSpirit(id: number): Promise<SpiritSpirit> {
  const { data } = await http.get<SpiritSpirit>(`${BASE}/spirits/${id}`)
  return data
}

export async function createSpirit(payload: StoreSpiritPayload): Promise<SpiritSpirit> {
  const { data } = await http.post<SpiritSpirit>(`${BASE}/spirits`, payload)
  return data
}

export async function updateSpirit(
  id: number,
  payload: Partial<StoreSpiritPayload>,
): Promise<SpiritSpirit> {
  const { data } = await http.patch<SpiritSpirit>(`${BASE}/spirits/${id}`, payload)
  return data
}

export async function deleteSpirit(id: number): Promise<void> {
  await http.delete(`${BASE}/spirits/${id}`)
}

export async function analyseSpirit(
  spiritId: number,
  payload?: { force?: boolean; extra_context?: string | null },
): Promise<SpiritSpirit> {
  const { data } = await http.post<SpiritSpirit>(
    `${BASE}/spirits/${spiritId}/analyse`,
    payload ?? {},
  )
  return data
}
