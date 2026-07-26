<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusChart from '@components/nexus-chart/NexusChart.vue'
import NexusSkeletonList from '@components/nexus-skeleton-list/NexusSkeletonList.vue'
import NexusDataTable from '@components/nexus-data-table/NexusDataTable.vue'
import NexusTableChip from '@components/nexus-data-table/NexusTableChip.vue'
import { useAdminStore } from '@stores/admin/admin.store'
import { toBarChartData } from '@lib/charts'
import { formatDateTime } from '@lib/datetime'

const admin = useAdminStore()
let pollTimer: ReturnType<typeof setInterval> | null = null

const server = computed(() => admin.overview?.server ?? null)
const openf1 = computed(() => admin.overview?.providers.openf1 ?? null)

const totalPending = computed(() =>
  admin.pendingByQueue.reduce((sum, q) => sum + q.pending, 0),
)
const totalReserved = computed(() =>
  admin.pendingByQueue.reduce((sum, q) => sum + q.reserved, 0),
)
const totalDelayed = computed(() =>
  admin.pendingByQueue.reduce((sum, q) => sum + q.delayed, 0),
)

const queueOptions = computed(() => [
  { label: 'All queues', value: undefined as string | undefined },
  ...admin.pendingByQueue.map((q) => ({
    label: `${q.queue} (${q.pending})`,
    value: q.queue as string | undefined,
  })),
])

const queueBarData = computed(() =>
  toBarChartData(
    admin.pendingByQueue.map((q) => ({
      label: q.queue,
      count: q.pending,
    })),
    'Pending',
    '#5b9fd4',
  ),
)

const QUEUE_STATE_COLORS: Record<string, string> = {
  Pending: '#5b9fd4',
  Reserved: '#7eb8da',
  Delayed: '#fbbf24',
  Failed: '#fb7185',
}

const queueStateData = computed(() => {
  const slices = [
    {
      label: 'Pending',
      count: Math.max(0, totalPending.value - totalReserved.value),
    },
    { label: 'Reserved', count: totalReserved.value },
    { label: 'Delayed', count: totalDelayed.value },
    { label: 'Failed', count: admin.overview?.failed_job_count ?? 0 },
  ].filter((i) => i.count > 0)

  return {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        label: 'Queue state',
        data: slices.map((s) => s.count),
        backgroundColor: slices.map(
          (s) => QUEUE_STATE_COLORS[s.label] ?? '#5b9fd4',
        ),
        borderWidth: 0,
      },
    ],
  }
})

const hasQueueBars = computed(() => admin.pendingByQueue.length > 0)
const hasQueueState = computed(() => {
  const data = queueStateData.value.datasets[0]?.data ?? []
  return data.some((n) => typeof n === 'number' && n > 0)
})

const doughnutOptions = {
  plugins: {
    legend: { position: 'bottom' as const },
  },
}

function formatBytes(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let n = value
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatUsedOfTotal(
  used: number | null | undefined,
  total: number | null | undefined,
): string {
  if (used == null && total == null) return '—'
  if (used != null && total != null) {
    return `${formatBytes(used)} of ${formatBytes(total)}`
  }
  if (used != null) return formatBytes(used)
  return formatBytes(total)
}

function memoryUsedBytes(): number | null {
  const mem = server.value?.memory
  if (!mem) return null
  if (mem.system_used_bytes != null) return mem.system_used_bytes
  if (mem.system_total_bytes != null && mem.system_available_bytes != null) {
    return Math.max(0, mem.system_total_bytes - mem.system_available_bytes)
  }
  return mem.php_usage_bytes ?? null
}

function diskUsedBytes(): number | null {
  const disk = server.value?.disk
  if (!disk) return null
  if (disk.used_bytes != null) return disk.used_bytes
  if (disk.total_bytes != null && disk.free_bytes != null) {
    return Math.max(0, disk.total_bytes - disk.free_bytes)
  }
  return null
}

function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  return `${h}h ${m}m`
}

function shortClass(name: string): string {
  const parts = name.split('\\')
  return parts[parts.length - 1] || name
}

function statusTone(
  status: string | null | undefined,
): 'neutral' | 'info' | 'success' | 'warn' | 'danger' {
  const s = (status ?? '').toLowerCase()
  if (s === 'processed' || s === 'success' || s === 'ok') return 'success'
  if (s === 'failed' || s === 'failure') return 'danger'
  if (s === 'pending' || s === 'queued' || s === 'released') return 'warn'
  if (s === 'processing' || s === 'reserved') return 'info'
  return 'neutral'
}

function meterWidth(percent: number | null | undefined): string {
  if (percent == null || Number.isNaN(percent)) return '0%'
  return `${Math.min(100, Math.max(0, percent))}%`
}

