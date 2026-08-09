export type WineMatchStatus = 'unmatched' | 'matching' | 'matched' | 'no_match'

export interface CellarWineTasting {
  id: number
  cellar_wine_id: number
  tasted_on: string
  rating: number | null
  notes: string | null
  occasion: string | null
  location: string | null
  created_at?: string
  updated_at?: string
}

export interface CellarWine {
  id: number
  producer_name: string | null
  name: string
  vintage: number | null
  wine_type: string | null
  region_name: string | null
  country: string | null
  rating: number | null
  notes: string | null
  match_status?: WineMatchStatus
  media?: import('@/types/media/media').MediaImage | null
  image_url?: string | null
  tastings_count?: number
  catalog?: null
  tastings?: CellarWineTasting[]
  analysis_status?: import('@/types/analysis/drink-analysis').AnalysisStatus
  analysed_at?: string | null
  analysis_model?: string | null
  analysis_prompt_version?: string | null
  analysis_error?: string | null
  ai_analysis?: import('@/types/analysis/drink-analysis').DrinkAnalysis | null
  created_at?: string
  updated_at?: string
}

export interface StoreCellarWinePayload {
  producer_name?: string | null
  name: string
  vintage?: number | null
  wine_type?: string | null
  region_name?: string | null
  country?: string | null
  rating?: number | null
  notes?: string | null
}

export interface StoreTastingPayload {
  tasted_on: string
  rating?: number | null
  notes?: string | null
  occasion?: string | null
  location?: string | null
}

export interface Paginated<T> {
  data: T[]
  links?: Record<string, string | null>
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
