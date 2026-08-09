import type { MediaImage } from '@/types/media/media'
import type { AnalysisQuota } from '@/types/analysis/drink-analysis'

export type PairingVerdict = 'great' | 'good' | 'poor'

export interface FoodDrinkCounts {
  wines: number
  beers: number
  spirits: number
  recipes: number
  pairings: number
}

export interface FoodDrinkSuggestion {
  recipe_id: number
  drinkable_type: 'wine' | 'beer'
  drinkable_id: number
  score: number
  reasons: string[]
  recipe_name: string | null
  drink_name: string | null
}

export interface FoodDrinkPairing {
  id: number
  drinkable_type: string
  drinkable_id: number
  drinkable_name?: string | null
  kitchen_recipe_id: number
  recipe_name?: string | null
  verdict: PairingVerdict
  notes: string | null
  source: string
}

export interface FoodDrinkDashboard {
  counts: FoodDrinkCounts
  recent_wines: Array<{
    id: number
    name: string
    producer_name: string | null
    vintage: number | null
    rating: number | null
    match_status?: string
    analysis_status?: string
    media?: MediaImage | null
    image_url?: string | null
  }>
  recent_beers: Array<{
    id: number
    name: string
    rating: number | null
    analysis_status?: string
    brewery?: { id: number; name: string } | null
    media?: MediaImage | null
    image_url?: string | null
  }>
  recent_spirits?: Array<{
    id: number
    name: string
    producer: string | null
    category: string | null
    rating: number | null
    analysis_status?: string
    media?: MediaImage | null
    image_url?: string | null
  }>
  top_recipes: Array<{
    id: number
    rating: number | null
    cooked_count: number
    meal?: { name: string; thumb_url: string | null } | null
    media?: MediaImage | null
    image_url?: string | null
  }>
  quota: AnalysisQuota
  suggestions: FoodDrinkSuggestion[]
  recent_pairings: FoodDrinkPairing[]
}
