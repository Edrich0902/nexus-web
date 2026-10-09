<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxBento from '@design/components/NxBento.vue'
import NxField from '@design/components/NxField.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import type { ViewState } from '@design/templates/types'
import NexusF1LockoutBanner from '@components/nexus-f1-lockout-banner/NexusF1LockoutBanner.vue'
import NexusDataTable from '@components/nexus-data-table/NexusDataTable.vue'
import { useF1Store } from '@stores/f1/f1.store'
import type { F1Driver } from '@/types/f1/f1'
import F1Stints from './F1Stints.vue'
import { driverName, sessionWhen, surname, teamColour, timeOfDay, timing } from './f1'

type Tab = 'results' | 'grid' | 'stints' | 'pits' | 'control' | 'positions'

const route = useRoute()
const f1 = useF1Store()

const sessionKey = computed(() => Number(route.params.sessionKey))
const tab = ref<Tab>('results')

watch(
  sessionKey,
  (key) => {
    tab.value = 'results'
    if (Number.isFinite(key)) void f1.loadSession(key)
  },
  { immediate: true },
)

const detail = computed(() =>
  f1.sessionDetail?.session.session_key === sessionKey.value ? f1.sessionDetail : null,
)
const analysis = computed(() => (f1.analysis?.session_key === sessionKey.value ? f1.analysis : null))

const state = computed<ViewState>(() => {
  if (!detail.value) return f1.sessionLoading ? 'loading' : 'error'
  return 'ready'
})

const drivers = computed(() => {
  const map = new Map<number, F1Driver>()
  for (const d of detail.value?.drivers ?? []) map.set(d.driver_number, d)
  return map
})

function acronym(n: number): string {
  return drivers.value.get(n)?.name_acronym ?? `#${n}`
}

function fullName(n: number): string {
  return driverName(drivers.value.get(n)?.full_name, `#${n}`)
}

function colourOf(n: number): string {
  return teamColour(drivers.value.get(n)?.team_colour)
}

/** Classified finishers by position, then retirements by laps completed. */
const results = computed(() =>
  [...(detail.value?.results ?? [])].sort((a, b) => {
    if (a.position != null && b.position != null) return a.position - b.position
    if (a.position != null) return -1
    if (b.position != null) return 1
    return (b.number_of_laps ?? 0) - (a.number_of_laps ?? 0)
  }),
)

const grid = computed(() =>
  [...(detail.value?.starting_grid ?? [])].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
)

const order = computed(() => results.value.map((r) => r.driver_number))

const sessionType = computed(() => (detail.value?.session.session_type ?? '').toLowerCase())

const heading = computed(() => {
  const name = detail.value?.session.session_name ?? 'Session'
  const winner = results.value[0]
  if (!winner || winner.position !== 1) return { title: name, accent: '' }
  const who = surname(drivers.value.get(winner.driver_number)?.full_name) || acronym(winner.driver_number)
  if (sessionType.value === 'race') return { title: who, accent: 'wins' }
  if (sessionType.value === 'qualifying') return { title: who, accent: 'on pole' }
  return { title: who, accent: 'fastest' }
})

const eyebrow = computed(() => {
  const d = detail.value
  if (!d) return ''
  return [d.meeting?.meeting_name, d.session.session_name, sessionWhen(d.session.date_start)]
    .filter(Boolean)
    .join(' · ')
})

const lede = computed(() => {
  const d = detail.value
  if (!d) return ''
  if (d.detail_synced) {
    const laps = Math.max(0, ...results.value.map((r) => r.number_of_laps ?? 0))
    const outs = results.value.filter((r) => r.dnf || r.dns || r.dsq).length
    const bits = [`${results.value.length} drivers`]
    if (laps) bits.push(`${laps} laps`)
    if (outs) bits.push(`${outs} did not finish`)
    return `${bits.join(' · ')}.`
  }
  if (d.detail_available) return 'Session data is being prepared. Check back in a few minutes.'
  return 'Results arrive about 35 minutes after the session ends.'
})

const podium = computed(() =>
  results.value
    .filter((r) => r.position != null && r.position <= 3)
    .map((r, i) => ({
      result: r,
      span: [5, 4, 3][i] ?? 3,
      size: [60, 52, 44][i] ?? 44,
      bg: colourOf(r.driver_number),
      label: `P${r.position}${drivers.value.get(r.driver_number)?.team_name ? ` · ${drivers.value.get(r.driver_number)?.team_name}` : ''}`,
      value: acronym(r.driver_number),
      time: i === 0 ? timing(r.duration) : timing(r.gap_to_leader, true),
    })),
)