function startPolling(): void {
  stopPolling()
  pollTimer = setInterval(() => {
    void admin.loadOverview()
  }, 12_000)
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  void admin.refreshAll()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

watch(
  () => admin.queueFilter,
  () => {
    void admin.loadJobs(1)
  },
)

function openTelescope(): void {
  const url = admin.telescopeUrl
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Admin">
    <template #toolbar>
      <Button
        label="Open Telescope"
        icon="pi pi-external-link"
        text
        severity="secondary"
        :disabled="!admin.telescopeUrl"
        @click="openTelescope"
      />
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        text
        severity="secondary"
        :loading="admin.overviewLoading"
        @click="admin.refreshAll()"
      />
    </template>

    <div class="admin-page">
      <header class="hero">
        <div class="glow" aria-hidden="true" />
        <div class="hero-main">
          <div class="icon-wrap">
            <i class="pi pi-server" />
          </div>
          <div>
            <p class="eyebrow">Operations</p>
            <h2>System admin</h2>
            <p class="muted">
              Queues, failures, container health, and a deep-link into Telescope.
              Stats refresh while this page is open.
            </p>
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <strong>{{ totalPending }}</strong>
            <span>Pending</span>
          </div>
          <div class="stat">
            <strong>{{ admin.overview?.failed_job_count ?? 0 }}</strong>
            <span>Failed</span>
          </div>
          <div class="stat">
            <strong>{{ formatUptime(server?.uptime_seconds) }}</strong>
            <span>Uptime</span>
          </div>
        </div>
      </header>

      <Message
        v-if="openf1?.live_lockout"
        severity="warn"
        :closable="false"
      >
        OpenF1 live lockout —
        {{ openf1.reason || 'free API restricted during a live session.' }}
      </Message>

      <template v-if="admin.overviewLoading && !admin.overview">
        <NexusSkeletonList :count="4" />
      </template>

      <template v-else>
        <section class="summary-grid" aria-label="Resource summary">
          <div class="metric">
            <span class="metric-label">Memory</span>
            <strong>
              {{
                formatUsedOfTotal(
                  memoryUsedBytes(),
                  server?.memory.system_total_bytes,
                )
              }}
            </strong>
            <div class="meter" aria-hidden="true">
              <div
                class="meter-fill"
                :style="{
                  width: meterWidth(server?.memory.system_used_percent),
                }"
              />
            </div>
            <span class="metric-meta">
              {{
                server?.memory.system_used_percent != null
                  ? `${server.memory.system_used_percent}% used`
                  : 'usage'
              }}
              ·
              {{
                server?.memory.source === 'cgroup'
                  ? 'container'
                  : server?.memory.source === 'host'
                    ? 'host'
                    : 'php'
              }}
              · PHP {{ formatBytes(server?.memory.php_usage_bytes) }}
            </span>
          </div>

          <div class="metric">
            <span class="metric-label">CPU / load</span>
            <strong>
              {{
                server?.cpu_percent != null
                  ? `${server.cpu_percent}%`
                  : (server?.load?.[0]?.toFixed(2) ?? '—')
              }}
            </strong>
            <div class="meter" aria-hidden="true">
              <div
                class="meter-fill"
                :style="{ width: meterWidth(server?.cpu_percent) }"
              />
            </div>
            <span class="metric-meta">
              load
              {{
                server?.load
                  ? server.load.map((n) => n.toFixed(2)).join(' · ')
                  : 'n/a'
              }}
            </span>
          </div>

          <div class="metric">
            <span class="metric-label">Disk</span>
            <strong>
              {{
                formatUsedOfTotal(diskUsedBytes(), server?.disk.total_bytes)
              }}
            </strong>
            <div class="meter" aria-hidden="true">
              <div
                class="meter-fill"
                :style="{ width: meterWidth(server?.disk.used_percent) }"
              />
            </div>
            <span class="metric-meta">
              {{
                server?.disk.used_percent != null
                  ? `${server.disk.used_percent}% used`
                  : 'usage'
              }}
              · {{ server?.disk.path || '/' }}
              · {{ formatBytes(server?.disk.free_bytes) }} free
            </span>
          </div>

          <div class="metric">
            <span class="metric-label">Runtime</span>
            <strong>{{ server?.laravel_env ?? '—' }}</strong>
            <span class="metric-meta runtime-meta">
              PHP {{ server?.php_version }} · queue
              {{ server?.queue_connection }}
            </span>
          </div>
        </section>

        <div class="charts">
          <section class="panel">
            <h3>Pending by queue</h3>
            <NexusChart
              v-if="hasQueueBars"
              type="bar"
              :data="queueBarData"
              height="14rem"
            />
            <p v-else class="empty">No pending jobs — queues are clear.</p>
          </section>

          <section class="panel">
            <h3>Queue health</h3>
            <NexusChart
              v-if="hasQueueState"
              type="doughnut"
              :data="queueStateData"
              :options="doughnutOptions"
              height="14rem"
            />
            <p v-else class="empty">
              Nothing queued or failed right now.
            </p>
          </section>
        </div>

        <section class="panel">
          <div class="section-head">
            <h3>Pending jobs</h3>
            <Select
              v-model="admin.queueFilter"
              :options="queueOptions"
              option-label="label"
              option-value="value"
              placeholder="Filter queue"
              class="queue-filter"
            />
          </div>
          <NexusDataTable
            accent="admin"
            :value="admin.pendingJobs"
            :loading="admin.jobsLoading"
            paginator
            :rows="25"
            lazy
            :total-records="admin.pendingTotal"
            empty-message="No pending jobs in this queue."
            @page="(e) => admin.loadJobs((e.page ?? 0) + 1)"
          >
            <Column header="Job">
              <template #body="{ data }">
                <code>{{ shortClass(data.job_class) }}</code>
              </template>
            </Column>
            <Column header="Queue">
              <template #body="{ data }">
                <NexusTableChip :label="data.queue" tone="info" />
              </template>
            </Column>
            <Column field="attempts" header="Attempts" style="width: 6rem" />
            <Column header="Available">
              <template #body="{ data }">
                {{ formatDateTime(data.available_at) }}
              </template>
            </Column>
          </NexusDataTable>
        </section>

        <section class="panel">
          <div class="section-head">
            <h3>Failed jobs</h3>
          </div>
          <NexusDataTable
            accent="admin"
            :value="admin.failedJobs"
            :loading="admin.failedLoading"
            paginator
            :rows="25"
            lazy
            :total-records="admin.failedTotal"
            empty-message="No failed jobs — looking healthy."
            @page="(e) => admin.loadFailedJobs((e.page ?? 0) + 1)"
          >
            <Column header="Job">
              <template #body="{ data }">
                <code>{{ shortClass(data.job_class) }}</code>
              </template>
            </Column>
            <Column header="Queue">
              <template #body="{ data }">
                <NexusTableChip :label="data.queue" tone="info" />
              </template>
            </Column>
            <Column header="Error">
              <template #body="{ data }">
                <span class="error-cell" :title="data.exception_summary">{{
                  data.exception_summary
                }}</span>
              </template>
            </Column>
            <Column header="Failed" style="width: 10rem">
              <template #body="{ data }">
                {{ formatDateTime(data.failed_at) }}
              </template>
            </Column>
            <Column header="" style="width: 7.5rem">
              <template #body="{ data }">
                <div class="row-actions">
                  <Button
                    icon="pi pi-replay"
                    text
                    rounded
                    size="small"
                    v-tooltip.top="'Retry'"
                    :loading="admin.actionPending"
                    @click="admin.retryFailed(data.uuid)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    v-tooltip.top="'Forget'"
                    :loading="admin.actionPending"
                    @click="admin.forgetFailed(data.uuid)"
                  />
                </div>
              </template>
            </Column>
          </NexusDataTable>
        </section>

        <section class="panel">
          <div class="section-head">
            <h3>Recent activity</h3>
            <span class="muted">Telescope</span>
          </div>
          <NexusDataTable
            accent="admin"
            :value="admin.recentJobs"
            :loading="admin.recentLoading"
            empty-message="No Telescope job entries yet."
          >
            <Column header="Job">
              <template #body="{ data }">
                <code>{{ shortClass(data.job_class) }}</code>
              </template>
            </Column>
            <Column header="Queue">
              <template #body="{ data }">
                <NexusTableChip
                  v-if="data.queue"
                  :label="data.queue"
                  tone="info"
                />
                <span v-else class="muted">—</span>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <NexusTableChip
                  :label="data.status || 'unknown'"
                  :tone="statusTone(data.status)"
                />
              </template>
            </Column>
            <Column header="When">
              <template #body="{ data }">
                {{ formatDateTime(data.created_at) }}
              </template>
            </Column>
          </NexusDataTable>
        </section>
      </template>
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
  --admin: var(--admin-accent);
}

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--admin) 28%, transparent);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--admin-card-surface);
}

