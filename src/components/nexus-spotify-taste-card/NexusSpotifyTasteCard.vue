<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import { formatBucketLabel, toBarChartData } from '@lib/charts'

const spotify = useSpotifyStore()
const router = useRouter()

onMounted(() => {
  void spotify.loadHub()
})

const summary = computed(() => spotify.taste?.summary ?? null)

const topGenres = computed(() => spotify.taste?.genres?.slice(0, 4) ?? [])

const topArtist = computed(() => {
  const short = spotify.taste?.top_artists?.short_term?.[0]?.artist
  const medium = spotify.taste?.top_artists?.medium_term?.[0]?.artist
  return short ?? medium ?? null
})

const onRepeatLead = computed(() => spotify.taste?.on_repeat?.[0] ?? null)

const weekdayData = computed(() =>
  toBarChartData(
    (spotify.taste?.time_of_day?.weekday ?? []).map((d) => ({
      label: d.day,
      count: d.count,
    })),
    'Plays',
    '#1db954',
  ),
)

const hasWeekdayChart = computed(
  () =>
    (spotify.taste?.time_of_day?.weekday ?? []).some((d) => d.count > 0),
)

const weekdayOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { font: { size: 10 }, maxRotation: 0 },
      grid: { display: false },
    },
    y: { display: false, beginAtZero: true },
  },
}

const mode = computed<'connect' | 'loading' | 'empty' | 'ready'>(() => {
  if (!spotify.connected && !spotify.statusLoading) return 'connect'
  if (spotify.statusLoading || (spotify.connected && spotify.tasteLoading)) {
    return 'loading'
  }
  if (!summary.value && !spotify.taste) return 'empty'
  return 'ready'
})

function openStats(): void {
  if (mode.value === 'loading') return
  if (mode.value === 'connect') {
    void spotify.connect()
    return
  }
  void router.push({ name: 'spotify-stats' })
}
</script>

<template>
  <article
    class="taste-card"
    :class="{ loading: mode === 'loading' }"
    role="link"
    tabindex="0"
    :aria-busy="mode === 'loading'"
    @click="openStats"
    @keydown.enter="openStats"
  >
    <template v-if="mode === 'loading'">
      <Skeleton width="5rem" height="0.7rem" />
      <Skeleton width="55%" height="1.4rem" />
      <div class="metrics">
        <Skeleton v-for="n in 3" :key="n" height="3.25rem" />
      </div>
      <Skeleton width="100%" height="4.5rem" />
    </template>

    <template v-else>
      <div class="status-row">
        <span class="badge">Listening taste</span>
        <NexusSpotifyIcon :size="18" />
      </div>

      <template v-if="mode === 'connect'">
        <h3>Connect Spotify</h3>
        <p class="lede">Unlock listening stats and taste highlights.</p>
        <Button label="Connect" size="small" severity="success" />
      </template>

      <template v-else-if="mode === 'empty'">
        <h3>No taste data yet</h3>
        <p class="lede">Sync Spotify to compute your listening summary.</p>
        <Button label="Open Spotify" size="small" text />
      </template>

      <template v-else>
        <h3>
          {{
            summary?.peak_bucket
              ? `${formatBucketLabel(summary.peak_bucket)} listener`
              : 'Your listening'
          }}
        </h3>
        <p v-if="topArtist" class="lede">
          Top artist · {{ topArtist.name }}
        </p>

        <div class="metrics" aria-label="Listening summary">
          <div class="metric">
            <span class="metric-value">{{ summary?.plays_last_7d ?? 0 }}</span>
            <span class="metric-label">Plays · 7d</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{
              summary?.unique_tracks_last_7d ?? 0
            }}</span>
            <span class="metric-label">Unique tracks</span>
          </div>
          <div class="metric">
            <span class="metric-value peak">
              {{
                summary?.peak_bucket
                  ? formatBucketLabel(summary.peak_bucket)
                  : '—'
              }}
            </span>
            <span class="metric-label">Peak window</span>
          </div>
        </div>

        <div v-if="topGenres.length" class="genres">
          <Tag
            v-for="g in topGenres"
            :key="g.genre"
            :value="g.genre"
            severity="secondary"
            rounded
          />
        </div>

        <div
          v-if="hasWeekdayChart"
          class="weekday"
          @click.stop
        >
          <span class="section-label">Weekday rhythm</span>
          <NexusChart
            type="bar"
            :data="weekdayData"
            :options="weekdayOptions"
            height="4.75rem"
          />
        </div>

        <div v-if="onRepeatLead" class="repeat">
          <span class="section-label">On repeat</span>
          <p class="repeat-line">
            {{ onRepeatLead.track.name }}
            <span>· {{ onRepeatLead.play_count }} plays</span>
          </p>
        </div>

        <Button label="View stats" size="small" text class="cta" />
      </template>
    </template>
  </article>
</template>

<style scoped>
.taste-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--light-green) 16%, transparent);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.taste-card:hover {
  border-color: color-mix(in srgb, var(--light-green) 40%, transparent);
  transform: translateY(-1px);
}

.taste-card.loading {
  cursor: default;
  pointer-events: none;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--light-green);
  background: color-mix(in srgb, var(--light-green) 14%, transparent);
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
}

h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: capitalize;
}

.lede {
  margin: -0.2rem 0 0;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  font-size: 0.9rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.55rem 0.6rem;
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--coffee-bean) 45%, transparent);
  border: 1px solid color-mix(in srgb, var(--light-green) 10%, transparent);
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.metric-value.peak {
  font-size: 0.95rem;
  text-transform: capitalize;
}

.metric-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.genres :deep(.p-tag) {
  font-size: 0.75rem;
  text-transform: lowercase;
}

.section-label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.weekday {
  margin-top: 0.1rem;
}

.repeat-line {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repeat-line span {
  font-weight: 500;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
}

.cta {
  align-self: flex-start;
  margin-top: 0.1rem;
}

@media (max-width: 520px) {
  .metrics {
    grid-template-columns: 1fr;
  }
}
</style>
