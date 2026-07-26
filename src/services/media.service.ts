import http, { postMultipart } from '@lib/http'
import type {
  MediaAsset,
  MediaAttachPayload,
  MediaFromUrlPayload,
  MediaListParams,
  MediaListResponse,
  MediaUploadOptions,
  MediaUsage,
  UnsplashSearchResponse,
} from '@/types/media/media'

const BASE = '/api/v1/media'

export async function listMedia(
  params: MediaListParams = {},
): Promise<MediaListResponse> {
  const { data } = await http.get<MediaListResponse>(BASE, { params })
  return data
}

export async function getMedia(id: number): Promise<MediaAsset> {
  const { data } = await http.get<MediaAsset>(`${BASE}/${id}`)
  return data
}

export async function uploadMedia(
  file: File,
  options: MediaUploadOptions,
): Promise<MediaAsset> {
  const form = new FormData()
  form.append('file', file)
  form.append('collection', options.collection)
  if (options.alt_text) form.append('alt_text', options.alt_text)
  if (options.role) form.append('role', options.role)
  if (options.tags) {
    options.tags.forEach((tag, i) => form.append(`tags[${i}]`, tag))
  }
  if (options.attach_to) {
    form.append('attach_to[type]', options.attach_to.type)
    form.append('attach_to[id]', String(options.attach_to.id))
  }

  return postMultipart<MediaAsset>(BASE, form, options.onProgress)
}

export async function importFromUrl(
  payload: MediaFromUrlPayload,
): Promise<MediaAsset> {
  const { data } = await http.post<MediaAsset>(`${BASE}/from-url`, payload)
  return data
}

export async function updateMedia(
  id: number,
  payload: { alt_text?: string | null; tags?: string[]; collection?: string },
): Promise<MediaAsset> {
  const { data } = await http.patch<MediaAsset>(`${BASE}/${id}`, payload)
  return data
}

export async function deleteMedia(
  id: number,
  force = false,
): Promise<void | { message: string; attachments: MediaAttachPayload[] }> {
  const { data, status } = await http.delete(`${BASE}/${id}`, {
    params: force ? { force: 1 } : undefined,
    validateStatus: (s) => s === 204 || s === 409,
  })
  if (status === 409) {
    return data as { message: string; attachments: MediaAttachPayload[] }
  }
}

export async function attachMedia(
  id: number,
  payload: MediaAttachPayload,
): Promise<MediaAsset> {
  const { data } = await http.post<MediaAsset>(`${BASE}/${id}/attach`, payload)
  return data
}

export async function detachMedia(
  id: number,
  payload: MediaAttachPayload,
): Promise<MediaAsset> {
  const { data } = await http.delete<MediaAsset>(`${BASE}/${id}/attach`, {
    data: payload,
  })
  return data
}

export async function getUsage(refresh = false): Promise<MediaUsage> {
  const { data } = await http.get<MediaUsage>(`${BASE}/usage`, {
    params: refresh ? { refresh: 1 } : undefined,
  })
  return data
}

export async function reconcileMedia(): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>(`${BASE}/reconcile`)
  return data
}

export async function searchUnsplash(
  q: string,
  page = 1,
  perPage = 20,
): Promise<UnsplashSearchResponse> {
  const { data } = await http.get<UnsplashSearchResponse>(
    `${BASE}/sources/unsplash`,
    { params: { q, page, per_page: perPage } },
  )
  return data
}
