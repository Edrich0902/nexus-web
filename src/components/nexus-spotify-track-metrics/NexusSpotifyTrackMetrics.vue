<script setup lang="ts">
import { computed } from 'vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import { toRadarChartData } from '@lib/charts'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import type { SpotifyTrackAudioFeatures } from '@/types/spotify/spotify'

const spotify = useSpotifyStore()

const METRIC_KEYS: Array<{
  key: keyof SpotifyTrackAudioFeatures
  label: string
}> = [
  { key: 'energy', label: 'Energy' },
  { key: 'danceability', label: 'Dance' },
  { key: 'valence', label: 'Mood' },
  { key: 'acousticness', label: 'Acoustic' },
  { key: 'instrumentalness', label: 'Instrumental' },
  { key: 'speechiness', label: 'Speech' },
]

const status = computed(() => spotify.trackFeaturesStatus)
const features = computed(() => spotify.trackFeatures)
const emptyRadar = { labels: [] as string[], datasets: [] as never[] }

const currentTrackId = computed(() => {
  const item = spotify.player?.item
  if (!item || item.type === 'episode') return null
  return item.id ?? null
})

/** Waiting on engage / in-flight fetch for the current track. */
const loading = computed(() => {
  if (status.value === 'loading') return true
  if (status.value === 'idle' && currentTrackId.value) return true
  return false
})

const radarData = computed(() => {
  const f = features.value
  if (!f) return emptyRadar
  return toRadarChartData(
    METRIC_KEYS.map(({ key, label }) => ({
      label,
      count: typeof f[key] === 'number' ? (f[key] as number) : 0,
    })),
    'Now playing',
    '#1db954',
  )
})

const tempoLabel = computed(() => {
  const tempo = features.value?.tempo
  if (typeof tempo !== 'number') return null
  return `${Math.round(tempo)} BPM`
})

const keyLabel = computed(() => {
  const f = features.value
  if (f?.key == null) return null
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
  const name = names[f.key] ?? String(f.key)
  const mode = f.mode === 1 ? 'maj' : f.mode === 0 ? 'min' : ''
  return mode ? `${name} ${mode}` : name
})
</script>

<template>
  <section
    class="metrics-panel"
    aria-label="Track metrics"
    :aria-busy="loading"
  >
    <div class="metrics-head">
      <h3>Track metrics</h3>
      <template v-if="loading">
        <Skeleton width="4.5rem" height="1.35rem" border-radius="999px" />
        <Skeleton width="3.5rem" height="1.35rem" border-radius="999px" />
      </template>
      <template v-else>
        <span v-if="tempoLabel" class="chip">{{ tempoLabel }}</span>
        <span v-if="keyLabel" class="chip">{{ keyLabel }}</span>
      </template>
    </div>

    <div v-if="loading" class="metrics-skel" aria-hidden="true">
      <Skeleton width="100%" height="14rem" border-radius="0.85rem" />
    </div>

    <p v-else-if="status === 'idle'" class="hint">
      Play a track to load acoustic metrics.
    </p>

    <p v-else-if="status === 'unavailable'" class="hint">
      Metrics aren’t available for this track yet.
    </p>

    <div v-else-if="status === 'ready'" class="metrics-body">
      <NexusChart type="radar" :data="radarData" height="14rem" />
    </div>
  </section>
</template>

<style scoped>
.metrics-panel {
  background: var(--spotify-card-surface);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 12%, transparent);
  border-radius: 1rem;
  padding: 1rem 1.15rem 1.15rem;
}

.metrics-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.metrics-head h3 {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--light-green);
  flex: 1 1 auto;
}

.chip {
  font-size: 0.75rem;
  color: var(--lavender-blush);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 18%, transparent);
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
}

.hint {
  margin: 0;
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
}

.metrics-skel {
  margin-top: 0.25rem;
}

.metrics-body {
  margin-top: 0.25rem;
}
</style>
