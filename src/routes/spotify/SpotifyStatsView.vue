<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpotifyChrome from '@components/nexus-spotify-chrome/NexusSpotifyChrome.vue'
import NexusSpotifyTrackRow from '@components/nexus-spotify-track-row/NexusSpotifyTrackRow.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import {
  formatBucketLabel,
  toBarChartData,
  toDoughnutChartData,
  toRadarChartData,
} from '@lib/charts'
import type { SpotifyTimeRange } from '@/types/spotify/spotify'

const spotify = useSpotifyStore()
const router = useRouter()

const timeRange = ref<SpotifyTimeRange>('short_term')

const rangeOptions = [
  { label: '4 weeks', value: 'short_term' as const },
  { label: '6 months', value: 'medium_term' as const },
  { label: 'All time', value: 'long_term' as const },
]

onMounted(() => {
  void spotify.loadHub()
})

watch(
  () => spotify.connected,
  (connected) => {
    if (connected) void spotify.loadHub()
  },
)

const loading = computed(
  () => spotify.statusLoading || (spotify.connected && spotify.tasteLoading),
)

const summary = computed(() => spotify.taste?.summary ?? null)

const timeOfDayData = computed(() =>
  toBarChartData(
    (spotify.taste?.time_of_day?.buckets ?? []).map((b) => ({
      label: formatBucketLabel(b.bucket),
      count: b.count,
    })),
    'Plays',
    '#1db954',
  ),
)

const weekdayData = computed(() =>
  toBarChartData(
    (spotify.taste?.time_of_day?.weekday ?? []).map((d) => ({
      label: d.day,
      count: d.count,
    })),
    'Plays',
    '#5ecf8a',
  ),
)

const genreData = computed(() =>
  toDoughnutChartData(
    (spotify.taste?.genres ?? []).slice(0, 10).map((g) => ({
      label: g.genre,
      count: g.count,
    })),
    'Genres',
  ),
)

const topArtists = computed(
  () => spotify.taste?.top_artists?.[timeRange.value] ?? [],
)

const topTracks = computed(
  () => spotify.taste?.top_tracks?.[timeRange.value] ?? [],
)

const onRepeat = computed(() => spotify.taste?.on_repeat?.slice(0, 10) ?? [])

const listeningRadarData = computed(() => {
  const averages = spotify.taste?.audio_metrics?.['7d']?.averages
  if (!averages) return { labels: [], datasets: [] }
  const keys: Array<{ key: string; label: string }> = [
    { key: 'energy', label: 'Energy' },
    { key: 'danceability', label: 'Dance' },
    { key: 'valence', label: 'Mood' },
    { key: 'acousticness', label: 'Acoustic' },
    { key: 'instrumentalness', label: 'Instrumental' },
    { key: 'speechiness', label: 'Speech' },
  ]
  const items = keys
    .map(({ key, label }) => ({
      label,
      count: typeof averages[key] === 'number' ? (averages[key] as number) : null,
    }))
    .filter((i): i is { label: string; count: number } => i.count !== null)
  if (items.length === 0) return { labels: [], datasets: [] }
  return toRadarChartData(items, 'Last 7 days', '#5ecf8a')
})

const hasListeningRadar = computed(
  () => (listeningRadarData.value.labels?.length ?? 0) > 0,
)

const hasCharts = computed(
  () =>
    (spotify.taste?.time_of_day?.buckets?.some((b) => b.count > 0) ?? false) ||
    (spotify.taste?.genres?.length ?? 0) > 0,
)

watch(
  () => onRepeat.value.map((r) => r.track.uri),
  (uris) => {
    void spotify.refreshLikedUris(uris)
  },
)
</script>

