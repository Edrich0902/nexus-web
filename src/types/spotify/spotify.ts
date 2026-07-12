export interface SpotifyArtistRef {
  id: string
  name: string
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  explicit: boolean
  album_name: string | null
  album_image_url: string | null
  album_id?: string | null
  artists: SpotifyArtistRef[]
  external_url: string | null
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: Array<{ url: string; height?: number; width?: number }>
  external_url: string | null
  uri?: string
  followers?: number
  popularity?: number
}

export interface SpotifyAlbumSnippet {
  id: string
  name: string
  uri: string
  image_url: string | null
  release_date?: string | null
  total_tracks?: number
  album_type?: string | null
  artists: SpotifyArtistRef[]
  external_url?: string | null
}

export interface SpotifySearchPlaylistSnippet {
  id: string
  name: string
  uri: string
  image_url: string | null
  description: string | null
  owner_name: string | null
  item_count: number
  external_url: string | null
}

export interface SpotifySearchResponse {
  tracks: SpotifyTrack[]
  artists: SpotifyArtist[]
  albums: SpotifyAlbumSnippet[]
  playlists: SpotifySearchPlaylistSnippet[]
}

export interface SpotifyQueueResponse {
  currently_playing: SpotifyPlayerItem | null
  queue: SpotifyPlayerItem[]
}

export interface SpotifyArtistDetail extends SpotifyArtist {
  available: boolean
  source?: string
  message?: string | null
  local?: boolean | null
}

export interface SpotifyArtistTopTracksResponse {
  available: boolean
  message: string | null
  tracks: SpotifyTrack[]
}

export interface SpotifyArtistAlbumsResponse {
  available: boolean
  message: string | null
  albums: SpotifyAlbumSnippet[]
}

export interface SpotifyAlbumDetail {
  available: boolean
  source?: string
  message?: string | null
  id?: string
  name?: string
  uri?: string
  image_url?: string | null
  release_date?: string | null
  total_tracks?: number
  artists?: SpotifyArtistRef[]
  external_url?: string | null
  tracks?: Array<
    SpotifyTrack & {
      track_number?: number
    }
  >
}

export interface SpotifyLibraryTracksResponse {
  items: Array<{ added_at: string | null; track: SpotifyTrack }>
  total: number
  limit: number
  offset: number
  next: boolean
}

export interface SpotifyLibraryAlbumsResponse {
  items: Array<{ added_at: string | null; album: SpotifyAlbumSnippet }>
  total: number
  limit: number
  offset: number
  next: boolean
}

export interface SpotifyLibraryArtistsResponse {
  artists: SpotifyArtist[]
  total: number
  next: boolean
  cursors: { after?: string } | null
}

export interface SpotifyConnectionStatus {
  connected: boolean
  provider: string | null
  status: string | null
  external_user_id: string | null
  scopes: string[]
  missing_scopes?: string[]
  connected_at: string | null
  last_synced_at: string | null
  needs_reauth: boolean
}

export interface SpotifyDevice {
  id: string
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent: number | null
}

/** Live Spotify item shape from the player proxy (track or episode). */
export interface SpotifyPlayerItem {
  id?: string
  name?: string
  uri?: string
  type?: string
  duration_ms?: number
  explicit?: boolean
  artists?: Array<{ id?: string; name?: string }>
  album?: {
    name?: string
    images?: Array<{ url: string; height?: number; width?: number }>
  }
  external_urls?: { spotify?: string }
}

export interface SpotifyPlaybackState {
  is_playing: boolean
  device: SpotifyDevice | null
  item: SpotifyPlayerItem | null
  progress_ms: number | null
  shuffle_state: boolean
  repeat_state: 'off' | 'track' | 'context' | string
  context?: Record<string, unknown> | null
  actions?: Record<string, unknown> | null
  message?: string
}

export interface SpotifyRecentlyPlayedItem {
  played_at: string
  context_uri: string | null
  context_type: string | null
  track: SpotifyTrack | null
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  public: boolean
  collaborative: boolean
  is_owner: boolean
  image_url: string | null
  snapshot_id: string | null
  uri: string
  item_count: number
  synced_at: string | null
  items?: SpotifyPlaylistItem[]
}

export interface SpotifyPlaylistItem {
  position: number
  added_at: string | null
  track: SpotifyTrack | null
}

export interface SpotifyTopItem {
  type: 'track' | 'artist' | string
  time_range: string
  rank: number
  synced_at: string | null
  artist: SpotifyArtist | null
  track: SpotifyTrack | null
}

export interface SpotifyTasteGenre {
  genre: string
  count: number
}

export interface SpotifyOnRepeatItem {
  play_count: number
  window_days: number
  track: SpotifyTrack
}

export interface SpotifyTimeOfDaySkew {
  buckets: Array<{ bucket: string; count: number }>
  weekday: Array<{ day: string; count: number }>
  peak_bucket: string | null
}

export interface SpotifyTasteSnapshot {
  genres: SpotifyTasteGenre[]
  top_artists: Record<
    string,
    Array<{ rank: number; artist: Partial<SpotifyArtist> & { id: string; name: string } }>
  >
  top_tracks: Record<
    string,
    Array<{ rank: number; track: Partial<SpotifyTrack> & { id: string; name: string } }>
  >
  on_repeat?: SpotifyOnRepeatItem[]
  time_of_day?: SpotifyTimeOfDaySkew
  notes: string[]
  computed_at: string | null
}

export interface SpotifySuggestionItem {
  reason: string
  source: string
  track: SpotifyTrack
}

export interface SpotifySuggestionsResponse {
  source: string
  items: SpotifySuggestionItem[]
}

export interface PaginatedResponse<T> {
  data: T[]
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from?: number | null
    to?: number | null
  }
}

export interface SpotifyConnectResponse {
  url: string
}

export interface SpotifySyncResponse {
  message: string
}

export interface SpotifyLibraryContainsResponse {
  uris: string[]
  contains: boolean[]
}

export interface SpotifyPlayPayload {
  device_id?: string
  context_uri?: string
  uris?: string[]
  offset?: { position?: number; uri?: string }
  position_ms?: number
}

export interface SpotifyTransferPayload {
  device_ids: string[]
  play?: boolean
}

export interface SpotifyCreatePlaylistPayload {
  name: string
  description?: string
  public?: boolean
  collaborative?: boolean
}

export interface SpotifyUpdatePlaylistPayload {
  name?: string
  description?: string
  public?: boolean
  collaborative?: boolean
}

export type SpotifyTimeRange = 'short_term' | 'medium_term' | 'long_term'
export type SpotifyTopType = 'artists' | 'tracks' | 'artist' | 'track'