.glow {
  position: absolute;
  inset: -40% auto auto -10%;
  width: 60%;
  height: 120%;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--admin) 35%, transparent),
    transparent
  );
  pointer-events: none;
}

.hero-main {
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.icon-wrap {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.85rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--admin) 18%, transparent);
  color: var(--admin);
  font-size: 1.25rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--admin);
}

h2,
h3 {
  margin: 0;
}

h2 {
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
}

.muted {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.stats {
  position: relative;
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat strong {
  font-size: 1.35rem;
}

.stat span {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  background: var(--admin-card-surface);
  border: 1px solid color-mix(in srgb, var(--admin) 22%, transparent);
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

.metric-meta {
  font-size: 0.8rem;
  line-height: 1.35;
  color: color-mix(in srgb, var(--lavender-blush) 60%, transparent);
}

.runtime-meta {
  margin-top: 0.35rem;
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

.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.panel {
  padding: 1rem;
  border-radius: 0.85rem;
  background: var(--admin-card-surface);
  border: 1px solid color-mix(in srgb, var(--admin) 16%, transparent);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.panel h3 {
  font-size: 1rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.queue-filter {
  min-width: 12rem;
}

.row-actions {
  display: flex;
  gap: 0.15rem;
  justify-content: flex-end;
}

.error-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 28rem;
  line-height: 1.35;
  color: color-mix(in srgb, var(--lavender-blush) 82%, transparent);
}

.empty {
  margin: 0;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
  font-size: 0.9rem;
}

code {
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .summary-grid,
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>