<template>
  <NexusPageWrapper show-toolbar title="Spotify Stats">
    <NexusSpotifyChrome>
      <div class="stats-page">
        <header class="head">
          <div>
            <p class="eyebrow">Listening</p>
            <h2>Stats</h2>
          </div>
          <Button
            v-if="spotify.connected"
            label="Sync"
            size="small"
            outlined
            :loading="spotify.syncPending"
            @click="spotify.syncNow()"
          />
        </header>

        <Message
          v-if="!spotify.connected && !spotify.statusLoading"
          severity="warn"
          :closable="false"
        >
          Connect Spotify to see listening stats.
          <Button
            class="ml-2"
            label="Connect"
            size="small"
            @click="spotify.connect()"
          />
        </Message>

        <template v-else-if="loading">
          <div class="summary-grid">
            <Skeleton v-for="n in 4" :key="n" height="4.5rem" />
          </div>
          <Skeleton height="16rem" class="chart-skel" />
          <NexusSkeletonList :rows="5" />
        </template>

        <template v-else-if="spotify.taste">
          <section v-if="summary" class="summary-grid" aria-label="Summary">
            <div class="metric">
              <span class="metric-label">Plays (7d)</span>
              <strong>{{ summary.plays_last_7d }}</strong>
            </div>
            <div class="metric">
              <span class="metric-label">Unique tracks</span>
              <strong>{{ summary.unique_tracks_last_7d }}</strong>
            </div>
            <div class="metric">
              <span class="metric-label">Peak window</span>
              <strong>
                {{
                  summary.peak_bucket
                    ? formatBucketLabel(summary.peak_bucket)
                    : '—'
                }}
              </strong>
            </div>
            <div class="metric">
              <span class="metric-label">Top genre</span>
              <strong>{{ summary.top_genre ?? '—' }}</strong>
            </div>
          </section>

          <div v-if="hasCharts" class="charts">
            <section class="chart-card">
              <h3>Time of day</h3>
              <NexusChart type="bar" :data="timeOfDayData" height="14rem" />
            </section>
            <section class="chart-card">
              <h3>Weekday</h3>
              <NexusChart type="bar" :data="weekdayData" height="14rem" />
            </section>
            <section class="chart-card chart-card--wide">
              <h3>Genres</h3>
              <NexusChart type="doughnut" :data="genreData" height="16rem" />
            </section>
            <section v-if="hasListeningRadar" class="chart-card">
              <h3>Listening DNA (7d)</h3>
              <NexusChart type="radar" :data="listeningRadarData" height="14rem" />
            </section>
          </div>

          <section class="tops">
            <div class="tops-head">
              <h3>Top artists & tracks</h3>
              <Select
                v-model="timeRange"
                :options="rangeOptions"
                option-label="label"
                option-value="value"
                size="small"
              />
            </div>
            <div class="tops-grid">
              <div>
                <h4>Artists</h4>
                <ol v-if="topArtists.length" class="rank-list">
                  <li v-for="row in topArtists" :key="row.artist.id">
                    <button
                      type="button"
                      class="rank-btn"
                      @click="
                        router.push({
                          name: 'spotify-artist',
                          params: { artistId: row.artist.id },
                        })
                      "
                    >
                      <span class="rank">{{ row.rank }}</span>
                      <span class="name">{{ row.artist.name }}</span>
                    </button>
                  </li>
                </ol>
                <p v-else class="empty">No top artists yet.</p>
              </div>
              <div>
                <h4>Tracks</h4>
                <ol v-if="topTracks.length" class="rank-list">
                  <li v-for="row in topTracks" :key="row.track.id">
                    <span class="rank">{{ row.rank }}</span>
                    <span class="name">{{ row.track.name }}</span>
                  </li>
                </ol>
                <p v-else class="empty">No top tracks yet.</p>
              </div>
            </div>
          </section>

          <section class="on-repeat">
            <h3>On repeat</h3>
            <div v-if="onRepeat.length" class="track-list">
              <NexusSpotifyTrackRow
                v-for="item in onRepeat"
                :key="item.track.id"
                :track="item.track"
                :subtitle="`${item.play_count} plays · ${item.window_days}d`"
              />
            </div>
            <p v-else class="empty">Play the same track twice in a week to see it here.</p>
          </section>
        </template>
      </div>
    </NexusSpotifyChrome>
  </NexusPageWrapper>
</template>

<style scoped>
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--spotify-green);
}

.head h2 {
  margin: 0.15rem 0 0;
  font-size: 1.6rem;
  font-weight: 700;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--spotify-green) 16%, transparent);
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.metric strong {
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: capitalize;
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.chart-card {
  padding: 1rem;
  border-radius: 0.85rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--spotify-green) 14%, transparent);
}

.chart-card--wide {
  grid-column: 1 / -1;
}

.chart-card h3,
.tops h3,
.on-repeat h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.tops,
.on-repeat {
  padding: 1rem;
  border-radius: 0.85rem;
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--spotify-green) 14%, transparent);
}

.tops-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.tops-head h3 {
  margin: 0;
}

.tops-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.tops-grid h4 {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
}

.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rank-list li,
.rank-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.rank-btn {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0.35rem 0.4rem;
  border-radius: 0.5rem;
}

.rank-btn:hover {
  background: color-mix(in srgb, var(--spotify-green) 10%, transparent);
}

.rank {
  flex: 0 0 1.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--spotify-green);
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.empty {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  font-size: 0.9rem;
}

.chart-skel {
  border-radius: 0.85rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

@media (max-width: 900px) {
  .summary-grid,
  .charts,
  .tops-grid {
    grid-template-columns: 1fr;
  }

  .chart-card--wide {
    grid-column: auto;
  }
}
</style>
