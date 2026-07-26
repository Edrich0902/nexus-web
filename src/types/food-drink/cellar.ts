export type WineMatchStatus = 'unmatched' | 'matching' | 'matched' | 'no_match'

export type EnrichmentStatus = 'pending' | 'queued' | 'complete' | 'failed'

export interface WineApiQuota {
  provider: string
  used: number
  daily_limit: number
  remaining: number
  search_remaining: number
  resets_in_seconds: number
  usage_date: string
}

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

export interface WineCatalogSummary {
  id: number
  wineapi_id: string
  name: string
  vintage: number | null
  type: string | null
  body: string | null
  acidity: string | null
  description: string | null
  image_url: string | null
  media?: import('@/types/media/media').MediaImage | null
  average_rating: number | null
  enrichment_status: EnrichmentStatus
  enriched_at: string | null
  winery: { id: number; name: string } | null
  region: { id: number; name: string; country: string | null } | null
  grapes: Array<{ id: number; name: string; color: string | null }>
  scores: Array<{
    score: number | null
    score_text: string | null
    reviewer: string | null
    review_date: string | null
  }>
  prices: Array<{
    merchant_name: string | null
    price: number | null
    currency: string | null
    url: string | null
  }>
  pairings: Array<{
    food: string
    confidence: number | null
    notes: string | null
  }>
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
  match_status: WineMatchStatus
  media?: import('@/types/media/media').MediaImage | null
  image_url?: string | null
  tastings_count?: number
  catalog?: WineCatalogSummary | null
  tastings?: CellarWineTasting[]
  created_at?: string
  updated_at?: string
}

export interface WineMatchCandidate {
  wineapi_id: string
  name: string | null
  vintage: number | null
  type: string | null
  winery: string | null
  region: string | null
  country: string | null
  average_rating: number | null
  ratings_count: number | null
  confidence: number | null
}

export interface WineCandidatesResponse {
  candidates: WineMatchCandidate[]
  from_cache: boolean
  quota: WineApiQuota
  message?: string
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
