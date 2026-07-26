<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import NexusF1LockoutBanner from '@components/nexus-f1-lockout-banner/NexusF1LockoutBanner.vue'
import NexusDataTable from '@components/nexus-data-table/NexusDataTable.vue'
import { useF1Store } from '@stores/f1/f1.store'

const route = useRoute()
const router = useRouter()
const f1 = useF1Store()

const sessionKey = computed(() => Number(route.params.sessionKey))
const tab = ref('results')

const driversByNumber = computed(() => {
  const map = new Map<number, string>()
  for (const d of f1.sessionDetail?.drivers ?? []) {
    map.set(
      d.driver_number,
      d.name_acronym || d.full_name || `#${d.driver_number}`,
    )
  }
  return map
})

function driverLabel(n: number): string {
  return driversByNumber.value.get(n) ?? `#${n}`
}

function formatDuration(value: unknown): string {
  if (value == null) return '—'
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'number' ? v.toFixed(3) : String(v ?? '—')))
      .join(' / ')
  }
  if (typeof value === 'number') return value.toFixed(3)
  return String(value)
}

onMounted(() => {
  void f1.loadSession(sessionKey.value)
})

watch(sessionKey, (key) => {
  void f1.loadSession(key)
})

function openReplay(): void {
  void router.push(`/f1/sessions/${sessionKey.value}/replay`)
}
</script>

<template>
  <NexusPageWrapper
    show-toolbar
    :title="f1.sessionDetail?.session.session_name || 'Session'"
  >
    <template #toolbar>
      <Button
        label="Replay"
        icon="pi pi-play"
        severity="secondary"
        text
        :disabled="!f1.sessionDetail?.detail_available"
        @click="openReplay"
      />
      <Button
        label="Back"
        icon="pi pi-arrow-left"
        text
        severity="secondary"
        @click="
          router.push(
            `/f1/meetings/${f1.sessionDetail?.session.meeting_key ?? ''}`,
          )
        "
      />
    </template>

    <div v-if="f1.sessionLoading" class="wrap">
      <NexusSkeletonList :count="4" />
    </div>
    <div v-else-if="f1.sessionDetail" class="wrap">
      <NexusF1LockoutBanner :health="f1.status?.provider_health" />
      <header class="hero">
        <div>
          <p class="eyebrow">{{ f1.sessionDetail.meeting?.meeting_name }}</p>
          <h2>{{ f1.sessionDetail.session.session_name }}</h2>
          <p class="muted">
            {{
              f1.sessionDetail.detail_synced
                ? 'Detail synced from OpenF1'
                : f1.sessionDetail.detail_available
                  ? 'Detail sync queued / pending'
                  : 'Waiting for historical window (≈35 min after session end)'
            }}
          </p>
        </div>
      </header>

      <Tabs v-model:value="tab">
        <TabList>
          <Tab value="results">Results</Tab>
          <Tab value="grid">Grid</Tab>
          <Tab value="stints">Tyres</Tab>
          <Tab value="pits">Pits</Tab>
          <Tab value="control">Race control</Tab>
          <Tab value="positions">Positions</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="results">
            <NexusDataTable accent="f1" :value="f1.sessionDetail.results">
              <Column field="position" header="Pos" style="width: 3rem" />
              <Column header="Driver">
                <template #body="{ data }">
                  {{ driverLabel(data.driver_number) }}
                </template>
              </Column>
              <Column header="Time / Gap">
                <template #body="{ data }">
                  {{ formatDuration(data.duration) }}
                  <span
                    v-if="data.gap_to_leader"
                    class="muted"
                  >
                    ({{ formatDuration(data.gap_to_leader) }})
                  </span>
                </template>
              </Column>
              <Column field="number_of_laps" header="Laps" />
              <Column header="Flags">
                <template #body="{ data }">
                  <span v-if="data.dnf">DNF</span>
                  <span v-else-if="data.dns">DNS</span>
                  <span v-else-if="data.dsq">DSQ</span>
                  <span v-else>—</span>
                </template>
              </Column>
            </NexusDataTable>
          </TabPanel>

          <TabPanel value="grid">
            <NexusDataTable accent="f1" :value="f1.sessionDetail.starting_grid">
              <Column field="position" header="Pos" />
              <Column header="Driver">
                <template #body="{ data }">
                  {{ driverLabel(data.driver_number) }}
                </template>
              </Column>
              <Column header="Q lap">
                <template #body="{ data }">
                  {{
                    data.lap_duration != null
                      ? data.lap_duration.toFixed(3)
                      : '—'
                  }}
                </template>
              </Column>
            </NexusDataTable>
          </TabPanel>

          <TabPanel value="stints">
            <NexusDataTable accent="f1" :value="f1.analysis?.stints ?? []">
              <Column header="Driver">
                <template #body="{ data }">
                  {{ driverLabel(Number(data.driver_number)) }}
                </template>
              </Column>
              <Column field="stint_number" header="Stint" />
              <Column field="compound" header="Compound" />
              <Column field="lap_start" header="From" />
              <Column field="lap_end" header="To" />
              <Column field="tyre_age_at_start" header="Age" />
            </NexusDataTable>
          </TabPanel>

          <TabPanel value="pits">
            <NexusDataTable accent="f1" :value="f1.analysis?.pits ?? []">
              <Column header="Driver">
                <template #body="{ data }">
                  {{ driverLabel(Number(data.driver_number)) }}
                </template>
              </Column>
              <Column field="lap_number" header="Lap" />
              <Column field="stop_duration" header="Stop" />
              <Column field="lane_duration" header="Lane" />
            </NexusDataTable>
          </TabPanel>

          <TabPanel value="control">
            <NexusDataTable accent="f1" :value="f1.analysis?.race_control ?? []">
              <Column field="date" header="When" />
              <Column field="category" header="Category" />
              <Column field="flag" header="Flag" />
              <Column field="message" header="Message" />
            </NexusDataTable>
          </TabPanel>

          <TabPanel value="positions">
            <NexusDataTable
              accent="f1"
              :value="(f1.analysis?.positions ?? []).slice(-200)"
              paginator
              :rows="25"
            >
              <Column field="date" header="When" />
              <Column header="Driver">
                <template #body="{ data }">
                  {{ driverLabel(data.driver_number) }}
                </template>
              </Column>
              <Column field="position" header="Pos" />
            </NexusDataTable>
            <p class="muted hint">
              Showing recent position changes (last 200 of timeline).
            </p>
          </TabPanel>
        </TabPanels>
      </Tabs>
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

.hero {
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--sport-f1) 25%, transparent);
  background: color-mix(in srgb, var(--sport-f1) 6%, transparent);
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sport-f1);
}

h2 {
  margin: 0.15rem 0;
}

.muted {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.hint {
  margin-top: 0.5rem;
}
</style>
