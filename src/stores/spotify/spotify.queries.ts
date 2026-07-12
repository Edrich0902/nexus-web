import { defineQuery } from '@pinia/colada'
import * as spotifyService from '@services/spotify.service'
import type { SpotifyTimeRange, SpotifyTopType } from '@/types/spotify/spotify'

export const spotifyKeys = {
  all: ['spotify'] as const,
  status: ['spotify', 'status'] as const,
  player: ['spotify', 'player'] as const,
  devices: ['spotify', 'devices'] as const,
  queue: ['spotify', 'queue'] as const,
  recentlyPlayed: ['spotify', 'recently-played'] as const,
  playlists: ['spotify', 'playlists'] as const,
  playlist: (id: string) => ['spotify', 'playlist', id] as const,
  taste: ['spotify', 'taste'] as const,
  suggestions: ['spotify', 'suggestions'] as const,
  search: (q: string) => ['spotify', 'search', q] as const,
  artist: (id: string) => ['spotify', 'artist', id] as const,
  album: (id: string) => ['spotify', 'album', id] as const,
  libraryTracks: (offset: number) =>
    ['spotify', 'library-tracks', offset] as const,
  libraryAlbums: (offset: number) =>
    ['spotify', 'library-albums', offset] as const,
  libraryArtists: ['spotify', 'library-artists'] as const,
  top: (type: SpotifyTopType, range: SpotifyTimeRange) =>
    ['spotify', 'top', type, range] as const,
  libraryContains: (urisKey: string) =>
    ['spotify', 'library-contains', urisKey] as const,
}

export const useSpotifyStatusQuery = defineQuery({
  key: spotifyKeys.status,
  query: () => spotifyService.getStatus(),
})

/** Dependent queries stay manual until status confirms a connection. */
export const useSpotifyPlayerQuery = defineQuery({
  key: spotifyKeys.player,
  query: () => spotifyService.getPlayer(),
  enabled: false,
})

export const useSpotifyDevicesQuery = defineQuery({
  key: spotifyKeys.devices,
  query: () => spotifyService.getDevices(),
  enabled: false,
})

export const useSpotifyRecentlyPlayedQuery = defineQuery({
  key: spotifyKeys.recentlyPlayed,
  query: () => spotifyService.listRecentlyPlayed(24),
  enabled: false,
})

export const useSpotifyPlaylistsQuery = defineQuery({
  key: spotifyKeys.playlists,
  query: () => spotifyService.listPlaylists(50),
  enabled: false,
})

export const useSpotifyTasteQuery = defineQuery({
  key: spotifyKeys.taste,
  query: () => spotifyService.getTaste(),
  enabled: false,
})

export const useSpotifySuggestionsQuery = defineQuery({
  key: spotifyKeys.suggestions,
  query: () => spotifyService.getSuggestions(),
  enabled: false,
})
