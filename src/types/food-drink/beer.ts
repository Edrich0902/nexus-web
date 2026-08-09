export interface BeerStyle {
  id: number
  slug: string
  name: string
  family: string | null
}

export interface BeerBrewery {
  id: number
  obdb_id?: string | null
  name: string
  brewery_type?: string | null
  city?: string | null
  state_province?: string | null
  country?: string | null
  website_url?: string | null
  source: string
}

export interface BrewerySearchResult {
  obdb_id: string
  name: string | null
  brewery_type: string | null
  city: string | null
  state_province: string | null
  country: string | null
  website_url: string | null
}

export interface BeerBeer {
  id: number
  name: string
  abv: number | null
  ibu: number | null
  format: string | null
  rating: number | null
  notes: string | null
  media?: import('@/types/media/media').MediaImage | null
  image_url?: string | null
  brewery: BeerBrewery | null
  style: BeerStyle | null
  analysis_status?: import('@/types/analysis/drink-analysis').AnalysisStatus
  analysed_at?: string | null
  analysis_model?: string | null
  analysis_prompt_version?: string | null
  analysis_error?: string | null
  ai_analysis?: import('@/types/analysis/drink-analysis').DrinkAnalysis | null
  created_at?: string
  updated_at?: string
}
