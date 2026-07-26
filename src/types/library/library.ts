export type LibraryBookStatus = 'want' | 'reading' | 'read'

export type LibraryMatchStatus = 'unmatched' | 'matched' | 'no_match'

export interface LibraryCatalogBook {
  id: number
  ol_work_key: string
  ol_edition_key: string | null
  title: string
  authors: string[] | null
  authors_label: string | null
  isbn_10: string | null
  isbn_13: string | null
  publish_year: number | null
  page_count: number | null
  description: string | null
  cover_url: string | null
  media?: import('@/types/media/media').MediaImage | null
}

export interface LibraryBook {
  id: number
  title: string
  authors: string | null
  isbn: string | null
  status: LibraryBookStatus
  rating: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
  match_status: LibraryMatchStatus
  media?: import('@/types/media/media').MediaImage | null
  image_url?: string | null
  catalog?: LibraryCatalogBook | null
  created_at?: string
  updated_at?: string
}

export interface LibrarySearchResult {
  ol_work_key: string
  ol_edition_key: string | null
  title: string | null
  subtitle: string | null
  authors: string[]
  publish_year: number | null
  isbn_10: string | null
  isbn_13: string | null
  page_count: number | null
  cover_i: number | null
  cover_url: string | null
}

export interface LibraryCandidatesResponse {
  candidates: LibrarySearchResult[]
  from_cache: boolean
  message?: string
}

export interface StoreLibraryBookPayload {
  title: string
  authors?: string | null
  isbn?: string | null
  status?: LibraryBookStatus
  rating?: number | null
  notes?: string | null
  started_at?: string | null
  finished_at?: string | null
}
