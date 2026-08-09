export type AnalysisStatus = 'none' | 'pending' | 'complete' | 'failed'

export interface DrinkAnalysis {
  schema_version: number
  domain: 'wine' | 'beer' | 'spirit'
  identity: {
    name: string | null
    producer: string | null
    brand: string | null
    category: string | null
    style: string | null
    vintage_or_age: string | null
    region: string | null
    country: string | null
    abv: number | null
    volume_ml: number | null
  }
  sensory: {
    appearance: string | null
    aroma_notes: string[]
    taste_notes: string[]
    finish: string | null
    body: string | null
    sweetness: string | null
    acidity: string | null
    bitterness: string | null
    bitterness_ibu: number | null
    tannin: string | null
    carbonation: string | null
    mouthfeel: string | null
    smoke_peat: string | null
  }
  narrative: {
    tasting_notes: string | null
    characteristics: string[]
    interesting_facts: string[]
    serving_suggestions: string | null
    food_pairings: string[]
    glassware: string | null
    serving_temp_c: { min: number | null; max: number | null }
  }
  meta: {
    confidence: number
    uncertainties: string[]
    labels_detected: string[]
  }
}

export interface GeminiModelQuota {
  id: string
  label: string
  priority: number
  rpm: { limit: number; remaining: number }
  rpd: { limit: number; used: number; remaining: number }
  cooldown_until: string | null
  available: boolean
}

export interface AnalysisQuota {
  models: GeminiModelQuota[]
  any_available: boolean
}

export interface DrinkAnalysisFields {
  analysis_status?: AnalysisStatus
  analysed_at?: string | null
  analysis_model?: string | null
  analysis_prompt_version?: string | null
  analysis_error?: string | null
  ai_analysis?: DrinkAnalysis | null
}
