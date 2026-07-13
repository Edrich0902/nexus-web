import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useQueryCache } from '@pinia/colada'
import { extractApiErrorMessage } from '@lib/api-error'
import * as sportsService from '@services/sports.service'
import {
  sportsKeys,
  useSportsStatusQuery,
  useSportsSyncMutation,
} from '@stores/sports/sports.queries'
import type {
  SportsHomeSnapshot,
  SportsOverview,
  SportsSlug,
} from '@/types/sports/sports'

export const useSportsStore = defineStore('sports', () => {
  const toast = useToast()
  const queryCache = useQueryCache()

  const statusQuery = useSportsStatusQuery()
  const syncMutation = useSportsSyncMutation()

  const home = ref<SportsHomeSnapshot | null>(null)
  const homeLoading = ref(false)
  const overview = ref<SportsOverview | null>(null)
  const overviewLoading = ref(false)
  const overviewSport = ref<string | null>(null)

  const status = computed(() => statusQuery.data.value ?? null)
  const statusLoading = computed(
    () => statusQuery.asyncStatus.value === 'loading',
  )
  const syncPending = computed(
    () => syncMutation.asyncStatus.value === 'loading',
  )

  async function loadStatus(): Promise<void> {
    await statusQuery.refetch()
  }

  async function loadHome(): Promise<void> {
    homeLoading.value = true
    try {
      home.value = await sportsService.getHome()
    } catch (error) {
      home.value = null
      toast.add({
        severity: 'error',
        summary: 'Sports',
        detail: extractApiErrorMessage(error, 'Could not load sports home.'),
        life: 4000,
      })
    } finally {
      homeLoading.value = false
    }
  }

  async function loadSport(sport: SportsSlug | string): Promise<void> {
    overviewLoading.value = true
    overviewSport.value = sport
    try {
      overview.value = await sportsService.getSportOverview(sport)
    } catch (error) {
      overview.value = null
      toast.add({
        severity: 'error',
        summary: 'Sports',
        detail: extractApiErrorMessage(error, 'Could not load sport overview.'),
        life: 4000,
      })
    } finally {
      overviewLoading.value = false
    }
  }

  async function syncNow(type = 'all'): Promise<void> {
    try {
      await syncMutation.mutateAsync(type)
      toast.add({
        severity: 'success',
        summary: 'Sports',
        detail: 'Sync queued. Data will refresh shortly.',
        life: 3000,
      })
      queryCache.invalidateQueries({ key: sportsKeys.all })
      await Promise.all([loadStatus(), loadHome()])
      if (overviewSport.value) {
        await loadSport(overviewSport.value)
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Sports',
        detail: extractApiErrorMessage(error, 'Sync failed.'),
        life: 4000,
      })
    }
  }

  return {
    status,
    statusLoading,
    home,
    homeLoading,
    overview,
    overviewLoading,
    overviewSport,
    syncPending,
    loadStatus,
    loadHome,
    loadSport,
    syncNow,
  }
})
