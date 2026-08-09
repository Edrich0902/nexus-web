import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as spiritsService from '@services/food-drink/spirits.service'
import type { SpiritSpirit, StoreSpiritPayload } from '@/types/food-drink/spirits'

export const useSpiritsStore = defineStore('spirits', () => {
  const toast = useToast()
  const spirits = ref<SpiritSpirit[]>([])
  const spiritsLoading = ref(false)
  const spirit = ref<SpiritSpirit | null>(null)
  const spiritLoading = ref(false)
  const saving = ref(false)
  const analysing = ref(false)

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: 'Spirits',
      detail: extractApiErrorMessage(error, fallback),
      life: 4000,
    })
  }

  async function loadSpirits(q?: string): Promise<void> {
    spiritsLoading.value = true
    try {
      const page = await spiritsService.listSpirits({ q })
      spirits.value = page.data
    } catch (error) {
      spirits.value = []
      toastError(error, 'Could not load spirits.')
    } finally {
      spiritsLoading.value = false
    }
  }

  async function loadSpirit(id: number, options?: { silent?: boolean }): Promise<void> {
    if (!options?.silent) {
      spiritLoading.value = true
    }
    try {
      spirit.value = await spiritsService.getSpirit(id)
    } catch (error) {
      if (!options?.silent) {
        spirit.value = null
      }
      toastError(error, 'Could not load spirit.')
    } finally {
      if (!options?.silent) {
        spiritLoading.value = false
      }
    }
  }

  async function createSpirit(payload: StoreSpiritPayload): Promise<SpiritSpirit | null> {
    saving.value = true
    try {
      const created = await spiritsService.createSpirit(payload)
      toast.add({
        severity: 'success',
        summary: 'Spirits',
        detail: 'Spirit logged.',
        life: 2500,
      })
      await loadSpirits()
      return created
    } catch (error) {
      toastError(error, 'Could not save spirit.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function removeSpirit(id: number): Promise<boolean> {
    try {
      await spiritsService.deleteSpirit(id)
      return true
    } catch (error) {
      toastError(error, 'Could not delete spirit.')
      return false
    }
  }

  async function analyseSpirit(spiritId: number, force = false): Promise<void> {
    analysing.value = true
    try {
      spirit.value = await spiritsService.analyseSpirit(spiritId, { force })
      toast.add({
        severity: spirit.value.analysis_status === 'complete' ? 'success' : 'info',
        summary: 'Spirits',
        detail:
          spirit.value.analysis_status === 'complete'
            ? 'Analysis complete.'
            : 'Analysis queued.',
        life: 2500,
      })
    } catch (error) {
      toastError(error, 'Could not analyse spirit.')
    } finally {
      analysing.value = false
    }
  }

  return {
    spirits,
    spiritsLoading,
    spirit,
    spiritLoading,
    saving,
    analysing,
    loadSpirits,
    loadSpirit,
    createSpirit,
    removeSpirit,
    analyseSpirit,
  }
})
