import { defineMutation } from '@pinia/colada'
import * as spotifyService from '@services/spotify.service'
import type {
  SpotifyCreatePlaylistPayload,
  SpotifyPlayPayload,
  SpotifyTransferPayload,
  SpotifyUpdatePlaylistPayload,
} from '@/types/spotify/spotify'

export const useSpotifyDisconnectMutation = defineMutation({
  mutation: () => spotifyService.disconnect(),
})

export const useSpotifySyncMutation = defineMutation({
  mutation: () => spotifyService.sync(),
})

export const useSpotifyPlayMutation = defineMutation({
  mutation: (payload: SpotifyPlayPayload = {}) => spotifyService.play(payload),
})

export const useSpotifyPauseMutation = defineMutation({
  mutation: (deviceId?: string) => spotifyService.pause(deviceId),
})

export const useSpotifyNextMutation = defineMutation({
  mutation: (deviceId?: string) => spotifyService.next(deviceId),
})

export const useSpotifyPreviousMutation = defineMutation({
  mutation: (deviceId?: string) => spotifyService.previous(deviceId),
})

export const useSpotifySeekMutation = defineMutation({
  mutation: (vars: { positionMs: number; deviceId?: string }) =>
    spotifyService.seek(vars.positionMs, vars.deviceId),
})

export const useSpotifyVolumeMutation = defineMutation({
  mutation: (vars: { volumePercent: number; deviceId?: string }) =>
    spotifyService.setVolume(vars.volumePercent, vars.deviceId),
})

export const useSpotifyTransferMutation = defineMutation({
  mutation: (payload: SpotifyTransferPayload) =>
    spotifyService.transfer(payload),
})

export const useSpotifyShuffleMutation = defineMutation({
  mutation: (vars: { state: boolean; deviceId?: string }) =>
    spotifyService.setShuffle(vars.state, vars.deviceId),
})

export const useSpotifyRepeatMutation = defineMutation({
  mutation: (vars: {
    state: 'track' | 'context' | 'off'
    deviceId?: string
  }) => spotifyService.setRepeat(vars.state, vars.deviceId),
})

export const useSpotifySaveLibraryMutation = defineMutation({
  mutation: (uris: string[]) => spotifyService.saveLibrary(uris),
})

export const useSpotifyRemoveLibraryMutation = defineMutation({
  mutation: (uris: string[]) => spotifyService.removeLibrary(uris),
})

export const useSpotifyCreatePlaylistMutation = defineMutation({
  mutation: (payload: SpotifyCreatePlaylistPayload) =>
    spotifyService.createPlaylist(payload),
})

export const useSpotifyUpdatePlaylistMutation = defineMutation({
  mutation: (vars: {
    playlistId: string
    payload: SpotifyUpdatePlaylistPayload
  }) => spotifyService.updatePlaylist(vars.playlistId, vars.payload),
})

export const useSpotifyDeletePlaylistMutation = defineMutation({
  mutation: (playlistId: string) => spotifyService.deletePlaylist(playlistId),
})

export const useSpotifyRemovePlaylistItemsMutation = defineMutation({
  mutation: (vars: {
    playlistId: string
    items: Array<{ uri: string; positions?: number[] }>
  }) => spotifyService.removePlaylistItems(vars.playlistId, vars.items),
})

export const useSpotifyAddToQueueMutation = defineMutation({
  mutation: (vars: { uri: string; deviceId?: string }) =>
    spotifyService.addToQueue(vars.uri, vars.deviceId),
})

export const useSpotifyAddPlaylistItemsMutation = defineMutation({
  mutation: (vars: {
    playlistId: string
    uris: string[]
    position?: number
  }) =>
    spotifyService.addPlaylistItems(
      vars.playlistId,
      vars.uris,
      vars.position,
    ),
})