const tabs = computed(() => {
  const a = analysis.value
  const all: { value: Tab; label: string; count: number }[] = [
    { value: 'results', label: 'Results', count: results.value.length },
    { value: 'grid', label: 'Grid', count: grid.value.length },
    { value: 'stints', label: 'Tyres', count: a?.stints.length ?? 0 },
    { value: 'pits', label: 'Pit stops', count: a?.pits.length ?? 0 },
    { value: 'control', label: 'Race control', count: a?.race_control.length ?? 0 },
    { value: 'positions', label: 'Positions', count: a?.positions.length ?? 0 },
  ]
  return all.filter((t) => t.value === 'results' || t.count > 0).map((t) => ({ value: t.value, label: t.label }))
})

const weather = computed(() => {
  const samples = analysis.value?.weather ?? []
  if (!samples.length) return []
  const nums = (key: string) =>
    samples.map((w) => Number(w[key])).filter((v) => Number.isFinite(v))
  const range = (key: string, unit: string) => {
    const v = nums(key)
    if (!v.length) return null
    const lo = Math.min(...v)
    const hi = Math.max(...v)
    return Math.round(lo) === Math.round(hi) ? `${Math.round(lo)}${unit}` : `${Math.round(lo)}–${Math.round(hi)}${unit}`
  }
  const rain = samples.some((w) => Boolean(w.rainfall))
  return [
    { label: 'Air', value: range('air_temperature', '°C') },
    { label: 'Track', value: range('track_temperature', '°C') },
    { label: 'Humidity', value: range('humidity', '%') },
    { label: 'Wind', value: range('wind_speed', ' m/s') },
    { label: 'Rain', value: rain ? 'Yes' : 'Dry' },
  ]
})

const facts = computed(() => {
  const d = detail.value
  if (!d) return []
  const a = analysis.value
  return [
    { label: 'Type', value: d.session.session_type },
    { label: 'Starts', value: sessionWhen(d.session.date_start) },
    { label: 'Pit stops', value: a?.pits.length || null },
    { label: 'Overtakes', value: a?.overtakes.length || null },
  ]
})

const FLAG_TONE: Record<string, string> = {
  GREEN: 'var(--ok)',
  CLEAR: 'var(--ok)',
  YELLOW: 'var(--warn)',
  'DOUBLE YELLOW': 'var(--warn)',
  RED: 'var(--bad)',
  BLUE: '#5b9fd4',
  CHEQUERED: 'var(--ink)',
}
</script>

