<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxBento from '@design/components/NxBento.vue'
import NxField from '@design/components/NxField.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import type { ViewState } from '@design/templates/types'
import NexusF1LockoutBanner from '@components/nexus-f1-lockout-banner/NexusF1LockoutBanner.vue'
import { useF1Store } from '@stores/f1/f1.store'
import F1Weekend from './F1Weekend.vue'
import F1DriverRows from './F1DriverRows.vue'
import F1ConstructorBars from './F1ConstructorBars.vue'
import F1Calendar from './F1Calendar.vue'
import F1Circuit from './F1Circuit.vue'
import {
  countdown,
  driverName,
  focusSession,
  meetingDates,
  meetingPlace,
  meetingState,
  rounds,
  surname,
  teamColour,
  teamColours,
  useNow,
} from './f1'

const f1 = useF1Store()
const now = useNow()
const showAllDrivers = ref(false)

onMounted(() => {
  void f1.loadSeason()
  void f1.loadHome()
})

const meetings = computed(() => f1.season?.meetings ?? [])
const drivers = computed(() => f1.standings?.drivers ?? [])
const teams = computed(() => f1.standings?.teams ?? [])
const colours = computed(() => teamColours(drivers.value))
const leaderPoints = computed(() => drivers.value[0]?.points ?? 0)

const state = computed<ViewState>(() => {
  if (f1.seasonLoading && !f1.season) return 'loading'
  if (!f1.season) return 'error'
  return meetings.value.length ? 'ready' : 'empty'
})

const championship = computed(() => rounds(meetings.value))

/** The meeting in progress, else the next one on the calendar. */
const nextMeeting = computed(
  () => meetings.value.find((m) => !m.is_cancelled && meetingState(m, now.value) !== 'done') ?? null,
)

const roundLabel = computed(() => {
  const m = nextMeeting.value
  if (!m) return null
  const index = championship.value.findIndex((r) => r.meeting_key === m.meeting_key)
  return index >= 0 ? `Round ${index + 1} of ${championship.value.length}` : 'Testing'
})

const focus = computed(() => focusSession(nextMeeting.value?.sessions, now.value))
const isLive = computed(() => {
  const s = focus.value
  if (!s?.date_start) return false
  return Date.parse(s.date_start) <= now.value
})

const heading = computed(() => {
  const m = nextMeeting.value
  if (!m) return { title: `${f1.season?.year ?? ''} season`, accent: 'complete' }
  if (focus.value && isLive.value) return { title: focus.value.session_name, accent: 'is live' }
  const target = focus.value?.date_start ?? m.date_start
  return countdown(target, now.value) ?? { title: m.meeting_name, accent: 'this weekend' }
})

const eyebrow = computed(() => {
  const m = nextMeeting.value
  if (!m) return 'Formula 1'
  const parts = [roundLabel.value, m.meeting_name]
  if (focus.value) parts.push(isLive.value ? 'On track now' : `${focus.value.session_name} in`)
  return parts.filter(Boolean).join(' · ')
})

const lede = computed(() => {
  const m = nextMeeting.value
  const [p1, p2] = drivers.value
  const place = m ? meetingPlace(m) : null
  const race = place ? `${place}, ${meetingDates(m!)}.` : ''
  if (!p1) return race || 'Sync to pull the season calendar and standings.'
  const leader = surname(p1.name)
  if (!m) return `${driverName(p1.name)} took the title with ${p1.points ?? 0} points.`
  if (!p2) return `${race} ${leader} leads the championship.`
  const gap = (p1.points ?? 0) - (p2.points ?? 0)
  return `${race} ${leader} leads ${surname(p2.name)} by ${gap} point${gap === 1 ? '' : 's'}.`
})

