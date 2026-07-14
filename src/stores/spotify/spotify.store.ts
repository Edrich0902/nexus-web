import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useQueryCache } from '@pinia/colada'
import { useToast } from 'primevue/usetoast'
import * as spotifyService from '@services/spotify.service'
import {
  extractApiErrorMessage,
  getRateLimitCooldownRemainingMs,
  isRateLimitError,
  isRateLimited,
  isReauthError,
} from '@lib/api-error'
import {
  spotifyKeys,
  useSpotifyDevicesQuery,
  useSpotifyPlayerQuery,
  useSpotifyPlaylistsQuery,
  useSpotifyRecentlyPlayedQuery,
  useSpotifyStatusQuery,
  useSpotifySuggestionsQuery,
  useSpotifyTasteQuery,
} from '@stores/spotify/spotify.queries'
import {
  useSpotifyCreatePlaylistMutation,
  useSpotifyDeletePlaylistMutation,
  useSpotifyDisconnectMutation,
  useSpotifyAddPlaylistItemsMutation,
  useSpotifyAddToQueueMutation,
  useSpotifyNextMutation,
  useSpotifyPauseMutation,
  useSpotifyPlayMutation,
  useSpotifyPreviousMutation,
  useSpotifyRemoveLibraryMutation,
  useSpotifyRemovePlaylistItemsMutation,
  useSpotifyRepeatMutation,
  useSpotifySaveLibraryMutation,
  useSpotifySeekMutation,
  useSpotifyShuffleMutation,
  useSpotifySyncMutation,
  useSpotifyTransferMutation,
  useSpotifyUpdatePlaylistMutation,
  useSpotifyVolumeMutation,
} from '@stores/spotify/spotify.mutations'
import type {
  SpotifyCreatePlaylistPayload,
  SpotifyFeaturesStatus,
  SpotifyListeningSettings,
  SpotifyPlayPayload,
  SpotifyPlaylist,
  SpotifyQueueResponse,
  SpotifySuggestionItem,
  SpotifyTrackAudioFeatures,
  SpotifyUpdatePlaylistPayload,
} from '@/types/spotify/spotify'