<template>
  <DetailTemplate
    :state="state"
    :back-to="detail ? { name: 'f1-meeting', params: { meetingKey: detail.session.meeting_key } } : { name: 'f1' }"
    :back-label="detail?.meeting?.meeting_name ?? 'Formula 1'"
    error-title="Could not load this session"
  >
    <template #stage>
      <NxStage size="compact" :eyebrow="eyebrow" :title="heading.title" :accent="heading.accent" :lede="lede">
        <template v-if="detail?.detail_available" #actions>
          <Button
            as="router-link"
            rounded
            severity="contrast"
            label="Watch the replay"
            :to="{ name: 'f1-replay', params: { sessionKey } }"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="play" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <NexusF1LockoutBanner :health="f1.status?.provider_health" />

    <NxBento v-if="podium.length" :row-height="140">
      <NxField
        v-for="p in podium"
        :key="p.result.driver_number"
        :bg="p.bg"
        :span="p.span"
        :label="p.label"
        :aside="p.time"
        :value="p.value"
        :value-size="p.size"
        :sub="fullName(p.result.driver_number)"
      />
    </NxBento>

    <NxEmptyState
      v-if="!detail?.detail_synced"
      title="No timing data yet"
      :body="lede"
      icon="clock"
    />

    <section v-else class="data">
      <NxPillGroup v-model="tab" :options="tabs" label="Session data" size="sm" />

      <NexusDataTable v-if="tab === 'results'" :value="results">
        <Column header="Pos" style="width: 3.5rem">
          <template #body="{ data }">
            <span class="mono">{{ data.position ?? (data.dsq ? 'DSQ' : data.dns ? 'DNS' : 'DNF') }}</span>
          </template>
        </Column>
        <Column header="Driver">
          <template #body="{ data }">
            <span class="driver">
              <i class="tb" :style="{ background: colourOf(data.driver_number) }" />
              <b>{{ fullName(data.driver_number) }}</b>
              <span class="team">{{ drivers.get(data.driver_number)?.team_name }}</span>
            </span>
          </template>
        </Column>
        <Column header="Time / gap">
          <template #body="{ data }">
            <span class="mono">{{ data.position === 1 ? timing(data.duration) : timing(data.gap_to_leader, true) }}</span>
          </template>
        </Column>
        <Column field="number_of_laps" header="Laps" />
      </NexusDataTable>

      <NexusDataTable v-else-if="tab === 'grid'" :value="grid">
        <Column field="position" header="Pos" style="width: 3.5rem" />
        <Column header="Driver">
          <template #body="{ data }">
            <span class="driver">
              <i class="tb" :style="{ background: colourOf(data.driver_number) }" />
              <b>{{ fullName(data.driver_number) }}</b>
            </span>
          </template>
        </Column>
        <Column header="Qualifying lap">
          <template #body="{ data }">
            <span class="mono">{{ timing(data.lap_duration) }}</span>
          </template>
        </Column>
      </NexusDataTable>

      <F1Stints
        v-else-if="tab === 'stints'"
        :stints="analysis?.stints ?? []"
        :order="order"
        :label="acronym"
      />

      <NexusDataTable v-else-if="tab === 'pits'" :value="analysis?.pits ?? []">
        <Column header="Driver">
          <template #body="{ data }">
            <span class="driver">
              <i class="tb" :style="{ background: colourOf(Number(data.driver_number)) }" />
              <b>{{ acronym(Number(data.driver_number)) }}</b>
            </span>
          </template>
        </Column>
        <Column field="lap_number" header="Lap" />
        <Column header="Stop">
          <template #body="{ data }">
            <span class="mono">{{ data.stop_duration != null ? `${data.stop_duration}s` : '—' }}</span>
          </template>
        </Column>
        <Column header="Pit lane">
          <template #body="{ data }">
            <span class="mono">{{ data.lane_duration != null ? `${data.lane_duration}s` : '—' }}</span>
          </template>
        </Column>
      </NexusDataTable>

      <NexusDataTable v-else-if="tab === 'control'" :value="analysis?.race_control ?? []" paginator :rows="25">
        <Column header="Time" style="width: 5.5rem">
          <template #body="{ data }">
            <span class="mono">{{ timeOfDay(data.date as string) }}</span>
          </template>
        </Column>
        <Column header="Lap" style="width: 3.5rem">
          <template #body="{ data }">{{ data.lap_number ?? '—' }}</template>
        </Column>
        <Column header="Message">
          <template #body="{ data }">
            <span class="msg">
              <i
                v-if="data.flag"
                class="flag"
                :style="{ background: FLAG_TONE[String(data.flag)] ?? 'var(--ink-3)' }"
                :title="String(data.flag)"
              />
              {{ data.message }}
            </span>
          </template>
        </Column>
      </NexusDataTable>

      <template v-else-if="tab === 'positions'">
        <NexusDataTable :value="(analysis?.positions ?? []).slice(-200).reverse()" paginator :rows="25">
          <Column header="Time" style="width: 5.5rem">
            <template #body="{ data }">
              <span class="mono">{{ timeOfDay(data.date) }}</span>
            </template>
          </Column>
          <Column header="Driver">
            <template #body="{ data }">
              <span class="driver">
                <i class="tb" :style="{ background: colourOf(data.driver_number) }" />
                <b>{{ acronym(data.driver_number) }}</b>
              </span>
            </template>
          </Column>
          <Column field="position" header="Now P" />
        </NexusDataTable>
        <p class="hint">The latest 200 position changes, newest first.</p>
      </template>
    </section>

    <template #aside>
      <NxPanel title="Session">
        <NxFacts :items="facts" :cols="2" />
      </NxPanel>
      <NxPanel v-if="weather.length" title="Conditions">
        <NxFacts :items="weather" :cols="2" />
      </NxPanel>
    </template>
  </DetailTemplate>
</template>

<style scoped>
.data {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: flex-start;
}

.data > :not(.nx-pills) {
  align-self: stretch;
}

.mono {
  font-family: var(--font-mono);
  font-size: 13px;
}

.driver {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.tb {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  flex-shrink: 0;
}

.driver b {
  font-weight: 600;
  white-space: nowrap;
}

.team {
  font-size: 13px;
  color: var(--ink-3);
  white-space: nowrap;
}

.msg {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
}

.flag {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}

@media (max-width: 640px) {
  .team {
    display: none;
  }
}
</style>
