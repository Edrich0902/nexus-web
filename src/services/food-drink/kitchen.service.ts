import http from '@lib/http'
import type { Paginated } from '@/types/food-drink/cellar'
import type {
  KitchenFilters,
  KitchenRecipe,
  MealDetail,
  MealSummary,
} from '@/types/food-drink/kitchen'

const BASE = '/api/v1/kitchen'

export async function searchMeals(q: string): Promise<MealSummary[]> {
  const { data } = await http.get<{ results: MealSummary[] }>(`${BASE}/search`, {
    params: { q },
  })
  return data.results
}

export async function browseMeals(params?: {
  category?: string
  area?: string
  ingredient?: string
}): Promise<MealSummary[]> {
  const { data } = await http.get<{ results: MealSummary[] }>(`${BASE}/browse`, {
    params,
  })
  return data.results
}

export async function getFilters(): Promise<KitchenFilters> {
  const { data } = await http.get<KitchenFilters>(`${BASE}/filters`)
  return data
}

export async function getRandomMeal(): Promise<MealDetail> {
  const { data } = await http.get<{ meal: MealDetail }>(`${BASE}/random`)
  return data.meal
}

export async function getMeal(mealdbId: string): Promise<MealDetail> {
  const { data } = await http.get<{ meal: MealDetail }>(
    `${BASE}/meals/${mealdbId}`,
  )
  return data.meal
}

export async function listRecipes(params?: {
  q?: string
  favourite?: boolean
  page?: number
}): Promise<Paginated<KitchenRecipe>> {
  const { data } = await http.get<Paginated<KitchenRecipe>>(`${BASE}/recipes`, {
    params,
  })
  return data
}

export async function getRecipe(id: number): Promise<KitchenRecipe> {
  const { data } = await http.get<KitchenRecipe>(`${BASE}/recipes/${id}`)
  return data
}

export async function saveRecipe(payload: {
  mealdb_id: string
  rating?: number | null
  notes?: string | null
}): Promise<KitchenRecipe> {
  const { data } = await http.post<KitchenRecipe>(`${BASE}/recipes`, payload)
  return data
}

export async function updateRecipe(
  id: number,
  payload: Partial<{
    rating: number | null
    notes: string | null
    is_favourite: boolean
  }>,
): Promise<KitchenRecipe> {
  const { data } = await http.patch<KitchenRecipe>(`${BASE}/recipes/${id}`, payload)
  return data
}

export async function markCooked(id: number): Promise<KitchenRecipe> {
  const { data } = await http.post<KitchenRecipe>(`${BASE}/recipes/${id}/cooked`)
  return data
}

export async function deleteRecipe(id: number): Promise<void> {
  await http.delete(`${BASE}/recipes/${id}`)
}
