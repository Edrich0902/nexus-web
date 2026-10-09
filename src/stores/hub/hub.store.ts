import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as hubService from '@services/hub.service'
import type { ActivityEvent, NowPayload } from '@/types/hub/hub'

const timezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Home screen data: the current moment and the personal activity stream. */
export const useHubStore = defineStore('hub', () => {
  const now = ref<NowPayload | null>(null)
  const nowLoading = ref(false)
  const nowError = ref(false)

  const activity = ref<ActivityEvent[]>([])
  const activityCursor = ref<string | null>(null)
  const activityLoading = ref(false)
  const activityError = ref(false)
  const activityLoaded = ref(false)

  async function loadNow(): Promise<void> {
    nowLoading.value = now.value === null
    try {
      now.value = await hubService.getNow(timezone())
      nowError.value = false
    } catch {
      nowError.value = now.value === null
    } finally {
      nowLoading.value = false
    }
  }

  async function loadActivity(limit = 20): Promise<void> {
    activityLoading.value = !activityLoaded.value
    try {
      const page = await hubService.getActivity({ limit })
      activity.value = page.data
      activityCursor.value = page.next_cursor
      activityError.value = false
      activityLoaded.value = true
    } catch {
      activityError.value = !activityLoaded.value
    } finally {
      activityLoading.value = false
    }
  }

  async function loadMoreActivity(limit = 20): Promise<void> {
    if (!activityCursor.value) return
    const page = await hubService.getActivity({ limit, cursor: activityCursor.value })
    activity.value = [...activity.value, ...page.data]
    activityCursor.value = page.next_cursor
  }

  return {
    now,
    nowLoading,
    nowError,
    activity,
    activityCursor,
    activityLoading,
    activityError,
    activityLoaded,
    loadNow,
    loadActivity,
    loadMoreActivity,
  }
})
