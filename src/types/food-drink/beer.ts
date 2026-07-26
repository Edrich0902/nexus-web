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
  brewery: BeerBrewery | null
  style: BeerStyle | null
  created_at?: string
  updated_at?: string
}
