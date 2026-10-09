<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import type { ViewState } from '@design/templates/types'
import NexusF1LockoutBanner from '@components/nexus-f1-lockout-banner/NexusF1LockoutBanner.vue'
import { useF1Store } from '@stores/f1/f1.store'
import F1Circuit from './F1Circuit.vue'
import F1Weekend from './F1Weekend.vue'
import {
  countdown,
  focusSession,
  meetingDates,
  meetingPlace,
  meetingState,
  rounds,
  sessionStatus,
  sessionWhen,
  splitMeetingName,
  useNow,
} from './f1'

const route = useRoute()
const f1 = useF1Store()
const now = useNow()

const meetingKey = computed(() => Number(route.params.meetingKey))

watch(
  meetingKey,
  (key) => {
    if (Number.isFinite(key)) void f1.loadMeeting(key)
    if (!f1.season) void f1.loadSeason()
  },
  { immediate: true },
)

const meeting = computed(() =>
  f1.meeting?.meeting_key === meetingKey.value ? f1.meeting : null,
)

const state = computed<ViewState>(() => {
  if (!meeting.value) return f1.meetingLoading ? 'loading' : 'error'
  return 'ready'
})

const sessions = computed(() => meeting.value?.sessions ?? [])
const heading = computed(() => splitMeetingName(meeting.value?.meeting_name ?? ''))

const round = computed(() => {
  const list = rounds(f1.season?.meetings ?? [])
  const i = list.findIndex((m) => m.meeting_key === meetingKey.value)
  return i >= 0 ? `Round ${i + 1} of ${list.length}` : null
})

const phase = computed(() => (meeting.value ? meetingState(meeting.value, now.value) : 'done'))
const focus = computed(() => focusSession(sessions.value, now.value))

const eyebrow = computed(() => {
  const m = meeting.value
  if (!m) return ''
  const parts: (string | null | undefined)[] = [round.value, m.country_name]
  if (phase.value !== 'done' && focus.value) {
    const c = countdown(focus.value.date_start, now.value)
    parts.push(c ? `${focus.value.session_name} in ${c.title.replace(/,$/, '')}` : `${focus.value.session_name} live`)
  }
  return parts.filter(Boolean).join(' · ')
})

const lede = computed(() => {
  const m = meeting.value
  if (!m) return ''
  return `${meetingPlace(m)} · ${meetingDates(m)}`
})

const facts = computed(() => {
  const m = meeting.value
  if (!m) return []
  return [
    { label: 'Circuit', value: m.circuit_short_name },
    { label: 'Location', value: m.location },
    { label: 'Country', value: m.country_name },
    { label: 'Dates', value: meetingDates(m) },
    { label: 'Layout', value: m.circuit_type },
    { label: 'Local offset', value: m.gmt_offset ? `UTC ${m.gmt_offset.slice(0, 6)}` : null },
  ]
})
</script>

<template>
  <DetailTemplate
    :state="state"
    :back-to="{ name: 'f1' }"
    back-label="Formula 1"
    error-title="Could not load this weekend"
  >
    <template #stage>
      <NxStage
        :live="phase === 'live'"
        :eyebrow="eyebrow"
        :title="heading.title"
        :accent="heading.accent"
        :lede="lede"
      >
        <template #visual>
          <F1Circuit :src="meeting?.circuit_image" :alt="meeting?.circuit_short_name ?? ''" />
        </template>
      </NxStage>
    </template>

    <NexusF1LockoutBanner :health="f1.status?.provider_health" />

    <section v-if="sessions.length">
      <NxSectionHeader title="The weekend · your time" />
      <F1Weekend :sessions="sessions" :now="now" />
    </section>

    <section>
      <NxSectionHeader title="Sessions" />
      <ol v-if="sessions.length" class="sessions">
        <li v-for="s in sessions" :key="s.session_key">
          <RouterLink :to="{ name: 'f1-session', params: { sessionKey: s.session_key } }" class="row">
            <span class="name">
              <b>{{ s.session_name }}</b>
              <span class="type">{{ s.session_type }}</span>
            </span>
            <span class="when">{{ sessionWhen(s.date_start) }}</span>
            <span class="status" :class="`t-${sessionStatus(s, now).tone}`">
              {{ sessionStatus(s, now).label }}
            </span>
            <NxIcon name="chevron-right" :size="16" class="chev" />
          </RouterLink>
        </li>
      </ol>
      <p v-else class="nx-muted">No sessions published for this weekend yet.</p>
    </section>

    <template #aside>
      <NxPanel title="About the weekend">
        <NxFacts :items="facts" :cols="2" />
        <p v-if="meeting?.meeting_official_name" class="official">{{ meeting.meeting_official_name }}</p>
      </NxPanel>
    </template>
  </DetailTemplate>
</template>

<style scoped>
.sessions {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 120px 16px;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  color: inherit;
}

li:first-child .row {
  border-top: 0;
}

.row:hover b {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

b {
  font-weight: 600;
}

.type {
  font-size: 13px;
  color: var(--ink-3);
}

.when {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink-2);
}

.status {
  font-size: 13px;
  text-align: right;
}

.t-ok {
  color: var(--ok);
}

.t-live {
  color: var(--acc);
  font-weight: 600;
}

.t-pending {
  color: var(--warn);
}

.t-muted {
  color: var(--ink-3);
}

.chev {
  color: var(--ink-3);
}

.official {
  margin: 18px 0 0;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto 16px;
    gap: 10px;
  }

  .when {
    grid-column: 1;
    grid-row: 2;
    margin-top: -8px;
  }
}
</style>
