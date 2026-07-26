import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef } from 'vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

const TICK_MS = 250

export interface SpotifyProgress {
  /** Position to render — seek preview while dragging, local clock otherwise. */
  progressMs: ComputedRef<number>
  durationMs: ComputedRef<number>
  progressLabel: ComputedRef<string>
  durationLabel: ComputedRef<string>
  /** True while the user is dragging the seek handle. */
  seeking: ComputedRef<boolean>
  onSeekInput: (value: number) => void
  onSeekCommit: (value: number) => Promise<void>
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Extrapolates playback position between the store's player polls so the seek
 * bar moves continuously, resyncing whenever Spotify reports a new snapshot.
 */
export function useSpotifyProgress(): SpotifyProgress {
  const spotify = useSpotifyStore()

  const seekPreview = ref<number | null>(null)
  const localProgressMs = ref(0)

  let tickTimer: ReturnType<typeof setInterval> | null = null
  let lastTickAt = 0

  const isPlaying = computed(() => spotify.player?.is_playing === true)
  const durationMs = computed(() => spotify.player?.item?.duration_ms ?? 0)
  const progressMs = computed(() => seekPreview.value ?? localProgressMs.value)
  const progressLabel = computed(() => formatTime(progressMs.value))
  const durationLabel = computed(() => formatTime(durationMs.value))
  const seeking = computed(() => seekPreview.value !== null)

  /** Resync local clock whenever Spotify reports a new progress snapshot. */
  watch(
    () => [
      spotify.player?.progress_ms,
      spotify.player?.item?.uri,
      spotify.player?.is_playing,
    ] as const,
    ([progress, , playing]) => {
      if (seekPreview.value !== null) return
      if (typeof progress === 'number') {
        localProgressMs.value = progress
        lastTickAt = performance.now()
      } else if (!playing) {
        localProgressMs.value = 0
      }
    },
    { immediate: true },
  )

  function startTicker(): void {
    stopTicker()
    lastTickAt = performance.now()
    tickTimer = setInterval(() => {
      if (seekPreview.value !== null) return
      if (!isPlaying.value) {
        lastTickAt = performance.now()
        return
      }

      const now = performance.now()
      const delta = now - lastTickAt
      lastTickAt = now
      const duration = durationMs.value
      const next = localProgressMs.value + delta
      localProgressMs.value =
        duration > 0 ? Math.min(next, duration) : Math.max(0, next)
    }, TICK_MS)
  }

  function stopTicker(): void {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  function onSeekInput(value: number): void {
    seekPreview.value = value
  }

  async function onSeekCommit(value: number): Promise<void> {
    seekPreview.value = value
    localProgressMs.value = value
    lastTickAt = performance.now()
    await spotify.seek(value)
    seekPreview.value = null
  }

  onMounted(startTicker)
  onUnmounted(stopTicker)

  return {
    progressMs,
    durationMs,
    progressLabel,
    durationLabel,
    seeking,
    onSeekInput,
    onSeekCommit,
  }
}
