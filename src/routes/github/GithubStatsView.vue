<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusGithubChrome from '@components/nexus-github-chrome/NexusGithubChrome.vue'
import NexusGithubContributionGrid from '@components/nexus-github-contribution-grid/NexusGithubContributionGrid.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import { useGithubStore } from '@stores/github/github.store'
import { toDoughnutChartData, toLineChartData } from '@lib/charts'

const github = useGithubStore()
const router = useRouter()

onMounted(() => {
  void github.loadStats()
})

const loading = computed(
  () => github.statusLoading || (github.connected && github.statsLoading),
)

const sparklineData = computed(() =>
  toLineChartData(
    (github.stats?.sparkline ?? []).map((p) => ({
      label: formatSparklineLabel(p.date),
      count: p.count,
    })),
    'Contributions',
    '#e6edf3',
  ),
)

const sparklineOptions = computed(() => ({
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: Array<{ dataIndex: number }>) => {
          const point = github.stats?.sparkline?.[items[0]?.dataIndex ?? -1]
          return point ? formatFullDate(point.date) : ''
        },
        label: (item: { raw: unknown }) => {
          const count = typeof item.raw === 'number' ? item.raw : 0
          return `${count} contribution${count === 1 ? '' : 's'}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'rgba(246, 232, 234, 0.75)',
        font: { size: 11 },
        maxRotation: 0,
        autoSkip: false,
        callback(_value: string | number, index: number) {
          const points = github.stats?.sparkline ?? []
          const total = points.length
          if (total === 0 || !points[index]) return ''
          // Always show first + last; otherwise every other day to avoid crowding.
          if (index === 0 || index === total - 1 || index % 2 === 0) {
            return formatSparklineLabel(points[index].date)
          }
          return ''
        },
      },
      grid: { color: 'rgba(246, 232, 234, 0.06)' },
      border: { color: 'rgba(246, 232, 234, 0.12)' },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: 'rgba(246, 232, 234, 0.7)',
        precision: 0,
        font: { size: 11 },
      },
      grid: { color: 'rgba(246, 232, 234, 0.08)' },
      border: { color: 'rgba(246, 232, 234, 0.12)' },
    },
  },
}))

const languageData = computed(() =>
  toDoughnutChartData(
    (github.stats?.languages ?? []).map((l) => ({
      label: l.language,
      count: l.count,
    })),
    'Languages',
  ),
)

const hasSparkline = computed(
  () => (github.stats?.sparkline?.length ?? 0) > 0,
)

const hasLanguages = computed(
  () => (github.stats?.languages?.length ?? 0) > 0,
)

function formatSparklineLabel(iso: string): string {
  const parsed = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso.slice(5)
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatFullDate(iso: string): string {
  const parsed = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function openRepo(owner: string, name: string): void {
  void router.push({ name: 'github-repo', params: { owner, repo: name } })
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="GitHub Stats">
    <NexusGithubChrome>
      <div class="stats-page">
        <header class="head">
          <div>
            <p class="eyebrow">Developer activity</p>
            <h2>Stats</h2>
          </div>
          <div class="actions">
            <Button
              v-if="github.connected"
              label="Refresh"
              size="small"
              outlined
              :loading="github.statsLoading"
              @click="github.loadStats(true)"
            />
            <Button
              v-if="github.connected"
              label="Sync"
              size="small"
              text
              :loading="github.syncPending"
              @click="github.syncNow()"
            />
          </div>
        </header>

        <Message
          v-if="!github.connected && !github.statusLoading"
          severity="warn"
          :closable="false"
        >
          Connect GitHub to see contribution stats.
          <Button
            class="ml-2"
            label="Connect"
            size="small"
            @click="github.connect()"
          />
        </Message>

        <template v-else-if="loading">
          <div class="summary-grid">
            <Skeleton v-for="n in 4" :key="n" height="4.5rem" />
          </div>
          <Skeleton height="7rem" />
          <Skeleton height="14rem" />
        </template>

        <template v-else-if="github.stats">
          <section class="summary-grid" aria-label="Summary">
            <div class="metric">
              <span class="metric-label">Year contributions</span>
              <strong>{{ github.stats.total_contributions }}</strong>
            </div>
            <div class="metric">
              <span class="metric-label">Current streak</span>
              <strong>{{ github.stats.current_streak }}d</strong>
            </div>
            <div class="metric">
              <span class="metric-label">Longest streak</span>
              <strong>{{ github.stats.longest_streak }}d</strong>
            </div>
            <div class="metric">
              <span class="metric-label">Open PRs</span>
              <strong>{{ github.stats.open_pr_count }}</strong>
            </div>
          </section>

          <section class="panel">
            <h3>Contribution calendar</h3>
            <NexusGithubContributionGrid
              :weeks="github.stats.calendar.weeks"
            />
          </section>

          <div class="charts">
            <section v-if="hasSparkline" class="panel">
              <h3>Last 14 days</h3>
              <NexusChart
                type="line"
                :data="sparklineData"
                :options="sparklineOptions"
                height="15rem"
              />
            </section>
            <section v-if="hasLanguages" class="panel">
              <h3>Languages</h3>
              <NexusChart type="doughnut" :data="languageData" height="14rem" />
            </section>
          </div>

          <section class="panel">
            <h3>Active repositories</h3>
            <ul v-if="github.stats.top_repos.length" class="repo-list">
              <li v-for="repo in github.stats.top_repos" :key="repo.full_name">
                <button
                  type="button"
                  class="repo-btn"
                  @click="openRepo(repo.owner, repo.name)"
                >
                  <span class="name">{{ repo.full_name }}</span>
                  <span class="meta">
                    <Tag
                      v-if="repo.language"
                      :value="repo.language"
                      severity="secondary"
                    />
                    <span v-if="repo.pushed_at" class="pushed">
                      {{ new Date(repo.pushed_at).toLocaleDateString() }}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
            <p v-else class="empty">No synced repositories yet.</p>
          </section>
        </template>
      </div>
    </NexusGithubChrome>
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

.actions {
  display: flex;
  gap: 0.35rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--github-ink);
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
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--github-ink) 12%, transparent);
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
}

.panel {
  padding: 1rem;
  border-radius: 0.85rem;
  background: var(--github-card-surface);
  border: 1px solid color-mix(in srgb, var(--github-ink) 10%, transparent);
}

.panel h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.repo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.repo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.repo-btn:hover {
  background: color-mix(in srgb, var(--github-ink) 8%, transparent);
}

.name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.pushed {
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.empty {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.ml-2 {
  margin-left: 0.5rem;
}

@media (max-width: 900px) {
  .summary-grid,
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>
