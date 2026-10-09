<script setup lang="ts">
import { computed } from 'vue'
import type { F1MeetingSummary } from '@/types/f1/f1'
import { isTesting, meetingDates, meetingState } from './f1'

/** The season calendar as hairline rows; finished rounds dim, the live one glows. */
const props = defineProps<{
  meetings: F1MeetingSummary[]
  now: number
}>()

const rows = computed(() => {
  let round = 0
  return props.meetings.map((m) => {
    const testing = isTesting(m)
    if (!testing && !m.is_cancelled) round++
    return {
      meeting: m,
      label: testing ? 'Test' : m.is_cancelled ? '—' : `R${String(round).padStart(2, '0')}`,
      state: m.is_cancelled ? 'cancelled' : meetingState(m, props.now),
    }
  })
})

const nextKey = computed(
  () => rows.value.find((r) => r.state === 'live' || r.state === 'upcoming')?.meeting.meeting_key ?? null,
)
</script>

<template>
  <ol class="cal">
    <li v-for="r in rows" :key="r.meeting.meeting_key">
      <RouterLink
        :to="{ name: 'f1-meeting', params: { meetingKey: r.meeting.meeting_key } }"
        class="row"
        :class="[`s-${r.state}`, { next: r.meeting.meeting_key === nextKey }]"
      >
        <span class="rd">{{ r.label }}</span>
        <span class="name">
          <b>{{ r.meeting.meeting_name }}</b>
          <span class="where">{{ [r.meeting.location, r.meeting.country_name].filter(Boolean).join(', ') }}</span>
        </span>
        <span class="when">{{ meetingDates(r.meeting) }}</span>
        <span class="state">
          <template v-if="r.state === 'live'">Live</template>
          <template v-else-if="r.meeting.meeting_key === nextKey">Next</template>
          <template v-else-if="r.state === 'cancelled'">Cancelled</template>
        </span>
      </RouterLink>
    </li>
  </ol>
</template>

<style scoped>
.cal {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
}

.row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto 44px;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  color: inherit;
}

.row:hover b {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rd,
.when {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

b {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.where {
  font-size: 13px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state {
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  color: var(--acc);
}

.s-done b,
.s-cancelled b {
  color: var(--ink-2);
  font-weight: 500;
}

.s-cancelled b {
  text-decoration: line-through;
}

.s-cancelled .state {
  color: var(--ink-3);
}

.next .rd,
.next .when {
  color: var(--acc);
}

@media (max-width: 960px) {
  .cal {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 36px minmax(0, 1fr) auto;
    gap: 10px;
  }

  .state {
    display: none;
  }
}
</style>
