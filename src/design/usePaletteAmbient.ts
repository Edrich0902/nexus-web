import { getCurrentInstance, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { getPalette } from '@services/hub.service'
import type { ImagePalette } from '@/types/hub/hub'
import { ambientFromPalette, useAmbient } from './ambient'
import type { Ambient } from './tokens'

const RETRY_MS = 2500
const MAX_TRIES = 4

/** Palettes are immutable per URL, so one lookup per session is enough. */
const cache = new Map<string, ImagePalette | null>()

/**
 * Tint the app from an image's extracted palette (label photo, cover art).
 * The API extracts palettes in the background, so a `pending` answer is
 * retried a few times. Until a palette exists, `fallback` (or the route's
 * section ambient) is used.
 */
export function usePaletteAmbient(
  url: MaybeRefOrGetter<string | null | undefined>,
  fallback?: MaybeRefOrGetter<Partial<Ambient> | null | undefined>,
): void {
  const palette = ref<ImagePalette | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0

  async function lookup(target: string, run: number, attempt: number): Promise<void> {
    if (cache.has(target)) {
      palette.value = cache.get(target) ?? null
      return
    }
    try {
      const res = await getPalette(target)
      if (run !== generation) return
      if (res.status === 'pending' && attempt < MAX_TRIES) {
        timer = setTimeout(() => void lookup(target, run, attempt + 1), RETRY_MS)
        return
      }
      if (res.status !== 'pending') cache.set(target, res.palette)
      palette.value = res.palette
    } catch {
      if (run === generation) cache.set(target, null)
    }
  }

  watch(
    () => toValue(url),
    (target) => {
      generation++
      clearTimeout(timer)
      palette.value = null
      if (target?.startsWith('https://')) void lookup(target, generation, 1)
    },
    { immediate: true },
  )

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      generation++
      clearTimeout(timer)
    })
  }

  useAmbient(() => (palette.value ? ambientFromPalette(palette.value) : toValue(fallback)))
}
