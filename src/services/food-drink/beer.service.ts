import http from '@lib/http'
import type { Paginated } from '@/types/food-drink/cellar'
import type {
  BeerBeer,
  BeerBrewery,
  BeerStyle,
  BrewerySearchResult,
} from '@/types/food-drink/beer'

const BASE = '/api/v1/beer'

export async function listBeers(params?: {
  q?: string
  page?: number
}): Promise<Paginated<BeerBeer>> {
  const { data } = await http.get<Paginated<BeerBeer>>(`${BASE}/beers`, { params })
  return data
}

export async function getBeer(id: number): Promise<BeerBeer> {
  const { data } = await http.get<BeerBeer>(`${BASE}/beers/${id}`)
  return data
}

export async function createBeer(payload: {
  name: string
  beer_brewery_id?: number | null
  beer_style_id?: number | null
  abv?: number | null
  ibu?: number | null
  format?: string | null
  rating?: number | null
  notes?: string | null
}): Promise<BeerBeer> {
  const { data } = await http.post<BeerBeer>(`${BASE}/beers`, payload)
  return data
}

export async function updateBeer(
  id: number,
  payload: Partial<{
    name: string
    beer_brewery_id: number | null
    beer_style_id: number | null
    abv: number | null
    ibu: number | null
    format: string | null
    rating: number | null
    notes: string | null
  }>,
): Promise<BeerBeer> {
  const { data } = await http.patch<BeerBeer>(`${BASE}/beers/${id}`, payload)
  return data
}

export async function deleteBeer(id: number): Promise<void> {
  await http.delete(`${BASE}/beers/${id}`)
}

export async function listStyles(): Promise<BeerStyle[]> {
  const { data } = await http.get<{ styles: BeerStyle[] }>(`${BASE}/styles`)
  return data.styles
}

export async function searchBreweries(q: string): Promise<BrewerySearchResult[]> {
  const { data } = await http.get<{ results: BrewerySearchResult[] }>(
    `${BASE}/breweries/search`,
    { params: { q } },
  )
  return data.results
}

export async function importBrewery(obdbId: string): Promise<BeerBrewery> {
  const { data } = await http.post<BeerBrewery>(`${BASE}/breweries/import`, {
    obdb_id: obdbId,
  })
  return data
}

export async function createManualBrewery(payload: {
  name: string
  city?: string | null
  country?: string | null
  brewery_type?: string | null
  website_url?: string | null
}): Promise<BeerBrewery> {
  const { data } = await http.post<BeerBrewery>(`${BASE}/breweries`, payload)
  return data
}

export async function getBrewery(id: number): Promise<BeerBrewery> {
  const { data } = await http.get<BeerBrewery>(`${BASE}/breweries/${id}`)
  return data
}

export async function listBreweries(): Promise<Paginated<BeerBrewery>> {
  const { data } = await http.get<Paginated<BeerBrewery>>(`${BASE}/breweries`)
  return data
}
