<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NexusF1TrackReplay from '@components/nexus-f1-track-replay/NexusF1TrackReplay.vue'
import NexusF1LockoutBanner from '@components/nexus-f1-lockout-banner/NexusF1LockoutBanner.vue'
import NexusDataTable from '@components/nexus-data-table/NexusDataTable.vue'
import { useF1Store } from '@stores/f1/f1.store'
import { timeOfDay } from './f1'

const route = useRoute()
const f1 = useF1Store()

const sessionKey = computed(() => Number(route.params.sessionKey))
const focusDriver = ref<number | undefined>(undefined)
let pollTimer: ReturnType<typeof setInterval> | null = null

const replay = computed(() => (f1.replay?.session_key === sessionKey.value ? f1.replay : null))
const status = computed(() => replay.value?.status ?? null)
const isPending = computed(() => status.value === 'pending')
const isFailed = computed(() => status.value === 'failed')
const isPartial = computed(() => Boolean(replay.value?.partial))
const isLockout = computed(() => Boolean(f1.status?.provider_health?.live_lockout))
const isReady = computed(() => status.value === 'ready' && (replay.value?.location?.length ?? 0) > 0)

const session = computed(() =>
  f1.sessionDetail?.session.session_key === sessionKey.value ? f1.sessionDetail : null,
)

const eyebrow = computed(() =>
  [session.value?.meeting?.meeting_name, session.value?.session.session_name].filter(Boolean).join(' · ') ||
  'Formula 1',
)

const notice = computed<{ tone: 'warn' | 'bad' | 'info'; text: string } | null>(() => {
  if (isPending.value && isLockout.value) {
    return {
      tone: 'warn',
      text: 'Waiting for OpenF1 to unlock after the live session. The job retries on its own while the queue worker runs.',
    }
  }
  if (isPending.value) {
    return {
      tone: 'info',
      text: `${replay.value?.message ? `${replay.value.message} ` : ''}Preparing the replay. This page refreshes on its own.`,
    }
  }
  if (isFailed.value) {
    return {
      tone: 'bad',
      text: `${replay.value?.message || 'The replay sync failed.'} Retry once the queue worker is running.`,
    }
  }
  if (isPartial.value) return { tone: 'info', text: 'More cars are still syncing and will appear shortly.' }
  return null
})

const telemetry = computed(() => replay.value?.car_data?.samples?.slice(0, 100) ?? [])
const telemetryDriver = computed(() => {
  const n = replay.value?.car_data?.driver_number
  return replay.value?.drivers.find((d) => d.driver_number === n)?.name_acronym ?? (n ? `#${n}` : '')
})

function stopPolling(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

function maybePoll(): void {
  stopPolling()
  // Poll while waiting, and while more cars still fill in after the first unlock.
  if (status.value !== 'pending' && !isPartial.value) return
  pollTimer = setInterval(async () => {
    const next = await f1.pollReplayStatus(sessionKey.value)
    if (next === 'ready' || next === 'failed' || next === 'unavailable') {
      await f1.loadReplay(sessionKey.value, focusDriver.value)
      if ((next === 'ready' && !f1.replay?.partial) || next === 'failed' || next === 'unavailable') {
        stopPolling()
      }
    }
  }, 4000)
}

async function load(): Promise<void> {
  await f1.loadReplay(sessionKey.value, focusDriver.value)
  maybePoll()
}

async function retry(): Promise<void> {
  await f1.retryReplay(sessionKey.value)
  maybePoll()
}

watch(
  sessionKey,
  (key) => {
    focusDriver.value = undefined
    void load()
    if (!session.value && Number.isFinite(key)) void f1.loadSession(key)
  },
  { immediate: true },
)

watch(focusDriver, () => {
  if (isReady.value) void f1.loadReplay(sessionKey.value, focusDriver.value)
})

onUnmounted(stopPolling)
</script>

<template>
  <DetailTemplate
    :back-to="{ name: 'f1-session', params: { sessionKey } }"
    :back-label="session?.session.session_name ?? 'Session'"
  >
    <template #stage>
      <NxStage
        size="compact"
        :eyebrow="eyebrow"
        title="Track"
        accent="replay"
        lede="A downsampled map of where every car was, built from OpenF1's historical location data. Pick a car to follow it and load its telemetry."
      >
        <template #actions>
          <Button rounded severity="secondary" label="Retry sync" :loading="f1.replayLoading" @click="retry">
            <template #icon="{ class: iconClass }">
              <NxIcon name="refresh" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <NexusF1LockoutBanner :health="f1.status?.provider_health" />

    <p v-if="notice" class="notice" :class="`t-${notice.tone}`" role="status">
      <NxIcon :name="notice.tone === 'bad' ? 'close' : 'clock'" :size="16" />
      {{ notice.text }}
    </p>

    <NexusF1TrackReplay v-model:focus="focusDriver" :payload="replay" :loading="f1.replayLoading && !replay" />

    <section v-if="telemetry.length">
      <NxSectionHeader :title="`Telemetry · ${telemetryDriver}`" />
      <NexusDataTable :value="telemetry" paginator :rows="20">
        <Column header="Time">
          <template #body="{ data }">
            <span class="mono">{{ timeOfDay(data.date) }}</span>
          </template>
        </Column>
        <Column header="Speed">
          <template #body="{ data }">{{ data.speed ?? '—' }}<span class="unit"> km/h</span></template>
        </Column>
        <Column field="rpm" header="RPM" />
        <Column field="n_gear" header="Gear" />
        <Column header="Throttle">
          <template #body="{ data }">{{ data.throttle ?? '—' }}<span class="unit">%</span></template>
        </Column>
        <Column field="brake" header="Brake" />
        <Column field="drs" header="DRS" />
      </NexusDataTable>
      <p class="hint">
        First 100 of {{ replay?.car_data?.sample_count ?? 0 }} samples. Replays sync a few cars at a time so the queue
        stays healthy.
      </p>
    </section>
  </DetailTemplate>
</template>

<style scoped>
.notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--r-md);
  font-size: 14px;
  color: var(--ink-2);
  background: var(--tint);
}

.notice :deep(svg) {
  flex-shrink: 0;
  margin-top: 2px;
}

.t-warn {
  background: color-mix(in srgb, var(--warn) 12%, transparent);
}

.t-warn :deep(svg) {
  color: var(--warn);
}

.t-bad {
  background: color-mix(in srgb, var(--bad) 12%, transparent);
}

.t-bad :deep(svg) {
  color: var(--bad);
}

.mono {
  font-family: var(--font-mono);
  font-size: 13px;
}

.unit {
  color: var(--ink-3);
  font-size: 12px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}
</style>
