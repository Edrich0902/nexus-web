import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAnalysisStore } from '@stores/analysis/analysis.store'
import type { ViewState } from '@design/templates/types'
import type { AnalysisStatus } from '@/types/analysis/drink-analysis'

const POLL_MS = 2500

/**
 * Loading, view state and "analysis pending" polling shared by the wine,
 * beer and spirit detail pages.
 */
export function useDrinkDetail<T extends { id: number; analysis_status?: AnalysisStatus }>(opts: {
  id: () => number
  item: () => T | null
  loading: () => boolean
  load: (id: number, options?: { silent?: boolean }) => Promise<void>
  analyse: (id: number, force: boolean) => Promise<unknown>
}) {
  const analysis = useAnalysisStore()
  const attempted = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  function stopPoll(): void {
    clearInterval(timer)
    timer = undefined
  }

  function pollIfPending(): void {
    stopPoll()
    if (opts.item()?.analysis_status !== 'pending') return
    const id = opts.id()
    timer = setInterval(() => {
      void opts.load(id, { silent: true }).then(() => {
        if (opts.item()?.analysis_status !== 'pending') stopPoll()
      })
    }, POLL_MS)
  }

  async function load(): Promise<void> {
    stopPoll()
    const id = opts.id()
    attempted.value = false
    if (Number.isFinite(id)) {
      await Promise.all([opts.load(id), analysis.loadQuota()])
    }
    attempted.value = true
    pollIfPending()
  }

  onMounted(load)
  onUnmounted(stopPoll)
  watch(opts.id, load)

  const state = computed<ViewState>(() => {
    if (opts.item()?.id === opts.id()) return 'ready'
    return opts.loading() || !attempted.value ? 'loading' : 'error'
  })

  async function onAnalyse(force?: boolean): Promise<void> {
    await opts.analyse(opts.id(), Boolean(force))
    await analysis.loadQuota()
    pollIfPending()
  }

  return { state, onAnalyse, quota: computed(() => analysis.quota) }
}
