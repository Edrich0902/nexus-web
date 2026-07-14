<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSportsStore } from '@stores/sports/sports.store'
import NexusSportIcon from '@components/nexus-sport-icon/NexusSportIcon.vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import {
  HOME_FOCUS_SPORTS,
  SPORT_LABELS,
  type SportsEventSummary,
  type SportsSlug,
} from '@/types/sports/sports'
import { formatDate } from '@lib/datetime'

const sports = useSportsStore()
const router = useRouter()

onMounted(() => {
  void sports.loadHome()
})

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (sports.homeLoading && !sports.home) return 'loading'
  if (!sports.home) return 'empty'
  return results.value.length > 0 || leaders.value.length > 0 ? 'ready' : 'empty'
})

const results = computed(() => {
  const featured = sports.home?.featured
  if (!featured) return [] as SportsEventSummary[]
  return HOME_FOCUS_SPORTS.map((slug) => featured[slug]?.last)
    .filter((event): event is SportsEventSummary => Boolean(event))
})

const leaders = computed(
  () => sports.home?.football_table_leaders?.[0]?.top?.slice(0, 4) ?? [],
)

const tableLeague = computed(
  () => sports.home?.football_table_leaders?.[0]?.league ?? 'Premier League',
)

function openSport(slug: string): void {
  void router.push(`/sports/${slug}`)
}

function openCard(): void {
  if (mode.value === 'loading') return
  void router.push('/sports/football')
}

function labelFor(slug: string): string {
  return SPORT_LABELS[slug as SportsSlug] ?? slug
}

function whenLabel(event: SportsEventSummary): string {
  return formatDate(event.starts_at)
}

function line(event: SportsEventSummary): string {
  if (event.home_team && event.away_team) {
    if (event.home_score != null || event.away_score != null) {
      return `${event.home_team} ${event.home_score ?? '–'}–${event.away_score ?? '–'} ${event.away_team}`
    }
    return `${event.home_team} vs ${event.away_team}`
  }
  return event.name
}

function resultHint(event: SportsEventSummary): string | null {
  if (event.home_score != null || event.away_score != null) {
    return event.status || 'FT'
  }
  if (event.result_text) {
    const lines = event.result_text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const ranked = lines.find(
      (l) => /^(?:T?\d+\.?|[1-9]\d*\))\b/.test(l) || /winner/i.test(l),
    )
    const pick =
      ranked ??
      lines.find((l) => !/^(after|top|pos\.?|round)/i.test(l)) ??
      lines[0]
    return pick ? pick.slice(0, 48) : event.status
  }
  return event.status
}
</script>

<template>
  <article
    class="results-card"
    :class="{ loading: mode === 'loading' }"
    role="link"
    tabindex="0"
    :aria-busy="mode === 'loading'"
    @click="openCard"
    @keydown.enter="openCard"
  >
    <template v-if="mode === 'loading'">
      <Skeleton width="5rem" height="0.7rem" />
      <Skeleton width="60%" height="1.3rem" />
      <Skeleton width="100%" height="6rem" />
    </template>

    <template v-else>
      <div class="status-row">
        <span class="badge">Latest results</span>
        <NexusSportIcon sport="football" :size="18" />
      </div>

      <template v-if="mode === 'empty'">
        <h3>No recent results</h3>
        <p>Sync sports to fill football, rugby and golf results.</p>
      </template>

      <template v-else>
        <h3>Last out</h3>
        <p class="lede">Most recent finished / scored item per focus sport.</p>

        <ul class="result-list">
          <li
            v-for="event in results"
            :key="event.id"
            @click.stop="openSport(event.sport_slug)"
          >
            <div class="logos">
              <NexusTeamBadge
                :src="event.home_badge_url || event.league_badge_url"
                :label="event.home_team || event.name"
                size="sm"
              />
              <NexusTeamBadge
                v-if="event.away_team"
                :src="event.away_badge_url"
                :label="event.away_team"
                size="sm"
              />
            </div>
            <div class="copy">
              <span class="sport">{{ labelFor(event.sport_slug) }}</span>
              <span class="name">{{ line(event) }}</span>
              <span v-if="resultHint(event)" class="hint">{{
                resultHint(event)
              }}</span>
            </div>
            <span class="when">{{ whenLabel(event) }}</span>
          </li>
        </ul>

        <div v-if="leaders.length" class="table-block">
          <div class="table-head">
            <span>{{ tableLeague }}</span>
            <span>Top of table</span>
          </div>
          <ul class="leaders">
            <li v-for="(team, idx) in leaders" :key="idx">
              <span class="rank">{{ team.rank ?? idx + 1 }}</span>
              <NexusTeamBadge :src="team.badge" :label="team.team" size="sm" />
              <span class="team">{{ team.team }}</span>
              <strong>{{ team.points }}</strong>
            </li>
          </ul>
        </div>
      </template>
    </template>
  </article>
</template>

<style scoped>
.results-card {
  background: var(--sports-card-surface);
  border: 1px solid color-mix(in srgb, var(--sports-accent) 22%, transparent);
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.results-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--sports-accent) 45%, transparent);
}

.results-card.loading {
  cursor: default;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--sports-accent);
}

.badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--lavender-blush);
}

.lede,
p {
  margin: 0;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 58%, transparent);
}

.result-list {
  list-style: none;
  margin: 0.35rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.result-list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.55rem;
  align-items: center;
}

.logos {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sport {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sports-accent);
}

.name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--lavender-blush);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint {
  font-size: 0.7rem;
  color: color-mix(in srgb, var(--lavender-blush) 52%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.when {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
}

.table-block {
  margin-top: 0.45rem;
  padding-top: 0.7rem;
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.table-head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.leaders {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.leaders li {
  display: grid;
  grid-template-columns: 1.2rem auto 1fr auto;
  gap: 0.45rem;
  align-items: center;
  font-size: 0.8rem;
  color: var(--lavender-blush);
}

.rank {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.team {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaders strong {
  font-variant-numeric: tabular-nums;
}
</style>
