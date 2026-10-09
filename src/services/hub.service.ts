import http from '@lib/http'
import type {
  ActivityModule,
  ActivityPage,
  NowPayload,
  PaletteResponse,
  SearchResponse,
} from '@/types/hub/hub'

const BASE = '/api/v1'

export async function getNow(tz: string): Promise<NowPayload> {
  const { data } = await http.get<NowPayload>(`${BASE}/now`, { params: { tz } })
  return data
}

export async function getActivity(params?: {
  module?: ActivityModule
  limit?: number
  cursor?: string | null
}): Promise<ActivityPage> {
  const { data } = await http.get<ActivityPage>(`${BASE}/activity`, {
    params: {
      module: params?.module,
      limit: params?.limit,
      cursor: params?.cursor ?? undefined,
    },
  })
  return data
}

export async function search(q: string, signal?: AbortSignal): Promise<SearchResponse> {
  const { data } = await http.get<SearchResponse>(`${BASE}/search`, { params: { q }, signal })
  return data
}

export async function getPalette(url: string): Promise<PaletteResponse> {
  const { data } = await http.get<PaletteResponse>(`${BASE}/palette`, { params: { url } })
  return data
}
