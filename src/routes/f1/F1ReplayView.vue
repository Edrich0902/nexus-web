<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusF1TrackReplay from '@components/nexus-f1-track-replay/NexusF1TrackReplay.vue'
import { useF1Store } from '@stores/f1/f1.store'

const route = useRoute()
const router = useRouter()
const f1 = useF1Store()

const sessionKey = computed(() => Number(route.params.sessionKey))
const focusDriver = ref<number | undefined>(undefined)
let pollTimer: ReturnType<typeof setInterval> | null = null

const status = computed(() => f1.replay?.status ?? null)
const isPending = computed(() => status.value === 'pending')
const isFailed = computed(() => status.value === 'failed')
const isPartial = computed(() => Boolean(f1.replay?.partial))
const isReady = computed(
  () => status.value === 'ready' && (f1.replay?.location?.length ?? 0) > 0,
)

async function load(): Promise<void> {
  await f1.loadReplay(sessionKey.value, focusDriver.value)
  maybePoll()
}

function maybePoll(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  // Poll while waiting, and while more cars still fill in after the first unlock.
  if (status.value !== 'pending' && !isPartial.value) return

  pollTimer = setInterval(async () => {
    const next = await f1.pollReplayStatus(sessionKey.value)
    if (next === 'ready' || next === 'failed' || next === 'unavailable') {
      await f1.loadReplay(sessionKey.value, focusDriver.value)
      if (
        (next === 'ready' && !f1.replay?.partial) ||
        next === 'failed' ||
        next === 'unavailable'
      ) {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
      }
    }
  }, 4000)
}

async function retry(): Promise<void> {
  await f1.retryReplay(sessionKey.value)
  maybePoll()
}

onMounted(() => {
  void load()
})

watch(sessionKey, () => {
  void load()
})

watch(focusDriver, () => {
  if (isReady.value) {
    void f1.loadReplay(sessionKey.value, focusDriver.value)
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <NexusPageWrapper show-toolbar title="Track replay">
    <template #toolbar>
      <Button
        label="Retry sync"
        icon="pi pi-refresh"
        text
        severity="secondary"
        :loading="f1.replayLoading"
        @click="retry"
      />
      <Button
        label="Session"
        icon="pi pi-arrow-left"
        text
        severity="secondary"
        @click="router.push(`/f1/sessions/${sessionKey}`)"
      />
    </template>

    <div class="wrap">
      <Message severity="info" :closable="false">
        Replay syncs a small set of cars at ≈0.25 Hz, one driver at a time so
        the queue worker stays healthy. First car unlocks the map; others fill
        in shortly after.
      </Message>

      <Message v-if="isPending" severity="warn" :closable="false">
        Preparing replay…
        <span v-if="f1.replay?.message">{{ f1.replay.message }}</span>
        Keep this page open — status refreshes automatically.
      </Message>

      <Message v-else-if="isFailed" severity="error" :closable="false">
        {{ f1.replay?.message || 'Replay sync failed.' }}
        Use Retry sync after the queue worker is running.
      </Message>

      <Message
        v-else-if="isPartial"
        severity="warn"
        :closable="false"
      >
        Partial replay — more cars may still be syncing in the background.
      </Message>

      <div class="toolbar">
        <Select
          v-model="focusDriver"
          :options="f1.replay?.drivers ?? []"
          option-label="name_acronym"
          option-value="driver_number"
          placeholder="Load telemetry for driver"
          show-clear
          class="driver-select"
          :disabled="!isReady"
        />
      </div>

      <NexusF1TrackReplay
        :payload="f1.replay"
        :loading="f1.replayLoading && !f1.replay"
      />

      <section
        v-if="f1.replay?.car_data?.samples?.length"
        class="telemetry"
      >
        <h3>
          Telemetry · #{{ f1.replay.car_data.driver_number }} ({{
            f1.replay.car_data.sample_count
          }}
          samples)
        </h3>
        <DataTable
          :value="f1.replay.car_data.samples.slice(0, 100)"
          size="small"
          striped-rows
          paginator
          :rows="20"
        >
          <Column field="date" header="When" />
          <Column field="speed" header="Speed" />
          <Column field="rpm" header="RPM" />
          <Column field="n_gear" header="Gear" />
          <Column field="throttle" header="Throttle" />
          <Column field="brake" header="Brake" />
          <Column field="drs" header="DRS" />
        </DataTable>
      </section>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.toolbar {
  display: flex;
  gap: 0.75rem;
}

.driver-select {
  min-width: 14rem;
}

h3 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}
</style>
