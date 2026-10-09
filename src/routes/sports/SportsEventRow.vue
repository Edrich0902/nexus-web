<script setup lang="ts">
import { computed } from 'vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import type { SportsEventSummary } from '@/types/sports/sports'
import { eventName, eventWhen, hasMatchup, hasScore, resultLines, teamLabel } from './sports'

/** A fixture or result as a hairline row: when · home score away · competition. */
const props = defineProps<{
  event: SportsEventSummary
}>()

const sport = computed(() => String(props.event.sport_slug))
const matchup = computed(() => hasMatchup(props.event))
const scored = computed(() => hasScore(props.event))
const lines = computed(() => (scored.value ? [] : resultLines(props.event.result_text, 4)))
const winner = computed(() => {
  const { home_score: h, away_score: a } = props.event
  if (h == null || a == null || h === a) return null
  return h > a ? 'home' : 'away'
})
const where = computed(() => [props.event.venue, props.event.country].filter(Boolean).join(', '))
</script>

<template>
  <article class="row" :class="{ major: event.is_major }">
    <span class="when">{{ eventWhen(event) }}</span>

    <div v-if="matchup" class="match">
      <span class="side home" :class="{ won: winner === 'home', lost: winner === 'away' }">
        <span class="team">{{ teamLabel(event.home_team, sport) }}</span>
        <NexusTeamBadge :src="event.home_badge_url" :label="event.home_team" :size="26" />
      </span>
      <span class="score num" :class="{ vs: !scored }">
        <template v-if="scored">{{ event.home_score ?? '–' }}<i>–</i>{{ event.away_score ?? '–' }}</template>
        <template v-else>vs</template>
      </span>
      <span class="side away" :class="{ won: winner === 'away', lost: winner === 'home' }">
        <NexusTeamBadge :src="event.away_badge_url" :label="event.away_team" :size="26" />
        <span class="team">{{ teamLabel(event.away_team, sport) }}</span>
      </span>
    </div>

    <div v-else class="solo">
      <NexusTeamBadge :src="event.league_badge_url" :label="event.league_name ?? event.name" :size="26" />
      <span class="solo-copy">
        <b>{{ eventName(event) }}</b>
        <span v-if="where" class="where">{{ where }}</span>
      </span>
    </div>

    <span class="comp">
      <span v-if="event.is_major" class="tag">{{ event.series || 'Major' }}</span>
      <span v-else>{{ event.league_name }}</span>
    </span>

    <p v-if="lines.length" class="result">{{ lines.join(' · ') }}</p>
  </article>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 180px;
  gap: 8px 20px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.when {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.match {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.side {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.home {
  justify-content: flex-end;
  text-align: right;
}

.team {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lost .team {
  color: var(--ink-2);
  font-weight: 500;
}

.score {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
}

.score i {
  font-style: normal;
  color: var(--ink-3);
  margin: 0 4px;
}

.score.vs {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 13px;
  color: var(--ink-3);
}

.solo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.solo-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.solo-copy b {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.where {
  font-size: 13px;
  color: var(--ink-3);
}

.comp {
  font-size: 13px;
  color: var(--ink-3);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  color: var(--acc);
  font-weight: 600;
}

.result {
  grid-column: 2 / -1;
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
}

@media (max-width: 960px) {
  .row {
    grid-template-columns: 120px minmax(0, 1fr);
  }

  .comp {
    display: none;
  }

  .result {
    grid-column: 2;
  }
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .match {
    grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr);
    gap: 8px;
  }

  .score {
    font-size: 18px;
  }

  .result {
    grid-column: 1;
  }
}
</style>
