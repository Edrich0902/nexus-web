import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as analysisService from '@services/analysis/analysis.service'
import type { AnalysisQuota } from '@/types/analysis/drink-analysis'

export const useAnalysisStore = defineStore('analysis', () => {
  const toast = useToast()
  const quota = ref<AnalysisQuota | null>(null)
  const quotaLoading = ref(false)

  async function loadQuota(): Promise<void> {
    quotaLoading.value = true
    try {
      quota.value = await analysisService.getAnalysisQuota()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Analysis',
        detail: extractApiErrorMessage(error, 'Could not load AI quota.'),
        life: 4000,
      })
    } finally {
      quotaLoading.value = false
    }
  }

  return { quota, quotaLoading, loadQuota }
})
