<script setup lang="ts">
import { computed } from 'vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import { formatDateTime } from '@lib/datetime'
import type { SportsEventSummary } from '@/types/sports/sports'

const props = defineProps<{
  event: SportsEventSummary
}>()

const hasMatchup = computed(
  () => Boolean(props.event.home_team && props.event.away_team),
)

const hasNumericScore = computed(
  () => props.event.home_score != null || props.event.away_score != null,
)

const resultPreview = computed(() => {
  // Scoreboard already shows FT scores; rugby period HTML is noise here.
  if (hasNumericScore.value) return []

  const text = plainResultText(props.event.result_text)
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
})

const scoreUnavailable = computed(
  () =>
    hasMatchup.value &&
    !hasNumericScore.value &&
    resultPreview.value.length === 0 &&
    props.event.sport_slug === 'tennis',
)

function plainResultText(raw?: string | null): string {
  if (!raw) return ''
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function formatWhen(event: SportsEventSummary): string {
  return formatDateTime(event.starts_at)
}
</script>

<template>
  <article class="event-card" :class="{ major: event.is_major }">
    <div class="event-card-top">
      <span class="league">
        <template v-if="event.series">{{ event.series }} · </template>
        {{ event.league_name || 'Competition' }}
      </span>
      <div class="top-right">
        <Tag v-if="event.is_major" value="Major" severity="warn" />
        <span class="when">{{ formatWhen(event) }}</span>
      </div>
    </div>

    <div v-if="hasMatchup" class="matchup">
      <div class="side home">
        <NexusTeamBadge
          :src="event.home_badge_url"
          :label="event.home_team"
          size="lg"
        />
        <span class="team">{{ event.home_team }}</span>
      </div>

      <div class="scoreboard">
        <template v-if="hasNumericScore">
          <span class="score">{{ event.home_score ?? '–' }}</span>
          <span class="divider">:</span>
          <span class="score">{{ event.away_score ?? '–' }}</span>
        </template>
        <template v-else-if="scoreUnavailable">
          <span class="score-missing">Score n/a</span>
        </template>
        <template v-else>
          <span class="score">–</span>
          <span class="divider">:</span>
          <span class="score">–</span>
        </template>
        <span v-if="event.status" class="status">{{ event.status }}</span>
      </div>

      <div class="side away">
        <NexusTeamBadge
          :src="event.away_badge_url"
          :label="event.away_team"
          size="lg"
        />
        <span class="team">{{ event.away_team }}</span>
      </div>
    </div>

    <div v-else class="solo">
      <NexusTeamBadge
        v-if="event.league_badge_url"
        :src="event.league_badge_url"
        :label="event.name"
        size="md"
      />
      <div>
        <p class="solo-name">{{ event.name }}</p>
        <p v-if="event.status" class="solo-meta">{{ event.status }}</p>
      </div>
    </div>

    <div v-if="resultPreview.length" class="result-block">
      <p class="result-label">Result</p>
      <pre class="result-text">{{ resultPreview.join('\n') }}</pre>
    </div>

    <p v-else-if="scoreUnavailable" class="feed-note">
      TheSportsDB free feed does not include tennis set scores for this match.
    </p>
  </article>
</template>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border-radius: 0.9rem;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--sports-accent) 16%, transparent),
      transparent 55%
    ),
    color-mix(in srgb, var(--coffee-bean-panel) 92%, black);
  border: 1px solid color-mix(in srgb, var(--sports-accent) 22%, transparent);
}

.event-card.major {
  border-color: color-mix(in srgb, #d4a017 45%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #d4a017 20%, transparent);
}

.event-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.league {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--lavender-blush) 58%, transparent);
}

.top-right {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.when {
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.matchup {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.75rem;
  align-items: center;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
  min-width: 0;
}

.team {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--lavender-blush);
  line-height: 1.2;
}

.scoreboard {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 4.5rem;
}

.scoreboard .score {
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--lavender-blush);
  font-variant-numeric: tabular-nums;
}

.scoreboard .divider {
  color: color-mix(in srgb, var(--lavender-blush) 40%, transparent);
}

.score-missing {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.status {
  width: 100%;
  text-align: center;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sports-accent);
}

.solo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.solo-name {
  margin: 0;
  font-weight: 600;
  color: var(--lavender-blush);
}

.solo-meta {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.result-block {
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  padding-top: 0.65rem;
}

.result-label {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sports-accent);
}

.result-text {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.78rem;
  line-height: 1.35;
  color: color-mix(in srgb, var(--lavender-blush) 78%, transparent);
}

.feed-note {
  margin: 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
}

@media (max-width: 640px) {
  .matchup {
    gap: 0.4rem;
  }

  .team {
    font-size: 0.74rem;
  }
}
</style>
