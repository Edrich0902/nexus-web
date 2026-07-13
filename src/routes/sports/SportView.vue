<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSportIcon from '@components/nexus-sport-icon/NexusSportIcon.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import NexusSportsEventCard from '@components/nexus-sports-event-card/NexusSportsEventCard.vue'
import NexusSportsStandings from '@components/nexus-sports-standings/NexusSportsStandings.vue'
import NexusTeamBadge from '@components/nexus-team-badge/NexusTeamBadge.vue'
import { useSportsStore } from '@stores/sports/sports.store'
import { SPORT_LABELS, type SportsSlug } from '@/types/sports/sports'

const route = useRoute()
const sports = useSportsStore()

const sportSlug = computed(
  () => String(route.params.sport ?? 'football') as SportsSlug,
)
const title = computed(() => SPORT_LABELS[sportSlug.value] ?? sportSlug.value)

const upcomingCount = computed(() => sports.overview?.upcoming.length ?? 0)
const recentCount = computed(() => sports.overview?.recent.length ?? 0)
const leagueCount = computed(() => sports.overview?.leagues.length ?? 0)

onMounted(() => {
  void sports.loadSport(sportSlug.value)
})

watch(sportSlug, (slug) => {
  void sports.loadSport(slug)
})
</script>

<template>
  <NexusPageWrapper show-toolbar :title="title">
    <template #toolbar>
      <Button
        label="Sync"
        icon="pi pi-sync"
        severity="secondary"
        text
        :loading="sports.syncPending"
        @click="sports.syncNow('all')"
      />
    </template>

    <div class="sport-page">
      <header class="sport-hero">
        <div class="hero-glow" aria-hidden="true" />
        <div class="hero-main">
          <div class="sport-hero-icon">
            <NexusSportIcon :sport="sportSlug" :size="32" />
          </div>
          <div class="hero-copy">
            <p class="eyebrow">Sports Hub</p>
            <h2>{{ title }}</h2>
            <p class="muted">
              Whitelisted competitions · synced from TheSportsDB
            </p>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <strong>{{ leagueCount }}</strong>
            <span>Competitions</span>
          </div>
          <div class="stat">
            <strong>{{ upcomingCount }}</strong>
            <span>Upcoming</span>
          </div>
          <div class="stat">
            <strong>{{ recentCount }}</strong>
            <span>Recent</span>
          </div>
        </div>
      </header>

      <NexusSkeletonList v-if="sports.overviewLoading" :rows="5" />

      <template v-else-if="sports.overview">
        <section class="sport-section">
          <div class="section-head">
            <h3>Competitions</h3>
            <span class="section-count">{{ leagueCount }}</span>
          </div>
          <div class="league-grid">
            <article
              v-for="league in sports.overview.leagues"
              :key="league.id"
              class="league-chip"
            >
              <NexusTeamBadge
                :src="league.badge_url"
                :label="league.name"
                size="md"
              />
              <div>
                <p class="league-name">{{ league.name }}</p>
                <p class="league-meta">
                  {{
                    league.last_synced_at
                      ? `Synced ${new Date(league.last_synced_at).toLocaleDateString()}`
                      : 'Awaiting sync'
                  }}
                </p>
              </div>
            </article>
            <p v-if="sports.overview.leagues.length === 0" class="muted">
              No leagues synced yet. Hit Sync.
            </p>
          </div>
        </section>

        <section class="sport-section">
          <div class="section-head">
            <h3>Upcoming</h3>
            <span class="section-count">{{ upcomingCount }}</span>
          </div>
          <div v-if="sports.overview.upcoming.length" class="card-grid">
            <NexusSportsEventCard
              v-for="event in sports.overview.upcoming"
              :key="event.id"
              :event="event"
            />
          </div>
          <p v-else class="muted">No upcoming fixtures in cache yet.</p>
        </section>

        <section class="sport-section">
          <div class="section-head">
            <h3>Recent results</h3>
            <span class="section-count">{{ recentCount }}</span>
          </div>
          <div v-if="sports.overview.recent.length" class="card-grid">
            <NexusSportsEventCard
              v-for="event in sports.overview.recent"
              :key="event.id"
              :event="event"
            />
          </div>
          <p v-else class="muted">No recent results in cache yet.</p>
        </section>

        <section
          v-if="sports.overview.majors.length"
          class="sport-section"
        >
          <div class="section-head">
            <h3>Majors & signature events</h3>
          </div>
          <div class="card-grid">
            <NexusSportsEventCard
              v-for="event in sports.overview.majors"
              :key="event.id"
              :event="event"
            />
          </div>
        </section>

        <section
          v-if="sports.overview.standings.length"
          class="sport-section"
        >
          <div class="section-head">
            <h3>League tables</h3>
          </div>
          <div class="standings-stack">
            <NexusSportsStandings
              v-for="block in sports.overview.standings"
              :key="`${block.league_id}-${block.season}`"
              :block="block"
            />
          </div>
        </section>
      </template>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.sport-page {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  max-width: 72rem;
}

.sport-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.15rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid color-mix(in srgb, var(--sports-accent) 28%, transparent);
  background:
    linear-gradient(
      120deg,
      color-mix(in srgb, var(--sports-accent) 22%, transparent),
      transparent 50%
    ),
    color-mix(in srgb, var(--coffee-bean-panel) 92%, black);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero-glow {
  position: absolute;
  inset: auto -10% -40% auto;
  width: 16rem;
  height: 16rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sports-accent) 28%, transparent);
  filter: blur(40px);
  pointer-events: none;
}

.hero-main {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sport-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 1rem;
  color: var(--sports-accent);
  background: color-mix(in srgb, var(--sports-accent) 18%, transparent);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--sports-accent) 35%, transparent);
}

.eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sports-accent);
}

.hero-copy h2 {
  margin: 0.15rem 0 0;
  font-size: clamp(1.45rem, 2.4vw, 1.85rem);
  color: var(--lavender-blush);
}

.muted {
  margin: 0.25rem 0 0;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  font-size: 0.85rem;
}

.hero-stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--lavender-blush) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.stat strong {
  font-size: 1.2rem;
  color: var(--lavender-blush);
}

.stat span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.sport-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.section-head h3 {
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 72%, transparent);
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--sports-accent);
  background: color-mix(in srgb, var(--sports-accent) 16%, transparent);
}

.league-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.65rem;
}

.league-chip {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.8rem;
  border: 1px solid color-mix(in srgb, var(--sports-accent) 18%, transparent);
  background: color-mix(in srgb, var(--sports-accent) 8%, transparent);
}

.league-name {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--lavender-blush);
}

.league-meta {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--lavender-blush) 50%, transparent);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  gap: 0.75rem;
}

.standings-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 640px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>
