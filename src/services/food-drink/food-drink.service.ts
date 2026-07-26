import http from '@lib/http'
import type {
  FoodDrinkDashboard,
  FoodDrinkPairing,
  FoodDrinkSuggestion,
} from '@/types/food-drink/food-drink'
import type { PairingVerdict } from '@/types/food-drink/food-drink'

const BASE = '/api/v1/food-drink'

export async function getDashboard(): Promise<FoodDrinkDashboard> {
  const { data } = await http.get<FoodDrinkDashboard>(`${BASE}/dashboard`)
  return data
}

export async function listPairings(): Promise<FoodDrinkPairing[]> {
  const { data } = await http.get<FoodDrinkPairing[] | { data: FoodDrinkPairing[] }>(
    `${BASE}/pairings`,
  )
  return Array.isArray(data) ? data : data.data
}

export async function createPairing(payload: {
  drinkable_type: 'wine' | 'beer'
  drinkable_id: number
  kitchen_recipe_id: number
  verdict?: PairingVerdict
  notes?: string | null
}): Promise<FoodDrinkPairing> {
  const { data } = await http.post<FoodDrinkPairing>(`${BASE}/pairings`, payload)
  return data
}

export async function deletePairing(id: number): Promise<void> {
  await http.delete(`${BASE}/pairings/${id}`)
}

export async function getSuggestions(limit = 10): Promise<FoodDrinkSuggestion[]> {
  const { data } = await http.get<{ suggestions: FoodDrinkSuggestion[] }>(
    `${BASE}/suggestions`,
    { params: { limit } },
  )
  return data.suggestions
}
