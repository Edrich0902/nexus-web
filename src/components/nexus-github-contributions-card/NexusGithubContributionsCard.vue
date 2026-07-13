<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGithubStore } from '@stores/github/github.store'
import NexusGithubIcon from '@components/nexus-github-icon/NexusGithubIcon.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import { toLineChartData } from '@lib/charts'

const github = useGithubStore()
const router = useRouter()

onMounted(() => {
  void github.loadStats()
})

const mode = computed<'connect' | 'loading' | 'empty' | 'ready'>(() => {
  if (!github.connected && !github.statusLoading) return 'connect'
  if (github.statusLoading || (github.connected && github.statsLoading)) {
    return 'loading'
  }
  if (!github.stats) return 'empty'
  return 'ready'
})

const sparklineData = computed(() =>
  toLineChartData(
    (github.stats?.sparkline ?? []).map((p) => ({
      label: p.date.slice(5),
      count: p.count,
    })),
    'Contributions',
    '#e6edf3',
  ),
)

const sparklineOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { display: false },
    y: { display: false },
  },
}

function openStats(): void {
  if (mode.value === 'loading') return
  if (mode.value === 'connect') {
    void github.connect()
    return
  }
  void router.push({ name: 'github-stats' })
}
</script>

<template>
  <article
    class="contrib-card"
    :class="{ loading: mode === 'loading' }"
    role="link"
    tabindex="0"
    :aria-busy="mode === 'loading'"
    @click="openStats"
    @keydown.enter="openStats"
  >
    <template v-if="mode === 'loading'">
      <Skeleton width="5rem" height="0.7rem" />
      <Skeleton width="60%" height="1.4rem" />
      <Skeleton width="100%" height="3.5rem" />
    </template>

    <template v-else>
      <div class="status-row">
        <span class="badge">Contributions</span>
        <NexusGithubIcon :size="18" />
      </div>

      <template v-if="mode === 'connect'">
        <h3>Connect GitHub</h3>
        <p>See streaks and yearly contributions.</p>
        <Button label="Connect" size="small" />
      </template>

      <template v-else-if="mode === 'empty'">
        <h3>No stats yet</h3>
        <p>Sync GitHub to compute contribution stats.</p>
        <Button label="Open GitHub" size="small" text />
      </template>

      <template v-else>
        <div class="headline">
          <div>
            <h3>{{ github.stats?.total_contributions ?? 0 }}</h3>
            <p>contributions this year</p>
          </div>
          <div class="streak">
            <strong>{{ github.stats?.current_streak ?? 0 }}d</strong>
            <span>streak</span>
          </div>
        </div>
        <div
          v-if="(github.stats?.sparkline?.length ?? 0) > 0"
          class="spark"
          @click.stop
        >
          <NexusChart
            type="line"
            :data="sparklineData"
            :options="sparklineOptions"
            height="3.5rem"
          />
        </div>
        <Button label="View stats" size="small" text />
      </template>
    </template>
  </article>
</template>

<style scoped>
.contrib-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--github-ink) 12%, transparent);
  cursor: pointer;
  min-height: 8.5rem;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.contrib-card:hover {
  border-color: color-mix(in srgb, var(--github-ink) 28%, transparent);
  transform: translateY(-1px);
}

.contrib-card.loading {
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
  color: var(--github-ink);
  background: color-mix(in srgb, var(--github-ink) 12%, transparent);
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
}

h3 {
  margin: 0.15rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
}

p {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  font-size: 0.9rem;
}

.headline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.streak {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.streak strong {
  font-size: 1.15rem;
}

.streak span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.spark {
  margin-top: 0.15rem;
}
</style>
