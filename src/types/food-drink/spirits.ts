export interface SpiritSpirit {
  id: number
  name: string
  producer: string | null
  category: string | null
  age_statement: string | null
  abv: number | null
  region: string | null
  country: string | null
  rating: number | null
  notes: string | null
  media?: import('@/types/media/media').MediaImage | null
  image_url?: string | null
  analysis_status?: import('@/types/analysis/drink-analysis').AnalysisStatus
  analysed_at?: string | null
  analysis_model?: string | null
  analysis_prompt_version?: string | null
  analysis_error?: string | null
  ai_analysis?: import('@/types/analysis/drink-analysis').DrinkAnalysis | null
  created_at?: string
  updated_at?: string
}

export interface StoreSpiritPayload {
  name: string
  producer?: string | null
  category?: string | null
  age_statement?: string | null
  abv?: number | null
  region?: string | null
  country?: string | null
  rating?: number | null
  notes?: string | null
}
