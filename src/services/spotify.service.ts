import http from '@lib/http'
import type {
  PaginatedResponse,
  SpotifyAlbumDetail,
  SpotifyArtistAlbumsResponse,
  SpotifyArtistDetail,
  SpotifyArtistTopTracksResponse,
  SpotifyConnectResponse,
  SpotifyConnectionStatus,
  SpotifyCreatePlaylistPayload,
  SpotifyDevice,
  SpotifyLibraryAlbumsResponse,
  SpotifyLibraryArtistsResponse,
  SpotifyLibraryContainsResponse,
  SpotifyLibraryTracksResponse,
  SpotifyPlayPayload,
  SpotifyPlaybackState,
  SpotifyPlaylist,
  SpotifyQueueResponse,
  SpotifyRecentlyPlayedItem,
  SpotifySearchResponse,
  SpotifySuggestionItem,
  SpotifySuggestionsResponse,
  SpotifySyncResponse,
  SpotifyTasteSnapshot,
  SpotifyTimeRange,
  SpotifyTopItem,
  SpotifyTopType,
  SpotifyTransferPayload,
  SpotifyUpdatePlaylistPayload,
} from '@/types/spotify/spotify'

const BASE = '/api/v1/spotify'

export async function getConnectUrl(): Promise<SpotifyConnectResponse> {
  const { data } = await http.get<SpotifyConnectResponse>(`${BASE}/connect`)
  return data
}

export async function getStatus(): Promise<SpotifyConnectionStatus> {
  const { data } = await http.get<SpotifyConnectionStatus>(`${BASE}/status`)
  return data
}

export async function disconnect(): Promise<void> {
  await http.post(`${BASE}/disconnect`)
}

export async function sync(): Promise<SpotifySyncResponse> {
  const { data } = await http.post<SpotifySyncResponse>(`${BASE}/sync`)
  return data
}

export async function getPlayer(): Promise<SpotifyPlaybackState> {
  const { data } = await http.get<SpotifyPlaybackState>(`${BASE}/player`)
  return data
}

export async function getDevices(): Promise<SpotifyDevice[]> {
  const { data } = await http.get<{ devices: SpotifyDevice[] }>(
    `${BASE}/player/devices`,
  )
  return data.devices ?? []
}

export async function transfer(payload: SpotifyTransferPayload): Promise<void> {
  await http.put(`${BASE}/player`, payload)
}

export async function play(payload: SpotifyPlayPayload = {}): Promise<void> {
  await http.put(`${BASE}/player/play`, payload)
}

export async function pause(deviceId?: string): Promise<void> {
  await http.put(
    `${BASE}/player/pause`,
    {},
    { params: deviceId ? { device_id: deviceId } : undefined },
  )
}

export async function next(deviceId?: string): Promise<void> {
  await http.post(
    `${BASE}/player/next`,
    {},
    { params: deviceId ? { device_id: deviceId } : undefined },
  )
}

export async function previous(deviceId?: string): Promise<void> {
  await http.post(
    `${BASE}/player/previous`,
    {},
    { params: deviceId ? { device_id: deviceId } : undefined },
  )
}

export async function seek(
  positionMs: number,
  deviceId?: string,
): Promise<void> {
  await http.put(`${BASE}/player/seek`, {
    position_ms: positionMs,
    ...(deviceId ? { device_id: deviceId } : {}),
  })
}

export async function setVolume(
  volumePercent: number,
  deviceId?: string,
): Promise<void> {
  await http.put(`${BASE}/player/volume`, {
    volume_percent: volumePercent,
    ...(deviceId ? { device_id: deviceId } : {}),
  })
}

export async function setShuffle(state: boolean, deviceId?: string): Promise<void> {
  await http.put(`${BASE}/player/shuffle`, {
    state,
    ...(deviceId ? { device_id: deviceId } : {}),
  })
}

export async function setRepeat(
  state: 'track' | 'context' | 'off',
  deviceId?: string,
): Promise<void> {
  await http.put(`${BASE}/player/repeat`, {
    state,
    ...(deviceId ? { device_id: deviceId } : {}),
  })
}

export async function getQueue(): Promise<SpotifyQueueResponse> {
  const { data } = await http.get<SpotifyQueueResponse>(`${BASE}/player/queue`)
  return {
    currently_playing: data.currently_playing ?? null,
    queue: data.queue ?? [],
  }
}

export async function addToQueue(uri: string, deviceId?: string): Promise<void> {
  await http.post(`${BASE}/player/queue`, {
    uri,
    ...(deviceId ? { device_id: deviceId } : {}),
  })
}

export async function search(
  q: string,
  type = 'track,artist,album,playlist',
  limit = 10,
): Promise<SpotifySearchResponse> {
  const { data } = await http.get<SpotifySearchResponse>(`${BASE}/search`, {
    params: { q, type, limit },
  })
  return data
}

export async function getArtist(artistId: string): Promise<SpotifyArtistDetail> {
  const { data } = await http.get<SpotifyArtistDetail>(
    `${BASE}/artists/${artistId}`,
  )
  return data
}

export async function getArtistTopTracks(
  artistId: string,
): Promise<SpotifyArtistTopTracksResponse> {
  const { data } = await http.get<SpotifyArtistTopTracksResponse>(
    `${BASE}/artists/${artistId}/top-tracks`,
  )
  return data
}