const podium = computed(() =>
  drivers.value.slice(0, 3).map((d, i) => {
    const gained = (d.points ?? 0) - (d.points_start ?? d.points ?? 0)
    return {
      driver: d,
      span: [5, 4, 3][i] ?? 3,
      size: [72, 60, 52][i] ?? 52,
      bg: teamColour(d.team_colour),
      label: `P${d.position ?? i + 1}${d.team_name ? ` · ${d.team_name}` : ''}`,
      aside: gained > 0 ? `+${gained} last round` : i > 0 ? `−${leaderPoints.value - (d.points ?? 0)}` : 'Leader',
    }
  }),
)

const restOfField = computed(() => {
  const rest = drivers.value.slice(3)
  return showAllDrivers.value ? rest : rest.slice(0, 7)
})
</script>

<template>
  <IndexTemplate
    :state="state"
    empty-title="No season data yet"
    empty-body="Run a sync to pull the calendar and standings from OpenF1."
    error-title="Could not load the season"
  >
    <template #stage>
      <NxStage :live="isLive" :eyebrow="eyebrow" :title="heading.title" :accent="heading.accent" :lede="lede">
        <template #visual>
          <F1Circuit :src="nextMeeting?.circuit_image" />
        </template>
        <template #actions>
          <Button
            v-if="nextMeeting"
            as="router-link"
            rounded
            severity="contrast"
            label="Open the weekend"
            :to="{ name: 'f1-meeting', params: { meetingKey: nextMeeting.meeting_key } }"
          />
          <Button
            rounded
            severity="secondary"
            label="Sync"
            :loading="f1.syncPending"
            @click="f1.syncNow('all')"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="refresh" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="podium.length" #fields>
      <NxBento :row-height="152">
        <NxField
          v-for="p in podium"
          :key="p.driver.driver_number"
          :bg="p.bg"
          :span="p.span"
          :label="p.label"
          :aside="p.aside"
          :value="p.driver.points ?? 0"
          :value-size="p.size"
          :sub="driverName(p.driver.name, `#${p.driver.driver_number}`)"
        />
      </NxBento>
    </template>

    <template #empty>
      <NxEmptyState
        title="No season data yet"
        body="Run a sync to pull the calendar and standings from OpenF1."
        icon="f1"
      />
    </template>

    <div class="blocks">
      <NexusF1LockoutBanner :health="f1.status?.provider_health" />

      <section v-if="nextMeeting?.sessions?.length">
        <NxSectionHeader
          :title="`${nextMeeting.meeting_name} · your time`"
          action-label="Weekend detail"
          :to="{ name: 'f1-meeting', params: { meetingKey: nextMeeting.meeting_key } }"
        />
        <F1Weekend :sessions="nextMeeting.sessions" :now="now" />
      </section>

      <div v-if="drivers.length" class="two">
        <section>
          <NxSectionHeader
            title="The rest of the field"
            :action-label="drivers.length > 10 ? (showAllDrivers ? 'Show fewer' : 'Show all') : undefined"
            @action="showAllDrivers = !showAllDrivers"
          />
          <F1DriverRows :drivers="restOfField" :leader-points="leaderPoints" />
        </section>
        <section v-if="teams.length">
          <NxSectionHeader title="Constructors" />
          <F1ConstructorBars :teams="teams" :colours="colours" />
        </section>
      </div>

      <section>
        <NxSectionHeader :title="`Calendar · ${f1.season?.year ?? ''}`" />
        <F1Calendar :meetings="meetings" :now="now" />
      </section>

      <p class="note">
        Historical data from OpenF1. Live timing needs a paid subscription, so session results land about 35 minutes
        after the chequered flag.
      </p>
    </div>
  </IndexTemplate>
</template>

<style scoped>
.blocks {
  display: flex;
  flex-direction: column;
  gap: 44px;
}

.two {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 56px;
}

.note {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
  max-width: 70ch;
}

@media (max-width: 960px) {
  .two {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
}

@media (max-width: 640px) {
  .blocks {
    gap: 32px;
  }
}
</style>
