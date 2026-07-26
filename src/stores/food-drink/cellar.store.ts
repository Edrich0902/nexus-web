import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as cellarService from '@services/food-drink/cellar.service'
import type {
  CellarWine,
  StoreCellarWinePayload,
  StoreTastingPayload,
  WineApiQuota,
  WineCandidatesResponse,
} from '@/types/food-drink/cellar'

export const useCellarStore = defineStore('cellar', () => {
  const toast = useToast()

  const wines = ref<CellarWine[]>([])
  const winesLoading = ref(false)
  const winesTotal = ref(0)
  const wine = ref<CellarWine | null>(null)
  const wineLoading = ref(false)
  const quota = ref<WineApiQuota | null>(null)
  const candidates = ref<WineCandidatesResponse | null>(null)
  const candidatesLoading = ref(false)
  const saving = ref(false)

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: 'Cellar',
      detail: extractApiErrorMessage(error, fallback),
      life: 4000,
    })
  }

  async function loadWines(params?: {
    q?: string
    match_status?: string
    page?: number
  }): Promise<void> {
    winesLoading.value = true
    try {
      const page = await cellarService.listWines({
        ...params,
        per_page: 24,
      })
      wines.value = page.data
      winesTotal.value = page.meta?.total ?? page.data.length
    } catch (error) {
      wines.value = []
      toastError(error, 'Could not load wines.')
    } finally {
      winesLoading.value = false
    }
  }

  async function loadWine(id: number): Promise<void> {
    wineLoading.value = true
    try {
      wine.value = await cellarService.getWine(id)
    } catch (error) {
      wine.value = null
      toastError(error, 'Could not load wine.')
    } finally {
      wineLoading.value = false
    }
  }

  async function loadQuota(): Promise<void> {
    try {
      quota.value = await cellarService.getQuota()
    } catch {
      quota.value = null
    }
  }

  async function createWine(
    payload: StoreCellarWinePayload,
  ): Promise<CellarWine | null> {
    saving.value = true
    try {
      const created = await cellarService.createWine(payload)
      toast.add({
        severity: 'success',
        summary: 'Cellar',
        detail: 'Wine added to your journal.',
        life: 3000,
      })
      await loadWines()
      return created
    } catch (error) {
      toastError(error, 'Could not create wine.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateWine(
    id: number,
    payload: Partial<StoreCellarWinePayload>,
  ): Promise<void> {
    saving.value = true
    try {
      wine.value = await cellarService.updateWine(id, payload)
      toast.add({
        severity: 'success',
        summary: 'Cellar',
        detail: 'Wine updated.',
        life: 2500,
      })
    } catch (error) {
      toastError(error, 'Could not update wine.')
    } finally {
      saving.value = false
    }
  }

  async function removeWine(id: number): Promise<boolean> {
    try {
      await cellarService.deleteWine(id)
      toast.add({
        severity: 'success',
        summary: 'Cellar',
        detail: 'Wine removed.',
        life: 2500,
      })
      return true
    } catch (error) {
      toastError(error, 'Could not delete wine.')
      return false
    }
  }

  async function fetchCandidates(wineId: number, q?: string): Promise<void> {
    candidatesLoading.value = true
    try {
      candidates.value = await cellarService.getCandidates(wineId, q)
      if (candidates.value.quota) {
        quota.value = candidates.value.quota
      }
    } catch (error) {
      candidates.value = null
      toastError(error, 'Could not search WineAPI.')
    } finally {
      candidatesLoading.value = false
    }
  }

  async function confirmMatch(
    wineId: number,
    wineapiId: string,
  ): Promise<void> {
    saving.value = true
    try {
      wine.value = await cellarService.confirmMatch(wineId, wineapiId)
      toast.add({
        severity: 'success',
        summary: 'Cellar',
        detail: 'Wine matched — enrichment queued.',
        life: 3000,
      })
      await loadQuota()
    } catch (error) {
      toastError(error, 'Could not confirm match.')
    } finally {
      saving.value = false
    }
  }

  async function markNoMatch(wineId: number): Promise<void> {
    wine.value = await cellarService.markNoMatch(wineId)
  }

  async function addTasting(
    wineId: number,
    payload: StoreTastingPayload,
  ): Promise<void> {
    saving.value = true
    try {
      await cellarService.createTasting(wineId, payload)
      await loadWine(wineId)
      toast.add({
        severity: 'success',
        summary: 'Cellar',
        detail: 'Tasting logged.',
        life: 2500,
      })
    } catch (error) {
      toastError(error, 'Could not save tasting.')
    } finally {
      saving.value = false
    }
  }

  async function removeTasting(tastingId: number, wineId: number): Promise<void> {
    try {
      await cellarService.deleteTasting(tastingId)
      await loadWine(wineId)
    } catch (error) {
      toastError(error, 'Could not delete tasting.')
    }
  }

  return {
    wines,
    winesLoading,
    winesTotal,
    wine,
    wineLoading,
    quota,
    candidates,
    candidatesLoading,
    saving,
    loadWines,
    loadWine,
    loadQuota,
    createWine,
    updateWine,
    removeWine,
    fetchCandidates,
    confirmMatch,
    markNoMatch,
    addTasting,
    removeTasting,
  }
})