export async function getArtistAlbums(
  artistId: string,
  limit = 20,
): Promise<SpotifyArtistAlbumsResponse> {
  const { data } = await http.get<SpotifyArtistAlbumsResponse>(
    `${BASE}/artists/${artistId}/albums`,
    { params: { limit } },
  )
  return data
}

export async function getAlbum(albumId: string): Promise<SpotifyAlbumDetail> {
  const { data } = await http.get<SpotifyAlbumDetail>(
    `${BASE}/albums/${albumId}`,
  )
  return data
}

export async function listLibraryTracks(
  limit = 20,
  offset = 0,
): Promise<SpotifyLibraryTracksResponse> {
  const { data } = await http.get<SpotifyLibraryTracksResponse>(
    `${BASE}/library/tracks`,
    { params: { limit, offset } },
  )
  return data
}

export async function listLibraryAlbums(
  limit = 20,
  offset = 0,
): Promise<SpotifyLibraryAlbumsResponse> {
  const { data } = await http.get<SpotifyLibraryAlbumsResponse>(
    `${BASE}/library/albums`,
    { params: { limit, offset } },
  )
  return data
}

export async function listLibraryArtists(
  limit = 20,
  after?: string,
): Promise<SpotifyLibraryArtistsResponse> {
  const { data } = await http.get<SpotifyLibraryArtistsResponse>(
    `${BASE}/library/artists`,
    { params: { limit, ...(after ? { after } : {}) } },
  )
  return data
}

export async function saveLibrary(uris: string[]): Promise<void> {
  await http.put(`${BASE}/library`, { uris })
}

export async function removeLibrary(uris: string[]): Promise<void> {
  await http.delete(`${BASE}/library`, { data: { uris } })
}

export async function libraryContains(
  uris: string[],
): Promise<SpotifyLibraryContainsResponse> {
  const { data } = await http.get<SpotifyLibraryContainsResponse>(
    `${BASE}/library/contains`,
    { params: { uris: uris.join(',') } },
  )
  return data
}

export async function listPlaylists(
  perPage = 50,
): Promise<PaginatedResponse<SpotifyPlaylist>> {
  const { data } = await http.get<PaginatedResponse<SpotifyPlaylist>>(
    `${BASE}/playlists`,
    { params: { per_page: perPage } },
  )
  return data
}

export async function playlistsContainingUri(
  uri: string,
): Promise<{ playlist_ids: string[] }> {
  const { data } = await http.get<{ playlist_ids: string[] }>(
    `${BASE}/playlists/containing`,
    { params: { uri } },
  )
  return data
}

export async function getPlaylist(
  playlistId: string,
  refresh = false,
): Promise<SpotifyPlaylist> {
  const { data } = await http.get<SpotifyPlaylist>(
    `${BASE}/playlists/${playlistId}`,
    { params: refresh ? { refresh: 1 } : undefined },
  )
  return data
}

export async function createPlaylist(
  payload: SpotifyCreatePlaylistPayload,
): Promise<SpotifyPlaylist> {
  const { data } = await http.post<SpotifyPlaylist>(`${BASE}/playlists`, payload)
  return data
}

export async function updatePlaylist(
  playlistId: string,
  payload: SpotifyUpdatePlaylistPayload,
): Promise<SpotifyPlaylist> {
  const { data } = await http.put<SpotifyPlaylist>(
    `${BASE}/playlists/${playlistId}`,
    payload,
  )
  return data
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await http.delete(`${BASE}/playlists/${playlistId}`)
}

export async function addPlaylistItems(
  playlistId: string,
  uris: string[],
  position?: number,
): Promise<void> {
  await http.post(`${BASE}/playlists/${playlistId}/items`, {
    uris,
    ...(position !== undefined ? { position } : {}),
  })
}

export async function removePlaylistItems(
  playlistId: string,
  items: Array<{ uri: string; positions?: number[] }>,
): Promise<void> {
  await http.delete(`${BASE}/playlists/${playlistId}/items`, {
    data: { items },
  })
}

export async function listRecentlyPlayed(
  perPage = 24,
): Promise<PaginatedResponse<SpotifyRecentlyPlayedItem>> {
  const { data } = await http.get<PaginatedResponse<SpotifyRecentlyPlayedItem>>(
    `${BASE}/recently-played`,
    { params: { per_page: perPage } },
  )
  return data
}

export async function listTop(
  type: SpotifyTopType,
  timeRange: SpotifyTimeRange = 'medium_term',
): Promise<SpotifyTopItem[]> {
  const { data } = await http.get<SpotifyTopItem[]>(`${BASE}/top/${type}`, {
    params: { time_range: timeRange },
  })
  return data
}

export async function getTaste(): Promise<SpotifyTasteSnapshot> {
  const { data } = await http.get<SpotifyTasteSnapshot>(`${BASE}/taste`)
  return data
}

export async function getSuggestions(): Promise<SpotifySuggestionsResponse> {
  const { data } = await http.get<SpotifySuggestionsResponse>(
    `${BASE}/suggestions`,
  )
  return data
}

export type { SpotifySuggestionItem }
