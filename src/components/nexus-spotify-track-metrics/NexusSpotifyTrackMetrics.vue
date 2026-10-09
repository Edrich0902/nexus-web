<script setup lang="ts">
import { computed } from 'vue'
import NxMeters, { type MeterItem } from '@design/components/NxMeters.vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'
import { audioMeters } from '@routes/spotify/listening'

const spotify = useSpotifyStore()

const KEYS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

const status = computed(() => spotify.trackFeaturesStatus)
const features = computed(() => spotify.trackFeatures)
const hasTrack = computed(() => {
  const item = spotify.player?.item
  return Boolean(item && item.type !== 'episode' && item.id)
})
const loading = computed(() => status.value === 'loading' || (status.value === 'idle' && hasTrack.value))

const meters = computed<MeterItem[]>(() => audioMeters(features.value))

const tempo = computed(() => {
  const t = features.value?.tempo
  return typeof t === 'number' ? Math.round(t) : null
})

const musicalKey = computed(() => {
  const f = features.value
  if (f?.key == null || f.key < 0) return null
  const mode = f.mode === 1 ? 'major' : f.mode === 0 ? 'minor' : ''
  return `${KEYS[f.key] ?? f.key}${mode ? ` ${mode}` : ''}`
})
</script>

<template>
  <section class="metrics" aria-label="Track character" :aria-busy="loading">
    <h2 class="nx-label">Track character</h2>

    <div v-if="loading" class="skel">
      <Skeleton v-for="n in 6" :key="n" height="2.4rem" />
    </div>
    <p v-else-if="status !== 'ready' || !meters.length" class="empty">
      {{ hasTrack ? 'No acoustic profile for this track yet.' : 'Play a track to see its character.' }}
    </p>
    <template v-else>
      <div v-if="tempo || musicalKey" class="head">
        <div v-if="tempo">
          <span class="big num">{{ tempo }}</span>
          <span class="unit">bpm</span>
        </div>
        <span v-if="musicalKey" class="big key">{{ musicalKey }}</span>
      </div>
      <NxMeters :items="meters" />
    </template>
  </section>
</template>

<style scoped>
h2 {
  margin: 0 0 14px;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 28px;
  margin-bottom: 18px;
}

.big {
  font-family: var(--font-serif);
  font-size: 40px;
  line-height: 1;
}

.key {
  font-size: 30px;
}

.unit {
  margin-left: 6px;
  font-size: 13px;
  color: var(--ink-3);
}

.skel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 22px;
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--ink-3);
}
</style>
