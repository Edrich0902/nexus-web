import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as f1Service from '@services/f1.service'
import { useF1StatusQuery, useF1SyncMutation } from '@stores/f1/f1.queries'
import type {
  F1Analysis,
  F1HomeSnapshot,
  F1MeetingSummary,
  F1ReplayPayload,
  F1Season,
  F1SessionDetail,
  F1Standings,
} from '@/types/f1/f1'

export const useF1Store = defineStore('f1', () => {
  const toast = useToast()

  const statusQuery = useF1StatusQuery()
  const syncMutation = useF1SyncMutation()

  const home = ref<F1HomeSnapshot | null>(null)
  const homeLoading = ref(false)
  const season = ref<F1Season | null>(null)
  const seasonLoading = ref(false)
  const standings = ref<F1Standings | null>(null)
  const standingsLoading = ref(false)
  const meeting = ref<F1MeetingSummary | null>(null)
  const meetingLoading = ref(false)
  const sessionDetail = ref<F1SessionDetail | null>(null)
  const sessionLoading = ref(false)
  const analysis = ref<F1Analysis | null>(null)
  const analysisLoading = ref(false)
  const replay = ref<F1ReplayPayload | null>(null)
  const replayLoading = ref(false)

  const status = computed(() => statusQuery.data.value ?? null)
  const syncPending = computed(
    () => syncMutation.asyncStatus.value === 'loading',
  )

  async function loadHome(): Promise<void> {
    homeLoading.value = true
    try {
      home.value = await f1Service.getHome()
    } catch (error) {
      home.value = null
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Could not load F1 home.'),
        life: 4000,
      })
    } finally {
      homeLoading.value = false
    }
  }

  async function loadSeason(year?: number): Promise<void> {
    seasonLoading.value = true
    try {
      season.value = await f1Service.getSeason(year)
      standings.value = await f1Service.getStandings(year)
    } catch (error) {
      season.value = null
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Could not load F1 season.'),
        life: 4000,
      })
    } finally {
      seasonLoading.value = false
    }
  }

  async function loadMeeting(meetingKey: number): Promise<void> {
    meetingLoading.value = true
    try {
      meeting.value = await f1Service.getMeeting(meetingKey)
    } catch (error) {
      meeting.value = null
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Could not load meeting.'),
        life: 4000,
      })
    } finally {
      meetingLoading.value = false
    }
  }

  async function loadSession(sessionKey: number): Promise<void> {
    sessionLoading.value = true
    analysisLoading.value = true
    try {
      sessionDetail.value = await f1Service.getSession(sessionKey)
      analysis.value = await f1Service.getAnalysis(sessionKey)
    } catch (error) {
      sessionDetail.value = null
      analysis.value = null
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Could not load session.'),
        life: 4000,
      })
    } finally {
      sessionLoading.value = false
      analysisLoading.value = false
    }
  }

  async function loadReplay(
    sessionKey: number,
    driverNumber?: number,
  ): Promise<void> {
    replayLoading.value = true
    try {
      replay.value = await f1Service.getReplay(sessionKey, driverNumber)
    } catch (error) {
      replay.value = null
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Could not load replay.'),
        life: 4000,
      })
    } finally {
      replayLoading.value = false
    }
  }

  async function pollReplayStatus(sessionKey: number): Promise<string> {
    const status = await f1Service.getReplayStatus(sessionKey)
    return status.status
  }

  async function retryReplay(sessionKey: number): Promise<void> {
    replayLoading.value = true
    try {
      const status = await f1Service.retryReplay(sessionKey)
      replay.value = {
        session_key: sessionKey,
        status: status.status,
        message: status.message ?? null,
        partial: status.partial ?? false,
        drivers: replay.value?.drivers ?? [],
        location: [],
        bounds: null,
        car_data: null,
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Could not retry replay.'),
        life: 4000,
      })
    } finally {
      replayLoading.value = false
    }
  }

  async function syncNow(type = 'all', year?: number): Promise<void> {
    try {
      await syncMutation.mutateAsync({ type, year })
      toast.add({
        severity: 'success',
        summary: 'Formula 1',
        detail: 'Sync queued.',
        life: 2500,
      })
      await loadSeason(year)
      await loadHome()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Formula 1',
        detail: extractApiErrorMessage(error, 'Sync failed.'),
        life: 4000,
      })
    }
  }

  return {
    status,
    syncPending,
    home,
    homeLoading,
    season,
    seasonLoading,
    standings,
    standingsLoading,
    meeting,
    meetingLoading,
    sessionDetail,
    sessionLoading,
    analysis,
    analysisLoading,
    replay,
    replayLoading,
    loadHome,
    loadSeason,
    loadMeeting,
    loadSession,
    loadReplay,
    pollReplayStatus,
    retryReplay,
    syncNow,
  }
})