const PLAYER_POLL_MS = 4000
const PLAYER_POLL_MAX_MS = 20000
const HUB_STAGGER_MS = 350

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const useSpotifyStore = defineStore('spotify', () => {
  const toast = useToast()
  const queryCache = useQueryCache()

  const statusQuery = useSpotifyStatusQuery()
  const playerQuery = useSpotifyPlayerQuery()
  const devicesQuery = useSpotifyDevicesQuery()
  const recentlyPlayedQuery = useSpotifyRecentlyPlayedQuery()
  const playlistsQuery = useSpotifyPlaylistsQuery()
  const tasteQuery = useSpotifyTasteQuery()
  const suggestionsQuery = useSpotifySuggestionsQuery()

  const disconnectMutation = useSpotifyDisconnectMutation()
  const syncMutation = useSpotifySyncMutation()
  const playMutation = useSpotifyPlayMutation()
  const pauseMutation = useSpotifyPauseMutation()
  const nextMutation = useSpotifyNextMutation()
  const previousMutation = useSpotifyPreviousMutation()
  const seekMutation = useSpotifySeekMutation()
  const volumeMutation = useSpotifyVolumeMutation()
  const transferMutation = useSpotifyTransferMutation()
  const shuffleMutation = useSpotifyShuffleMutation()
  const repeatMutation = useSpotifyRepeatMutation()
  const saveLibraryMutation = useSpotifySaveLibraryMutation()
  const removeLibraryMutation = useSpotifyRemoveLibraryMutation()
  const createPlaylistMutation = useSpotifyCreatePlaylistMutation()
  const updatePlaylistMutation = useSpotifyUpdatePlaylistMutation()
  const deletePlaylistMutation = useSpotifyDeletePlaylistMutation()
  const removePlaylistItemsMutation = useSpotifyRemovePlaylistItemsMutation()
  const addToQueueMutation = useSpotifyAddToQueueMutation()
  const addPlaylistItemsMutation = useSpotifyAddPlaylistItemsMutation()

  const pollers = ref(0)
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null
  let playerFetchInFlight = false
  let playerPollMs = PLAYER_POLL_MS
  let hubLoadGeneration = 0

  const likedUri = ref<string | null>(null)
  const isLiked = ref(false)
  const likedByUri = ref<Record<string, boolean>>({})
  const controlBusy = ref(false)
  const queueOpen = ref(false)
  const queue = ref<SpotifyQueueResponse | null>(null)
  const queueLoading = ref(false)
  const addToPlaylistUri = ref<string | null>(null)
  let queueRefreshTimer: ReturnType<typeof setInterval> | null = null
  let queueLastFetchedAt = 0

  const trackFeaturesStatus = ref<SpotifyFeaturesStatus>('idle')
  const trackFeatures = ref<SpotifyTrackAudioFeatures | null>(null)
  const trackFeaturesSpotifyId = ref<string | null>(null)
  const similarRecommendations = ref<SpotifySuggestionItem[]>([])
  const similarLoading = ref(false)
  /** Seed we’ve finished fetching for — drives empty vs loading UI. */
  const similarReadySeed = ref<string | null>(null)
  const listeningSettings = ref<SpotifyListeningSettings | null>(null)
  let heartbeatInFlight = false
  let lastHeartbeatSpotifyId: string | null = null
  let autoQueueRunning = false
  let lastAutoQueueSeed: string | null = null
  const autoQueuedUris = new Set<string>()
  /** Seeds that returned no similar tracks — don't re-toast / re-hammer every poll. */
  const autoQueueEmptySeeds = new Set<string>()
  let similarLoadPromise: Promise<void> | null = null
  let similarLoadSeed: string | null = null
  /** Seeds that returned non-empty similar tracks — skip refetch until track changes. */
  const similarFetchedSeeds = new Set<string>()
  /** Seeds that already got a features-ready refresh. */
  const similarFeaturesRefreshed = new Set<string>()
  /** Last attempt time for empty/error fetches — throttle retries (ms since epoch). */
  const similarAttemptAt = new Map<string, number>()
  const SIMILAR_RETRY_MS = 8_000

  const status = computed(() => statusQuery.data.value ?? null)
  const connected = computed(() => status.value?.connected === true)
  const needsReauth = computed(() => status.value?.needs_reauth === true)

  const player = computed(() => playerQuery.data.value ?? null)
  const devices = computed(() => devicesQuery.data.value ?? [])
  const recentlyPlayed = computed(
    () => recentlyPlayedQuery.data.value?.data ?? [],
  )
  const playlists = computed(() => playlistsQuery.data.value?.data ?? [])
  const taste = computed(() => tasteQuery.data.value ?? null)
  const suggestions = computed(() => suggestionsQuery.data.value?.items ?? [])

  const statusLoading = computed(
    () => statusQuery.asyncStatus.value === 'loading' && !status.value,
  )
  const playerLoading = computed(
    () => playerQuery.asyncStatus.value === 'loading' && !player.value,
  )
  const recentlyLoading = computed(
    () =>
      recentlyPlayedQuery.asyncStatus.value === 'loading' &&
      recentlyPlayed.value.length === 0,
  )
  const playlistsLoading = computed(
    () =>
      playlistsQuery.asyncStatus.value === 'loading' &&
      playlists.value.length === 0,
  )
  const tasteLoading = computed(
    () => tasteQuery.asyncStatus.value === 'loading' && !taste.value,
  )

  const currentTrackUri = computed(() => player.value?.item?.uri ?? null)

  watch(
    currentTrackUri,
    async (uri) => {
      likedUri.value = uri
      isLiked.value = uri ? (likedByUri.value[uri] ?? false) : false
      if (!uri || !connected.value) return
      try {
        const result = await spotifyService.libraryContains([uri])
        if (likedUri.value === uri) {
          isLiked.value = result.contains[0] === true
          likedByUri.value = {
            ...likedByUri.value,
            [uri]: isLiked.value,
          }
        }
      } catch {
        // Non-blocking — heart state is best-effort
      }
    },
    { immediate: true },
  )

  async function refreshLikedUris(uris: string[]): Promise<void> {
    const unique = [...new Set(uris.filter(Boolean))]
    if (!unique.length || !connected.value) return

    for (let i = 0; i < unique.length; i += 50) {
      const chunk = unique.slice(i, i + 50)
      try {
        const result = await spotifyService.libraryContains(chunk)
        const next = { ...likedByUri.value }
        chunk.forEach((uri, index) => {
          next[uri] = result.contains[index] === true
        })
        likedByUri.value = next
        if (likedUri.value && likedUri.value in next) {
          isLiked.value = next[likedUri.value] === true
        }
      } catch {
        // Best-effort hearts
      }
    }
  }

  function isUriLiked(uri: string | null | undefined): boolean {
    if (!uri) return false
    return likedByUri.value[uri] === true
  }
  function toastError(error: unknown, fallback: string): void {
    if (isReauthError(error)) {
      void statusQuery.refetch()
    }
    toast.add({
      severity: 'error',
      summary: 'Spotify',
      detail: extractApiErrorMessage(error, fallback),
      life: 3500,
    })
  }

  async function invalidateListening(): Promise<void> {
    await Promise.all([
      queryCache.invalidateQueries({ key: spotifyKeys.status }),
      queryCache.invalidateQueries({ key: spotifyKeys.recentlyPlayed }),
      queryCache.invalidateQueries({ key: spotifyKeys.playlists }),
      queryCache.invalidateQueries({ key: spotifyKeys.taste }),
      queryCache.invalidateQueries({ key: spotifyKeys.suggestions }),
    ])
  }

  async function refetchPlayer(): Promise<void> {
    if (!connected.value && !needsReauth.value) return
    if (playerFetchInFlight) return
    if (isRateLimited()) return

    playerFetchInFlight = true
    try {
      await playerQuery.refetch()
      if (playerPollMs !== PLAYER_POLL_MS) {
        playerPollMs = PLAYER_POLL_MS
        restartPollTimer()
      }
      void sendListeningHeartbeat()
    } catch (error) {
      if (isReauthError(error)) {
        await statusQuery.refetch()
      }
      if (isRateLimitError(error)) {
        playerPollMs = Math.min(playerPollMs * 2, PLAYER_POLL_MAX_MS)
        restartPollTimer()
      }
    } finally {
      playerFetchInFlight = false
    }
  }

  async function sendListeningHeartbeat(): Promise<void> {
    if (!connected.value) return
    if (heartbeatInFlight || isRateLimited()) return

    const item = player.value?.item
    const spotifyId = item?.id
    if (!spotifyId || item?.type === 'episode') {
      if (trackFeaturesSpotifyId.value !== null) {
        trackFeaturesStatus.value = 'idle'
        trackFeatures.value = null
        trackFeaturesSpotifyId.value = null
        similarRecommendations.value = []
        similarReadySeed.value = null
        similarLoading.value = false
        similarFetchedSeeds.clear()
        similarFeaturesRefreshed.clear()
        similarAttemptAt.clear()
        autoQueueEmptySeeds.clear()
      }
      return
    }

    if (lastHeartbeatSpotifyId !== spotifyId) {
      lastHeartbeatSpotifyId = spotifyId
      autoQueuedUris.clear()
      autoQueueEmptySeeds.clear()
      lastAutoQueueSeed = null
      similarFetchedSeeds.clear()
      similarFeaturesRefreshed.clear()
      similarAttemptAt.clear()
      if (trackFeaturesSpotifyId.value !== spotifyId) {
        trackFeaturesStatus.value = 'idle'
        trackFeatures.value = null
        trackFeaturesSpotifyId.value = spotifyId
        similarRecommendations.value = []
        similarReadySeed.value = null
        similarLoading.value = true
      }
    }

    heartbeatInFlight = true
    try {
      const albumImages = item.album?.images ?? []
      const response = await spotifyService.postListeningHeartbeat({
        spotify_id: spotifyId,
        progress_ms: player.value?.progress_ms ?? 0,
        duration_ms: item.duration_ms ?? null,
        is_playing: player.value?.is_playing ?? false,
        name: item.name ?? null,
        uri: item.uri ?? null,
        album_name: item.album?.name ?? null,
        album_image_url: albumImages[0]?.url ?? null,
        artists: item.artists ?? null,
      })

      trackFeaturesSpotifyId.value = response.spotify_id
      if (trackFeaturesStatus.value !== response.features_status) {
        trackFeaturesStatus.value = response.features_status
      }
      if (!featuresEqual(trackFeatures.value, response.features)) {
        trackFeatures.value = response.features
      }

      const nextSettings = {
        engage_progress_ms:
          listeningSettings.value?.engage_progress_ms ?? 30_000,
        engage_ratio: listeningSettings.value?.engage_ratio ?? 0.25,
        full_listen_ratio: listeningSettings.value?.full_listen_ratio ?? 0.5,
        auto_queue_enabled: response.settings.auto_queue_enabled,
        auto_queue_min_upcoming: response.settings.auto_queue_min_upcoming,
        auto_queue_batch: response.settings.auto_queue_batch,
      }
      if (
        !listeningSettings.value ||
        listeningSettings.value.auto_queue_enabled !==
          nextSettings.auto_queue_enabled ||
        listeningSettings.value.auto_queue_min_upcoming !==
          nextSettings.auto_queue_min_upcoming ||
        listeningSettings.value.auto_queue_batch !== nextSettings.auto_queue_batch
      ) {
        listeningSettings.value = nextSettings
      }

      // Don't wait for engage/features — toggle-auto-queue used to be the only
      // path that force-fetched. Refresh once when acoustics land for better targets.
      const featuresJustReady =
        response.features_status === 'ready' &&
        !similarFeaturesRefreshed.has(spotifyId)
      if (featuresJustReady) {
        similarFeaturesRefreshed.add(spotifyId)
      }
      void loadSimilarRecommendations(spotifyId, {
        force: featuresJustReady,
      }).then(() => {
        if (listeningSettings.value?.auto_queue_enabled) {
          void maybeAutoQueue(spotifyId)
        }
      })
    } catch {
      // Heartbeat is best-effort; player poll should keep working.
    } finally {
      heartbeatInFlight = false
    }
  }

  function featuresEqual(
    a: SpotifyTrackAudioFeatures | null,
    b: SpotifyTrackAudioFeatures | null,
  ): boolean {
    if (a === b) return true
    if (!a || !b) return false
    return (
      a.provider === b.provider &&
      a.acousticness === b.acousticness &&
      a.danceability === b.danceability &&
      a.energy === b.energy &&
      a.instrumentalness === b.instrumentalness &&
      a.key === b.key &&
      a.liveness === b.liveness &&
      a.loudness === b.loudness &&
      a.mode === b.mode &&
      a.speechiness === b.speechiness &&
      a.tempo === b.tempo &&
      a.valence === b.valence
    )
  }

  async function loadSimilarRecommendations(
    seed: string,
    options: { force?: boolean } = {},
  ): Promise<void> {
    // Join an in-flight request before throttle/cache short-circuits.
    if (similarLoadPromise && similarLoadSeed === seed && !options.force) {
      await similarLoadPromise
      return
    }

    // Non-empty results are sticky until the track changes. Empty/errors retry
    // on a throttle so the panel can appear without toggling auto-queue.
    if (!options.force && similarFetchedSeeds.has(seed)) {
      return
    }
    if (!options.force) {
      const lastAttempt = similarAttemptAt.get(seed)
      if (
        lastAttempt !== undefined &&
        Date.now() - lastAttempt < SIMILAR_RETRY_MS
      ) {
        return
      }
    }
    if (options.force) {
      similarFetchedSeeds.delete(seed)
      similarAttemptAt.delete(seed)
    }

    similarLoading.value = true
    similarLoadSeed = seed
    similarAttemptAt.set(seed, Date.now())
    similarLoadPromise = (async () => {
      try {
        const result = await spotifyService.getSimilarRecommendations(seed, 10)
        if (trackFeaturesSpotifyId.value === seed) {
          similarRecommendations.value = result.items
          similarReadySeed.value = seed
        }
        if (result.items.length > 0) {
          similarFetchedSeeds.add(seed)
        }
      } catch {
        // Leave seed uncached so a later heartbeat can retry after throttle.
        if (trackFeaturesSpotifyId.value === seed) {
          similarReadySeed.value = seed
        }
      } finally {
        if (similarLoadSeed === seed) {
          similarLoading.value = false
          similarLoadPromise = null
          similarLoadSeed = null
        }
      }
    })()

    await similarLoadPromise
  }

  async function loadListeningSettings(): Promise<void> {
    try {
      listeningSettings.value = await spotifyService.getListeningSettings()
    } catch {
      // ignore
    }
  }

  async function setAutoQueueEnabled(enabled: boolean): Promise<boolean> {
    try {
      listeningSettings.value = await spotifyService.updateListeningSettings({
        auto_queue_enabled: enabled,
      })
      toast.add({
        severity: 'success',
        summary: enabled ? 'Auto-queue on' : 'Auto-queue off',
        detail: enabled
          ? 'Similar tracks will be added for the current song'
          : 'Queue stays manual',
        life: 2500,
      })
      if (enabled) {
        const seed =
          trackFeaturesSpotifyId.value ?? player.value?.item?.id ?? null
        if (seed) {
          void maybeAutoQueue(seed, { force: true })
        }
      }
      return true
    } catch (error) {
      toastError(error, 'Unable to update listening settings')
      return false
    }
  }

  async function maybeAutoQueue(
    seed: string,
    options: { force?: boolean } = {},
  ): Promise<void> {
    const settings = listeningSettings.value
    if (!settings?.auto_queue_enabled || autoQueueRunning) return

    if (options.force) {
      autoQueueEmptySeeds.delete(seed)
    } else if (autoQueueEmptySeeds.has(seed)) {
      // Already warned once for this track — stay quiet until the track changes.
      return
    }

    // First injection for a seed always runs. Refills only when the upcoming
    // queue is thin — Spotify autoplay often keeps queue length high during
    // single-track listening, which previously blocked all auto-queue adds.
    const alreadySeeded = lastAutoQueueSeed === seed && autoQueuedUris.size > 0

    autoQueueRunning = true
    try {
      let upcomingUris = new Set<string>()
      let upcomingCount = 0
      try {
        const currentQueue = await spotifyService.getQueue()
        queue.value = currentQueue
        queueLastFetchedAt = Date.now()
        upcomingCount = currentQueue.queue?.length ?? 0
        upcomingUris = new Set(
          (currentQueue.queue ?? [])
            .map((item) => item.uri)
            .filter((uri): uri is string => Boolean(uri)),
        )
      } catch {
        // Queue fetch can fail when idle; still attempt adds for an active player.
      }

      if (
        alreadySeeded &&
        !options.force &&
        upcomingCount >= settings.auto_queue_min_upcoming
      ) {
        return
      }

      await loadSimilarRecommendations(seed, { force: options.force === true })
      if (similarRecommendations.value.length === 0) {
        const firstEmptyForSeed = !autoQueueEmptySeeds.has(seed)
        autoQueueEmptySeeds.add(seed)
        if (firstEmptyForSeed) {
          toast.add({
            severity: 'warn',
            summary: 'Auto-queue',
            detail: 'No similar tracks available to queue yet',
            life: 3000,
          })
        }
        return
      }

      const batch = settings.auto_queue_batch
      const deviceId = player.value?.device?.id
      let added = 0

      for (const item of similarRecommendations.value) {
        if (added >= batch) break
        const uri = item.track.uri
        if (!uri || autoQueuedUris.has(uri) || upcomingUris.has(uri)) continue
        try {
          await addToQueueMutation.mutateAsync({ uri, deviceId })
          autoQueuedUris.add(uri)
          added += 1
        } catch (error) {
          toastError(error, 'Unable to auto-queue a similar track')
          break
        }
      }

      if (added > 0) {
        lastAutoQueueSeed = seed
        toast.add({
          severity: 'success',
          summary: 'Auto-queue',
          detail:
            added === 1
              ? 'Added 1 similar track to your queue'
              : `Added ${added} similar tracks to your queue`,
          life: 2500,
        })
        if (queueOpen.value) await fetchQueue(true)
      }
    } finally {
      autoQueueRunning = false
    }
  }

  function clearPollTimer(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function restartPollTimer(): void {
    clearPollTimer()
    ensurePollTimer()
  }

  function ensurePollTimer(): void {
    if (pollTimer || pollers.value <= 0) return
    if (typeof document !== 'undefined' && document.hidden) return

    pollTimer = setInterval(() => {
      void refetchPlayer()
    }, playerPollMs)
  }

  function startPlayerPolling(): void {
    pollers.value += 1
    if (pollers.value === 1) {
      void refetchPlayer()
      ensurePollTimer()
      if (typeof document !== 'undefined' && !visibilityHandler) {
        visibilityHandler = () => {
          if (document.hidden) {
            clearPollTimer()
          } else {
            void refetchPlayer()
            ensurePollTimer()
          }
        }
        document.addEventListener('visibilitychange', visibilityHandler)
      }
    }
  }

  function stopPlayerPolling(): void {
    pollers.value = Math.max(0, pollers.value - 1)
    if (pollers.value === 0) {
      clearPollTimer()
      if (visibilityHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityHandler)
        visibilityHandler = null
      }
    }
  }

  async function loadHub(force = false): Promise<void> {
    const generation = ++hubLoadGeneration
    await statusQuery.refetch()
    if (!connected.value) return
    if (generation !== hubLoadGeneration) return

    // Critical path first — keep player usable, then fill the hub gradually.
    const phases: Array<Array<() => Promise<unknown>>> = [
      [() => playerQuery.refetch()],
      [() => devicesQuery.refetch(), () => recentlyPlayedQuery.refetch()],
      [() => playlistsQuery.refetch()],
      [
        () => tasteQuery.refetch(),
        () => suggestionsQuery.refetch(),
        () => loadListeningSettings(),
      ],
    ]

    for (const [index, phase] of phases.entries()) {
      if (generation !== hubLoadGeneration) return
      if (isRateLimited()) {
        await delay(getCooldownWaitMs())
      }
      if (index > 0 && !force) {
        await delay(HUB_STAGGER_MS * index)
      }
      if (generation !== hubLoadGeneration) return
      await Promise.allSettled(phase.map((task) => task()))
    }
  }

  function getCooldownWaitMs(): number {
    return Math.max(getRateLimitCooldownRemainingMs(), 1500)
  }

  async function connect(): Promise<void> {
    try {
      const { url } = await spotifyService.getConnectUrl()
      window.location.assign(url)
    } catch (error) {
      toastError(error, 'Unable to start Spotify connect')
    }
  }

  async function disconnect(): Promise<boolean> {
    try {
      await disconnectMutation.mutateAsync()
      await invalidateListening()
      await queryCache.invalidateQueries({ key: spotifyKeys.player })
      await queryCache.invalidateQueries({ key: spotifyKeys.devices })
      toast.add({
        severity: 'success',
        summary: 'Disconnected',
        detail: 'Spotify account unlinked',
        life: 2500,
      })
      return true
    } catch (error) {
      toastError(error, 'Unable to disconnect Spotify')
      return false
    }
  }

  async function syncNow(): Promise<boolean> {
    try {
      const result = await syncMutation.mutateAsync()
      toast.add({
        severity: 'info',
        summary: 'Sync queued',
        detail: result.message,
        life: 2500,
      })
      window.setTimeout(() => {
        void invalidateListening()
      }, 2500)
      return true
    } catch (error) {
      toastError(error, 'Unable to sync Spotify data')
      return false
    }
  }

  async function handleOAuthReturn(
    connectedFlag: string | null,
    errorCode: string | null,
  ): Promise<void> {
    if (connectedFlag === '1') {
      toast.add({
        severity: 'success',
        summary: 'Spotify connected',
        detail: 'Pulling your listening data…',
        life: 3000,
      })
      await loadHub(true)
      await syncNow()
      return
    }

    if (connectedFlag === '0') {
      toast.add({
        severity: 'error',
        summary: 'Connection failed',
        detail: errorCode
          ? `Spotify returned: ${errorCode}`
          : 'Could not link Spotify',
        life: 4000,
      })
      await statusQuery.refetch()
    }
  }

  async function runControl(
    action: () => Promise<unknown>,
    fallback: string,
  ): Promise<boolean> {
    controlBusy.value = true
    try {
      await action()
      await refetchPlayer()
      return true
    } catch (error) {
      toastError(error, fallback)
      return false
    } finally {
      controlBusy.value = false
    }
  }

  async function play(payload: SpotifyPlayPayload = {}): Promise<boolean> {
    return runControl(
      () => playMutation.mutateAsync(payload),
      'Unable to start playback',
    )
  }

  async function pause(): Promise<boolean> {
    const deviceId = player.value?.device?.id
    return runControl(
      () => pauseMutation.mutateAsync(deviceId),
      'Unable to pause',
    )
  }

  async function togglePlayPause(): Promise<boolean> {
    if (player.value?.is_playing) return pause()
    return play()
  }

  async function next(): Promise<boolean> {
    const deviceId = player.value?.device?.id
    return runControl(
      () => nextMutation.mutateAsync(deviceId),
      'Unable to skip',
    )
  }

  async function previous(): Promise<boolean> {
    const deviceId = player.value?.device?.id
    return runControl(
      () => previousMutation.mutateAsync(deviceId),
      'Unable to go previous',
    )
  }

  async function seek(positionMs: number): Promise<boolean> {
    const deviceId = player.value?.device?.id
    return runControl(
      () => seekMutation.mutateAsync({ positionMs, deviceId }),
      'Unable to seek',
    )
  }

  async function setVolume(volumePercent: number): Promise<boolean> {
    const deviceId = player.value?.device?.id
    const clamped = Math.max(0, Math.min(100, Math.round(volumePercent)))
    return runControl(
      () => volumeMutation.mutateAsync({ volumePercent: clamped, deviceId }),
      'Unable to set volume',
    )
  }

  async function transfer(deviceId: string, playAfter = true): Promise<boolean> {
    return runControl(
      () =>
        transferMutation.mutateAsync({
          device_ids: [deviceId],
          play: playAfter,
        }),
      'Unable to transfer playback',
    )
  }

  async function refreshDevices(): Promise<void> {
    try {
      await devicesQuery.refetch()
    } catch (error) {
      toastError(error, 'Unable to load devices')
    }
  }

  async function setShuffle(state: boolean): Promise<boolean> {
    const deviceId = player.value?.device?.id
    return runControl(
      () => shuffleMutation.mutateAsync({ state, deviceId }),
      'Unable to update shuffle',
    )
  }

  async function setRepeat(
    state: 'track' | 'context' | 'off',
  ): Promise<boolean> {
    const deviceId = player.value?.device?.id
    return runControl(
      () => repeatMutation.mutateAsync({ state, deviceId }),
      'Unable to update repeat',
    )
  }

  async function toggleLike(): Promise<boolean> {
    const uri = currentTrackUri.value
    if (!uri) return false
    return toggleLikeUri(uri)
  }

  async function toggleLikeUri(uri: string): Promise<boolean> {
    if (!uri) return false
    controlBusy.value = true
    const wasLiked = isUriLiked(uri) || (uri === likedUri.value && isLiked.value)
    try {
      if (wasLiked) {
        await removeLibraryMutation.mutateAsync([uri])
        likedByUri.value = { ...likedByUri.value, [uri]: false }
        if (uri === likedUri.value) isLiked.value = false
      } else {
        await saveLibraryMutation.mutateAsync([uri])
        likedByUri.value = { ...likedByUri.value, [uri]: true }
        if (uri === likedUri.value) isLiked.value = true
      }
      return true
    } catch (error) {
      toastError(error, 'Unable to update library')
      return false
    } finally {
      controlBusy.value = false
    }
  }

  async function playTrackUri(uri: string): Promise<boolean> {
    return play({ uris: [uri] })
  }

  async function fetchQueue(force = false): Promise<SpotifyQueueResponse | null> {
    if (!connected.value) return null
    const now = Date.now()
    if (!force && queue.value && now - queueLastFetchedAt < 2500) {
      return queue.value
    }
    queueLoading.value = true
    try {
      const data = await spotifyService.getQueue()
      queue.value = data
      queueLastFetchedAt = Date.now()
      return data
    } catch (error) {
      toastError(error, 'Unable to load queue')
      return null
    } finally {
      queueLoading.value = false
    }
  }

  function clearQueueRefreshTimer(): void {
    if (queueRefreshTimer) {
      clearInterval(queueRefreshTimer)
      queueRefreshTimer = null
    }
  }

  function openQueuePanel(): void {
    queueOpen.value = true
    void fetchQueue(true)
    clearQueueRefreshTimer()
    queueRefreshTimer = setInterval(() => {
      if (queueOpen.value) void fetchQueue(true)
    }, 10000)
  }

  function closeQueuePanel(): void {
    queueOpen.value = false
    clearQueueRefreshTimer()
  }

  async function queueTrack(uri: string): Promise<boolean> {
    const deviceId = player.value?.device?.id
    controlBusy.value = true
    try {
      await addToQueueMutation.mutateAsync({ uri, deviceId })
      toast.add({
        severity: 'success',
        summary: 'Queued',
        detail: 'Track added to queue',
        life: 2000,
      })
      if (queueOpen.value) await fetchQueue(true)
      return true
    } catch (error) {
      toastError(error, 'Unable to add to queue')
      return false
    } finally {
      controlBusy.value = false
    }
  }

  function openAddToPlaylist(uri: string): void {
    addToPlaylistUri.value = uri
  }

  function closeAddToPlaylist(): void {
    addToPlaylistUri.value = null
  }

  async function playlistsContainingUri(uri: string): Promise<string[]> {
    try {
      const result = await spotifyService.playlistsContainingUri(uri)
      return result.playlist_ids
    } catch (error) {
      toastError(error, 'Unable to check playlist membership')
      return []
    }
  }

  async function addTracksToPlaylist(
    playlistId: string,
    uris: string[],
    options?: { close?: boolean },
  ): Promise<boolean> {
    try {
      await addPlaylistItemsMutation.mutateAsync({ playlistId, uris })
      await queryCache.invalidateQueries({ key: spotifyKeys.playlists })
      await queryCache.invalidateQueries({
        key: spotifyKeys.playlist(playlistId),
      })
      toast.add({
        severity: 'success',
        summary: 'Added to playlist',
        detail: uris.length === 1 ? 'Track added' : `${uris.length} tracks added`,
        life: 2200,
      })
      if (options?.close !== false) {
        closeAddToPlaylist()
      }
      return true
    } catch (error) {
      toastError(error, 'Unable to add to playlist')
      return false
    }
  }

  async function removeTrackFromPlaylist(
    playlistId: string,
    uri: string,
  ): Promise<boolean> {
    try {
      await removePlaylistItemsMutation.mutateAsync({
        playlistId,
        items: [{ uri }],
      })
      await queryCache.invalidateQueries({
        key: spotifyKeys.playlist(playlistId),
      })
      await queryCache.invalidateQueries({ key: spotifyKeys.playlists })
      toast.add({
        severity: 'success',
        summary: 'Removed from playlist',
        detail: 'Track removed',
        life: 2200,
      })
      return true
    } catch (error) {
      toastError(error, 'Unable to remove from playlist')
      return false
    }
  }
  async function playPlaylist(
    contextUri: string,
    offsetPosition?: number,
  ): Promise<boolean> {
    return play({
      context_uri: contextUri,
      ...(offsetPosition !== undefined
        ? { offset: { position: offsetPosition } }
        : {}),
    })
  }

  async function fetchPlaylist(
    playlistId: string,
    refresh = false,
  ): Promise<SpotifyPlaylist | null> {
    try {
      return await spotifyService.getPlaylist(playlistId, refresh)
    } catch (error) {
      toastError(error, 'Unable to load playlist')
      return null
    }
  }

  async function createPlaylist(
    payload: SpotifyCreatePlaylistPayload,
  ): Promise<SpotifyPlaylist | null> {
    try {
      const playlist = await createPlaylistMutation.mutateAsync(payload)
      await queryCache.invalidateQueries({ key: spotifyKeys.playlists })
      toast.add({
        severity: 'success',
        summary: 'Playlist created',
        detail: playlist.name,
        life: 2500,
      })
      return playlist
    } catch (error) {
      toastError(error, 'Unable to create playlist')
      return null
    }
  }

  async function updatePlaylist(
    playlistId: string,
    payload: SpotifyUpdatePlaylistPayload,
  ): Promise<SpotifyPlaylist | null> {
    try {
      const playlist = await updatePlaylistMutation.mutateAsync({
        playlistId,
        payload,
      })
      await queryCache.invalidateQueries({ key: spotifyKeys.playlists })
      await queryCache.invalidateQueries({
        key: spotifyKeys.playlist(playlistId),
      })
      toast.add({
        severity: 'success',
        summary: 'Playlist updated',
        detail: playlist.name,
        life: 2000,
      })
      return playlist
    } catch (error) {
      toastError(error, 'Unable to update playlist')
      return null
    }
  }

  async function deletePlaylist(playlistId: string): Promise<boolean> {
    try {
      await deletePlaylistMutation.mutateAsync(playlistId)
      await queryCache.invalidateQueries({ key: spotifyKeys.playlists })
      toast.add({
        severity: 'success',
        summary: 'Playlist removed',
        detail: 'Unfollowed from your Spotify library',
        life: 2500,
      })
      return true
    } catch (error) {
      toastError(error, 'Unable to remove playlist')
      return false
    }
  }

  async function removePlaylistTrack(
    playlistId: string,
    uri: string,
    position: number,
  ): Promise<boolean> {
    try {
      await removePlaylistItemsMutation.mutateAsync({
        playlistId,
        items: [{ uri, positions: [position] }],
      })
      await queryCache.invalidateQueries({
        key: spotifyKeys.playlist(playlistId),
      })
      await queryCache.invalidateQueries({ key: spotifyKeys.playlists })
      return true
    } catch (error) {
      toastError(error, 'Unable to remove track')
      return false
    }
  }

  return {
    status,
    connected,
    needsReauth,
    player,
    devices,
    recentlyPlayed,
    playlists,
    taste,
    suggestions,
    trackFeaturesStatus,
    trackFeatures,
    trackFeaturesSpotifyId,
    similarRecommendations,
    similarLoading,
    similarReadySeed,
    listeningSettings,
    statusLoading,
    playerLoading,
    recentlyLoading,
    playlistsLoading,
    tasteLoading,
    isLiked,
    likedByUri,
    controlBusy,
    queueOpen,
    queue,
    queueLoading,
    addToPlaylistUri,
    syncPending: computed(() => syncMutation.asyncStatus.value === 'loading'),
    loadHub,
    connect,
    disconnect,
    syncNow,
    handleOAuthReturn,
    startPlayerPolling,
    stopPlayerPolling,
    refetchPlayer,
    refreshDevices,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume,
    transfer,
    setShuffle,
    setRepeat,
    toggleLike,
    toggleLikeUri,
    isUriLiked,
    refreshLikedUris,
    playTrackUri,
    playPlaylist,
    fetchPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removePlaylistTrack,
    fetchQueue,
    openQueuePanel,
    closeQueuePanel,
    queueTrack,
    openAddToPlaylist,
    closeAddToPlaylist,
    playlistsContainingUri,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    setAutoQueueEnabled,
    loadSimilarRecommendations,
  }
})
