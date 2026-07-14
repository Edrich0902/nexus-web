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
import { formatDateTime } from '@lib/datetime'

const sports = useSportsStore()
const router = useRouter()

onMounted(() => {
  void sports.loadHome()
})

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (sports.homeLoading && !sports.home) return 'loading'
  if (!sports.home) return 'empty'
  const featured = sports.home.featured
  if (!featured) return 'empty'
  const has = HOME_FOCUS_SPORTS.some(
    (slug) => featured[slug]?.next || featured[slug]?.last,
  )
  return has ? 'ready' : 'empty'
})

const lanes = computed(() =>
  HOME_FOCUS_SPORTS.map((slug) => {
    const lane = sports.home?.featured?.[slug]
    const focus = lane?.next ?? lane?.last ?? null
    const kind: 'upcoming' | 'recent' | 'empty' = lane?.next
      ? 'upcoming'
      : lane?.last
        ? 'recent'
        : 'empty'
    return { slug, label: SPORT_LABELS[slug], focus, kind, lane }
  }),
)

function openSport(slug: string): void {
  void router.push(`/sports/${slug}`)
}

function openCard(): void {
  if (mode.value === 'loading') return
  const first = lanes.value.find((l) => l.focus)?.slug ?? 'football'
  void router.push(`/sports/${first}`)
}

function whenLabel(event: SportsEventSummary): string {
  return formatDateTime(event.starts_at)
}

function headline(event: SportsEventSummary): string {
  if (event.home_team && event.away_team) {
    return `${event.home_team} vs ${event.away_team}`
  }
  return event.name
}

function scoreLine(event: SportsEventSummary): string | null {
  if (event.home_score != null || event.away_score != null) {
    return `${event.home_score ?? '–'} – ${event.away_score ?? '–'}`
  }
  if (!event.result_text) return null
  const lines = plainSportsText(event.result_text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const ranked = lines.find(
    (l) => /^(?:T?\d+\.?|[1-9]\d*\))\b/.test(l) || /winner/i.test(l),
  )
  const pick =
    ranked ??
    lines.find((l) => !/^(after|top|pos\.?|round|first half|second half|overtime)/i.test(l)) ??
    lines[0]
  return pick ? pick.slice(0, 72) : null
}

function plainSportsText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
</script>

<template>
  <article
    class="focus-card"
    :class="{ loading: mode === 'loading' }"
    role="link"
    tabindex="0"
    :aria-busy="mode === 'loading'"
    @click="openCard"
    @keydown.enter="openCard"
  >
    <template v-if="mode === 'loading'">
      <Skeleton width="6rem" height="0.7rem" />
      <Skeleton width="55%" height="1.35rem" />
      <div class="lane-grid">
        <Skeleton v-for="n in 3" :key="n" height="7.5rem" />
      </div>
    </template>

    <template v-else>
      <div class="status-row">
        <span class="badge">Match centre</span>
        <NexusSportIcon sport="hub" :size="18" />
      </div>

      <template v-if="mode === 'empty'">
        <h3>No football / rugby / golf yet</h3>
        <p>Sync Sports Hub to load upcoming fixtures and latest results.</p>
        <Button
          label="Sync sports"
          size="small"
          @click.stop="sports.syncNow('all')"
        />
      </template>

      <template v-else>
        <div class="title-row">
          <h3>Football · Rugby · Golf</h3>
          <p>Next up, or the latest result if nothing’s scheduled.</p>
        </div>

        <div class="lane-grid">
          <button
            v-for="lane in lanes"
            :key="lane.slug"
            type="button"
            class="lane"
            @click.stop="openSport(lane.slug)"
          >
            <div class="lane-head">
              <div class="lane-brand">
                <NexusSportIcon :sport="lane.slug as SportsSlug" :size="16" />
                <span>{{ lane.label }}</span>
              </div>
              <Tag
                v-if="lane.kind !== 'empty'"
                :value="lane.kind === 'upcoming' ? 'Next' : 'Latest'"
                :severity="lane.kind === 'upcoming' ? 'success' : 'secondary'"
              />
            </div>

            <template v-if="lane.focus">
              <p class="league">{{ lane.focus.league_name || 'Competition' }}</p>
              <div
                v-if="lane.focus.home_team && lane.focus.away_team"
                class="matchup"
              >
                <div class="side">
                  <NexusTeamBadge
                    :src="lane.focus.home_badge_url"
                    :label="lane.focus.home_team"
                    size="md"
                  />
                  <span>{{ lane.focus.home_team }}</span>
                </div>
                <div class="mid">
                  <strong v-if="scoreLine(lane.focus)">{{
                    scoreLine(lane.focus)
                  }}</strong>
                  <span v-else class="vs">vs</span>
                </div>
                <div class="side">
                  <NexusTeamBadge
                    :src="lane.focus.away_badge_url"
                    :label="lane.focus.away_team"
                    size="md"
                  />
                  <span>{{ lane.focus.away_team }}</span>
                </div>
              </div>
              <div v-else class="solo">
                <NexusTeamBadge
                  :src="lane.focus.league_badge_url"
                  :label="lane.focus.name"
                  size="md"
                />
                <div>
                  <p class="solo-name">{{ headline(lane.focus) }}</p>
                  <p v-if="scoreLine(lane.focus)" class="solo-score">
                    {{ scoreLine(lane.focus) }}
                  </p>
                </div>
              </div>
              <p class="when">{{ whenLabel(lane.focus) }}</p>
            </template>

            <p v-else class="empty-lane">Nothing cached for this sport yet.</p>
          </button>
        </div>
      </template>
    </template>
  </article>
</template>

<style scoped>
.focus-card {
  background: var(--sports-card-surface);
  border: 1px solid color-mix(in srgb, var(--sports-accent) 22%, transparent);
  border-radius: 1rem;
  padding: 1rem 1.1rem 1.15rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.focus-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--sports-accent) 45%, transparent);
}

.focus-card.loading {
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

.title-row h3,
h3 {
  margin: 0;
  font-size: 1.12rem;
  color: var(--lavender-blush);
}

.title-row p,
p {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: color-mix(in srgb, var(--lavender-blush) 58%, transparent);
}

.lane-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.lane {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  text-align: left;
  padding: 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--sports-accent) 18%, transparent);
  background: color-mix(in srgb, var(--coffee-bean-panel) 88%, black);
  cursor: pointer;
  color: inherit;
  transition: border-color 0.15s ease;
}

.lane:hover {
  border-color: color-mix(in srgb, var(--sports-accent) 40%, transparent);
}

.lane-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
}

.lane-brand {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sports-accent);
}

.league {
  margin: 0;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
}

.matchup {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.35rem;
  align-items: center;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--lavender-blush);
  text-align: center;
}

.side span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.mid {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.8rem;
}

.mid strong {
  font-size: 0.95rem;
  color: var(--lavender-blush);
  font-variant-numeric: tabular-nums;
}

.vs {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.solo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.solo-name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--lavender-blush);
}

.solo-score {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--sports-accent);
}

.when {
  margin: 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--lavender-blush) 52%, transparent);
}

.empty-lane {
  margin: 0;
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--lavender-blush) 48%, transparent);
}

@media (max-width: 900px) {
  .lane-grid {
    grid-template-columns: 1fr;
  }
}
</style>
