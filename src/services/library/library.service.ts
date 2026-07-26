import http from '@lib/http'
import type { Paginated } from '@/types/food-drink/cellar'
import type {
  LibraryBook,
  LibraryCandidatesResponse,
  LibrarySearchResult,
  StoreLibraryBookPayload,
} from '@/types/library/library'

const BASE = '/api/v1/library'

export async function listBooks(params?: {
  q?: string
  status?: string
  match_status?: string
  page?: number
  per_page?: number
}): Promise<Paginated<LibraryBook>> {
  const { data } = await http.get<Paginated<LibraryBook>>(`${BASE}/books`, {
    params,
  })
  return data
}

export async function getBook(id: number): Promise<LibraryBook> {
  const { data } = await http.get<LibraryBook>(`${BASE}/books/${id}`)
  return data
}

export async function createBook(
  payload: StoreLibraryBookPayload,
): Promise<LibraryBook> {
  const { data } = await http.post<LibraryBook>(`${BASE}/books`, payload)
  return data
}

export async function createBookFromCatalog(payload: {
  ol_work_key: string
} & Partial<StoreLibraryBookPayload>): Promise<LibraryBook> {
  const { data } = await http.post<LibraryBook>(
    `${BASE}/books/from-catalog`,
    payload,
  )
  return data
}

export async function updateBook(
  id: number,
  payload: Partial<StoreLibraryBookPayload>,
): Promise<LibraryBook> {
  const { data } = await http.patch<LibraryBook>(`${BASE}/books/${id}`, payload)
  return data
}

export async function deleteBook(id: number): Promise<void> {
  await http.delete(`${BASE}/books/${id}`)
}

export async function searchCatalog(q: string): Promise<LibrarySearchResult[]> {
  const { data } = await http.get<{ results: LibrarySearchResult[] }>(
    `${BASE}/search`,
    { params: { q } },
  )
  return data.results
}

export async function getCandidates(
  bookId: number,
  q?: string,
): Promise<LibraryCandidatesResponse> {
  const { data } = await http.get<LibraryCandidatesResponse>(
    `${BASE}/books/${bookId}/candidates`,
    { params: q ? { q } : undefined },
  )
  return data
}

export async function confirmMatch(
  bookId: number,
  olWorkKey: string,
): Promise<LibraryBook> {
  const { data } = await http.post<LibraryBook>(
    `${BASE}/books/${bookId}/match`,
    { ol_work_key: olWorkKey },
  )
  return data
}

export async function markNoMatch(bookId: number): Promise<LibraryBook> {
  const { data } = await http.post<LibraryBook>(
    `${BASE}/books/${bookId}/no-match`,
  )
  return data
}

export async function clearMatch(bookId: number): Promise<LibraryBook> {
  const { data } = await http.delete<LibraryBook>(
    `${BASE}/books/${bookId}/match`,
  )
  return data
}
