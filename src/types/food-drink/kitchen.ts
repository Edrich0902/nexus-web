export interface MealSummary {
  mealdb_id: string
  name: string | null
  thumb_url: string | null
  category: string | null
  area: string | null
}

export interface MealIngredient {
  id: number
  name: string
  measure: string | null
  position: number | null
}

export interface MealDetail {
  id: number
  mealdb_id: string
  name: string
  category: string | null
  area: string | null
  instructions: string | null
  thumb_url: string | null
  tags: string[] | null
  youtube_url?: string | null
  source_url?: string | null
  ingredients: MealIngredient[]
}

export interface KitchenRecipe {
  id: number
  source: string | null
  rating: number | null
  notes: string | null
  cooked_count: number
  last_cooked_on: string | null
  is_favourite: boolean
  meal: MealDetail | null
  created_at?: string
  updated_at?: string
}

export interface KitchenFilters {
  categories: string[]
  areas: string[]
}
