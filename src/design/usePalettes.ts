import { getCurrentInstance, onBeforeUnmount, reactive, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { getPalettes } from '@services/hub.service'
import type { ImagePalette } from '@/types/hub/hub'

const BATCH = 60
const RETRY_MS = 2000
const MAX_TRIES = 5

/** Session-wide: palettes never change for a URL. */
const ready = reactive(new Map<string, ImagePalette>())
const tries = new Map<string, number>()

/**
 * Palettes for a page of artwork in one request. New images are extracted in
 * the background by the API, so URLs still missing are asked again with
 * backoff (about half a minute in total) before giving up for the session.
 */
export function usePalettes(urls: MaybeRefOrGetter<(string | null | undefined)[]>): (url: string | null | undefined) => ImagePalette | null {
  let timer: ReturnType<typeof setTimeout> | undefined
  let alive = true

  function wanted(): string[] {
    const list = toValue(urls).filter((u): u is string => Boolean(u?.startsWith('https://')))
    return [...new Set(list)].filter((u) => !ready.has(u) && (tries.get(u) ?? 0) < MAX_TRIES)
  }

  async function fetchMissing(): Promise<void> {
    clearTimeout(timer)
    const missing = wanted()
    if (!missing.length) return
    for (let i = 0; i < missing.length; i += BATCH) {
      const chunk = missing.slice(i, i + BATCH)
      chunk.forEach((u) => tries.set(u, (tries.get(u) ?? 0) + 1))
      try {
        const { palettes } = await getPalettes(chunk)
        Object.entries(palettes).forEach(([u, p]) => ready.set(u, p))
      } catch {
        chunk.forEach((u) => tries.set(u, MAX_TRIES))
      }
    }
    const left = wanted()
    if (alive && left.length) {
      const attempt = Math.min(...left.map((u) => tries.get(u) ?? 1))
      timer = setTimeout(() => void fetchMissing(), RETRY_MS * 2 ** (attempt - 1))
    }
  }

  watch(() => toValue(urls).join('\n'), () => void fetchMissing(), { immediate: true })

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      alive = false
      clearTimeout(timer)
    })
  }

  return (url) => (url ? (ready.get(url) ?? null) : null)
}
