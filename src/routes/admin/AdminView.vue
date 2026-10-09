<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxMeters, { type MeterItem } from '@design/components/NxMeters.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NexusDataTable from '@components/nexus-data-table/NexusDataTable.vue'
import NexusTableChip from '@components/nexus-data-table/NexusTableChip.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import type { CollectionField } from '@routes/collections/collectionFields'
import { formatDateTime, relativeTime } from '@lib/datetime'
import { useAdminStore } from '@stores/admin/admin.store'
import { diskUsed, formatBytes, formatUptime, memoryUsed, share, shortClass, statusTone } from './admin'

const admin = useAdminStore()
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  void admin.refreshAll()
  pollTimer = setInterval(() => void admin.loadOverview(), 12_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(
  () => admin.queueFilter,
  () => void admin.loadJobs(1),
)

const server = computed(() => admin.overview?.server ?? null)
const openf1 = computed(() => admin.overview?.providers.openf1 ?? null)
const failed = computed(() => admin.overview?.failed_job_count ?? 0)

const totals = computed(() =>
  admin.pendingByQueue.reduce(
    (t, q) => ({ pending: t.pending + q.pending, reserved: t.reserved + q.reserved, delayed: t.delayed + q.delayed }),
    { pending: 0, reserved: 0, delayed: 0 },
  ),
)

const state = computed<ViewState>(() => (admin.overviewLoading && !admin.overview ? 'loading' : 'ready'))

const stageTitle = computed(() => {
  if (failed.value) return { title: `${failed.value} failed`, accent: failed.value === 1 ? 'job' : 'jobs' }
  if (totals.value.pending) return { title: `${totals.value.pending} jobs`, accent: 'queued' }
  return { title: 'All', accent: 'quiet' }
})

const eyebrow = computed(() => {
  const parts = ['Operations']
  if (server.value?.laravel_env) parts.push(server.value.laravel_env)
  if (admin.overview?.sampled_at) parts.push(`sampled ${relativeTime(admin.overview.sampled_at)}`)
  return parts.join(' · ')
})

const lede = computed(() => {
  const s = server.value
  if (!s) return 'Queues, failures and container health.'
  return `Up ${formatUptime(s.uptime_seconds)} on PHP ${s.php_version} with the ${s.queue_connection} queue. Refreshes every 12 seconds while this page is open.`
})

const fields = computed<CollectionField[]>(() => {
  const s = server.value
  if (!s) return []
  const memSource = s.memory.source === 'cgroup' ? 'container' : (s.memory.source ?? 'php')
  return [
    {
      key: 'memory',
      label: 'Memory',
      aside: s.memory.system_used_percent != null ? `${s.memory.system_used_percent}%` : undefined,
      value: formatBytes(memoryUsed(s)),
      sub: s.memory.system_total_bytes != null ? `of ${formatBytes(s.memory.system_total_bytes)} · ${memSource}` : memSource,
      progress: share(s.memory.system_used_percent),
      variant: 'solid',
      span: 3,
    },
    {
      key: 'cpu',
      label: 'CPU',
      value: s.cpu_percent != null ? `${s.cpu_percent}%` : (s.load?.[0]?.toFixed(2) ?? '—'),
      sub: s.load ? `load ${s.load.map((n) => n.toFixed(2)).join(' · ')}` : undefined,
      progress: share(s.cpu_percent),
      variant: 'tint',
      span: 3,
    },
    {
      key: 'disk',
      label: 'Disk',
      aside: s.disk.used_percent != null ? `${s.disk.used_percent}%` : undefined,
      value: formatBytes(diskUsed(s)),
      sub: `${formatBytes(s.disk.free_bytes)} free on ${s.disk.path || '/'}`,
      progress: share(s.disk.used_percent),
      variant: 'tint',
      span: 3,
    },
    {
      key: 'queue',
      label: 'Queue',
      value: totals.value.pending,
      sub: `${totals.value.reserved} running · ${totals.value.delayed} delayed · ${failed.value} failed`,
      variant: 'outline',
      span: 3,
    },
  ]
})

const queueMeters = computed<MeterItem[]>(() => {
  const max = Math.max(1, ...admin.pendingByQueue.map((q) => q.pending))
  return admin.pendingByQueue.map((q) => ({
    key: q.queue,
    label: q.queue,
    value: q.pending / max,
    display: String(q.pending),
  }))
})

const health = computed(() => {
  const slices = [
    { key: 'waiting', label: 'Waiting', count: Math.max(0, totals.value.pending - totals.value.reserved), tone: 'var(--acc)' },
    { key: 'running', label: 'Running', count: totals.value.reserved, tone: 'var(--ok)' },
    { key: 'delayed', label: 'Delayed', count: totals.value.delayed, tone: 'var(--warn)' },
    { key: 'failed', label: 'Failed', count: failed.value, tone: 'var(--bad)' },
  ]
  const sum = slices.reduce((a, s) => a + s.count, 0)
  return { slices, sum }
})

const queueOptions = computed(() => [
  { label: 'All queues', value: undefined as string | undefined },
  ...admin.pendingByQueue.map((q) => ({ label: `${q.queue} (${q.pending})`, value: q.queue as string | undefined })),
])
</script>

<template>
  <IndexTemplate :state="state">
    <template #stage>
      <NxStage size="compact" live :eyebrow="eyebrow" :title="stageTitle.title" :accent="stageTitle.accent" :lede="lede">
        <template #actions>
          <Button rounded severity="secondary" label="Refresh" :loading="admin.overviewLoading" @click="admin.refreshAll()">
            <template #icon="{ class: iconClass }">
              <NxIcon name="refresh" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button
            v-if="admin.telescopeUrl"
            as="a"
            :href="admin.telescopeUrl"
            target="_blank"
            rel="noopener noreferrer"
            rounded
            severity="secondary"
            label="Telescope"
          >
            <template #icon="{ class: iconClass }">
              <NxIcon name="external-link" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="server" #fields>
      <CollectionFields section="admin" :fields="fields" />
    </template>

    <div class="admin">
      <div v-if="openf1?.live_lockout" class="notice" role="status">
        <NxIcon name="clock" :size="16" />
        OpenF1 live lockout — {{ openf1.reason || 'the free API is restricted during a live session.' }}
      </div>

      <div class="cols">
        <NxPanel title="Pending by queue">
          <NxMeters v-if="queueMeters.length" :items="queueMeters" :cols="1" />
          <p v-else class="quiet">No pending jobs — every queue is clear.</p>
        </NxPanel>

        <NxPanel title="Queue health">
          <template v-if="health.sum">
            <div class="stack" role="img" :aria-label="health.slices.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(', ')">
              <i
                v-for="s in health.slices.filter((x) => x.count)"
                :key="s.key"
                :style="{ flexGrow: s.count, background: s.tone }"
              />
            </div>
            <ul class="legend">
              <li v-for="s in health.slices" :key="s.key">
                <i :style="{ background: s.tone }" />
                <span>{{ s.label }}</span>
                <b>{{ s.count }}</b>
              </li>
            </ul>
          </template>
          <p v-else class="quiet">Nothing queued or failed right now.</p>
        </NxPanel>
      </div>

      <NxPanel title="Pending jobs" variant="flush">
        <template #action>
          <Select
            v-model="admin.queueFilter"
            :options="queueOptions"
            option-label="label"
            option-value="value"
            aria-label="Filter by queue"
            size="small"
            class="queue-filter"
          />
        </template>
        <NexusDataTable
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
            <template #body="{ data }">{{ formatDateTime(data.available_at) }}</template>
          </Column>
        </NexusDataTable>
      </NxPanel>

      <NxPanel :title="`Failed jobs · ${admin.failedTotal}`" variant="flush">
        <NexusDataTable
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
              <span class="error" :title="data.exception_summary">{{ data.exception_summary }}</span>
            </template>
          </Column>
          <Column header="Failed" style="width: 11rem">
            <template #body="{ data }">{{ relativeTime(data.failed_at) }}</template>
          </Column>
          <Column header="" style="width: 6rem">
            <template #body="{ data }">
              <div class="row-actions">
                <NxIconButton
                  icon="refresh"
                  size="sm"
                  label="Retry job"
                  :disabled="admin.actionPending"
                  @click="admin.retryFailed(data.uuid)"
                />
                <NxIconButton
                  icon="trash"
                  size="sm"
                  label="Forget job"
                  :disabled="admin.actionPending"
                  @click="admin.forgetFailed(data.uuid)"
                />
              </div>
            </template>
          </Column>
        </NexusDataTable>
      </NxPanel>

      <NxPanel title="Recent activity · Telescope" variant="flush">
        <NexusDataTable :value="admin.recentJobs" :loading="admin.recentLoading" empty-message="No Telescope job entries yet.">
          <Column header="Job">
            <template #body="{ data }">
              <code>{{ shortClass(data.job_class) }}</code>
            </template>
          </Column>
          <Column header="Queue">
            <template #body="{ data }">
              <NexusTableChip v-if="data.queue" :label="data.queue" tone="info" />
              <span v-else class="quiet">—</span>
            </template>
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <NexusTableChip :label="data.status || 'unknown'" :tone="statusTone(data.status)" />
            </template>
          </Column>
          <Column header="When">
            <template #body="{ data }">{{ relativeTime(data.created_at) }}</template>
          </Column>
        </NexusDataTable>
      </NxPanel>
    </div>
  </IndexTemplate>
</template>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--warn) 14%, transparent);
  font-size: 14px;
}

.quiet {
  margin: 0;
  color: var(--ink-3);
  font-size: 14px;
}

.stack {
  display: flex;
  gap: 3px;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
}

.stack i {
  flex-basis: 0;
  min-width: 6px;
}

.legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 24px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend span {
  flex: 1;
  color: var(--ink-2);
}

.legend b {
  font-variant-numeric: tabular-nums;
}

.queue-filter {
  min-width: 170px;
}

.error {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 44ch;
  font-size: 13px;
  color: var(--ink-2);
}

.row-actions {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
