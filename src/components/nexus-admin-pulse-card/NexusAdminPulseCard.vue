<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@stores/admin/admin.store'

const admin = useAdminStore()
const router = useRouter()

onMounted(() => {
  void admin.loadOverview({ silent: true })
})

const server = computed(() => admin.overview?.server ?? null)
const openf1 = computed(() => admin.overview?.providers.openf1 ?? null)

const totalPending = computed(() =>
  admin.pendingByQueue.reduce((sum, q) => sum + q.pending, 0),
)
const failedCount = computed(() => admin.overview?.failed_job_count ?? 0)

const mode = computed<'loading' | 'empty' | 'ready'>(() => {
  if (admin.overviewLoading && !admin.overview) return 'loading'
  if (!admin.overview) return 'empty'
  return 'ready'
})

const metrics = computed(() => [
  {
    label: 'Memory',
    percent: server.value?.memory.system_used_percent ?? null,
  },
  { label: 'CPU', percent: server.value?.cpu_percent ?? null },
  { label: 'Disk', percent: server.value?.disk.used_percent ?? null },
])

function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  return `${h}h ${m}m`
}

function meterWidth(percent: number | null | undefined): string {
  if (percent == null || Number.isNaN(percent)) return '0%'
  return `${Math.min(100, Math.max(0, percent))}%`
}

function formatPercent(percent: number | null | undefined): string {
  if (percent == null || Number.isNaN(percent)) return '—'
  return `${Math.round(percent)}%`
}

function open(): void {
  void router.push({ name: 'admin' })
}
</script>

<template>
  <article class="admin-pulse" @click="open">
    <header class="head">
      <div class="brand">
        <div class="icon-wrap"><i class="pi pi-server" /></div>
        <div>
          <h3>System</h3>
          <p class="subtitle">
            <template v-if="mode === 'loading'">
              <Skeleton width="7rem" height="0.75rem" />
            </template>
            <template v-else-if="mode === 'empty'">Operations overview</template>
            <template v-else>
              {{ server?.laravel_env ?? 'runtime' }} ·
              {{ formatUptime(server?.uptime_seconds) }} up
            </template>
          </p>
        </div>
      </div>
      <Button
        label="Hub"
        icon="pi pi-arrow-right"
        size="small"
        severity="secondary"
        text
        @click.stop="open"
      />
    </header>

    <div v-if="mode === 'loading'" class="skeleton">
      <Skeleton v-for="n in 3" :key="n" width="100%" height="2.4rem" />
    </div>

    <p v-else-if="mode === 'empty'" class="empty">
      Queues, failures, and container health at a glance.
    </p>

    <template v-else>
      <div class="stats">
        <div class="stat">
          <strong>{{ totalPending }}</strong>
          <span>Pending</span>
        </div>
        <div class="stat" :class="{ 'is-alert': failedCount > 0 }">
          <strong>{{ failedCount }}</strong>
          <span>Failed</span>
        </div>
      </div>

      <ul class="metrics">
        <li v-for="metric in metrics" :key="metric.label">
          <div class="metric-head">
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ formatPercent(metric.percent) }}</span>
          </div>
          <div class="meter" aria-hidden="true">
            <div
              class="meter-fill"
              :class="{ 'is-high': (metric.percent ?? 0) >= 85 }"
              :style="{ width: meterWidth(metric.percent) }"
            />
          </div>
        </li>
      </ul>

      <p v-if="openf1?.live_lockout" class="lockout">
        <i class="pi pi-lock" />
        OpenF1 live lockout active
      </p>
    </template>
  </article>
</template>

<style scoped>
.admin-pulse {
  --admin: var(--admin-accent);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: var(--admin-card-surface);
  border: 1px solid color-mix(in srgb, var(--admin) 22%, transparent);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.admin-pulse:hover {
  border-color: color-mix(in srgb, var(--admin) 42%, transparent);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.brand {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  min-width: 0;
}

.icon-wrap {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.7rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--admin) 18%, transparent);
  color: var(--admin);
  font-size: 1.05rem;
  flex-shrink: 0;
}

.brand h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--lavender-blush);
}

.subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.82rem;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
  text-transform: capitalize;
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 58%, transparent);
  font-size: 0.92rem;
  line-height: 1.4;
}

.stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat strong {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.stat span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.stat.is-alert strong {
  color: #fb7185;
}

.metrics {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.metric-label {
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--lavender-blush) 62%, transparent);
}

.metric-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--lavender-blush);
}

.meter {
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--admin) 14%, transparent);
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--admin) 70%, #7eb8da),
    var(--admin)
  );
  transition: width 0.35s ease;
}

.meter-fill.is-high {
  background: linear-gradient(90deg, #fbbf24, #fb7185);
}

.lockout {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.8rem;
  color: #fbbf24;
}
</style>
