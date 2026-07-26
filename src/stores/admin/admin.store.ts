import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as adminService from '@services/admin.service'
import type {
  AdminFailedJob,
  AdminOverview,
  AdminPendingJob,
  AdminRecentJob,
} from '@/types/admin/admin'

export const useAdminStore = defineStore('admin', () => {
  const toast = useToast()

  const overview = ref<AdminOverview | null>(null)
  const overviewLoading = ref(false)
  const pendingJobs = ref<AdminPendingJob[]>([])
  const pendingTotal = ref(0)
  const pendingPage = ref(1)
  const queueFilter = ref<string | undefined>(undefined)
  const jobsLoading = ref(false)
  const failedJobs = ref<AdminFailedJob[]>([])
  const failedTotal = ref(0)
  const failedPage = ref(1)
  const failedLoading = ref(false)
  const recentJobs = ref<AdminRecentJob[]>([])
  const recentLoading = ref(false)
  const actionPending = ref(false)

  const pendingByQueue = computed(() => overview.value?.queues ?? [])
  const telescopeUrl = computed(() => overview.value?.telescope_url ?? null)

  async function loadOverview(): Promise<void> {
    overviewLoading.value = true
    try {
      overview.value = await adminService.getOverview()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Admin',
        detail: extractApiErrorMessage(error, 'Could not load overview.'),
        life: 4000,
      })
    } finally {
      overviewLoading.value = false
    }
  }

  async function loadJobs(page = 1): Promise<void> {
    jobsLoading.value = true
    pendingPage.value = page
    try {
      const result = await adminService.getJobs(page, queueFilter.value)
      pendingJobs.value = result.data
      pendingTotal.value = result.total
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Admin',
        detail: extractApiErrorMessage(error, 'Could not load jobs.'),
        life: 4000,
      })
    } finally {
      jobsLoading.value = false
    }
  }

  async function loadFailedJobs(page = 1): Promise<void> {
    failedLoading.value = true
    failedPage.value = page
    try {
      const result = await adminService.getFailedJobs(page)
      failedJobs.value = result.data
      failedTotal.value = result.total
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Admin',
        detail: extractApiErrorMessage(error, 'Could not load failed jobs.'),
        life: 4000,
      })
    } finally {
      failedLoading.value = false
    }
  }

  async function loadRecentJobs(): Promise<void> {
    recentLoading.value = true
    try {
      recentJobs.value = await adminService.getRecentJobs()
    } catch (error) {
      recentJobs.value = []
      toast.add({
        severity: 'error',
        summary: 'Admin',
        detail: extractApiErrorMessage(error, 'Could not load recent jobs.'),
        life: 4000,
      })
    } finally {
      recentLoading.value = false
    }
  }

  async function refreshAll(): Promise<void> {
    await Promise.all([
      loadOverview(),
      loadJobs(pendingPage.value),
      loadFailedJobs(failedPage.value),
      loadRecentJobs(),
    ])
  }

  async function retryFailed(uuid: string): Promise<void> {
    actionPending.value = true
    try {
      await adminService.retryFailedJob(uuid)
      toast.add({
        severity: 'success',
        summary: 'Admin',
        detail: 'Job queued for retry.',
        life: 2500,
      })
      await refreshAll()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Admin',
        detail: extractApiErrorMessage(error, 'Retry failed.'),
        life: 4000,
      })
    } finally {
      actionPending.value = false
    }
  }

  async function forgetFailed(uuid: string): Promise<void> {
    actionPending.value = true
    try {
      await adminService.forgetFailedJob(uuid)
      toast.add({
        severity: 'success',
        summary: 'Admin',
        detail: 'Failed job forgotten.',
        life: 2500,
      })
      await refreshAll()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Admin',
        detail: extractApiErrorMessage(error, 'Forget failed.'),
        life: 4000,
      })
    } finally {
      actionPending.value = false
    }
  }

  return {
    overview,
    overviewLoading,
    pendingJobs,
    pendingTotal,
    pendingPage,
    queueFilter,
    jobsLoading,
    failedJobs,
    failedTotal,
    failedPage,
    failedLoading,
    recentJobs,
    recentLoading,
    actionPending,
    pendingByQueue,
    telescopeUrl,
    loadOverview,
    loadJobs,
    loadFailedJobs,
    loadRecentJobs,
    refreshAll,
    retryFailed,
    forgetFailed,
  }
})
