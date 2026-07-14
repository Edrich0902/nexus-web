<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'primevue/chart'

const props = withDefaults(
  defineProps<{
    type: 'bar' | 'line' | 'doughnut' | 'pie' | 'polarArea' | 'radar'
    data: object
    options?: object
    height?: string
  }>(),
  {
    options: () => ({}),
    height: '16rem',
  },
)

const mounted = ref(false)
const showChart = ref(false)

const hasDrawableData = computed(() => {
  const data = props.data as {
    labels?: unknown[]
    datasets?: Array<{ data?: unknown[] }>
  }
  const labels = Array.isArray(data?.labels) ? data.labels : []
  const datasets = Array.isArray(data?.datasets) ? data.datasets : []
  if (datasets.length === 0) return false
  const points = datasets.some(
    (d) => Array.isArray(d.data) && d.data.length > 0,
  )
  return (
    points &&
    (labels.length > 0 ||
      props.type === 'doughnut' ||
      props.type === 'pie' ||
      props.type === 'radar' ||
      props.type === 'polarArea')
  )
})

const chartKey = computed(() => {
  try {
    return `${props.type}:${JSON.stringify(props.data)}`
  } catch {
    return props.type
  }
})

let lastMountedKey: string | null = null

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      labels: {
        color: '#f6e8ea',
        boxWidth: 12,
        font: { size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#261318',
      titleColor: '#f6e8ea',
      bodyColor: '#f6e8ea',
      borderColor: 'rgba(246, 232, 234, 0.12)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(246, 232, 234, 0.7)' },
      grid: { color: 'rgba(246, 232, 234, 0.08)' },
      border: { color: 'rgba(246, 232, 234, 0.12)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'rgba(246, 232, 234, 0.7)', precision: 0 },
      grid: { color: 'rgba(246, 232, 234, 0.08)' },
      border: { color: 'rgba(246, 232, 234, 0.12)' },
    },
  },
}

const mergedOptions = computed(() => {
  const extra = props.options as Record<string, unknown>
  const hideScales = props.type === 'doughnut' || props.type === 'pie'
  const isRadar = props.type === 'radar' || props.type === 'polarArea'
  const extraPlugins = (extra.plugins as Record<string, unknown>) ?? {}
  const extraScales = (extra.scales as Record<string, unknown>) ?? {}
  const baseScales = baseOptions.scales as Record<string, Record<string, unknown>>

  const mergeScale = (key: 'x' | 'y') => {
    const base = baseScales[key] ?? {}
    const incoming = (extraScales[key] as Record<string, unknown>) ?? {}
    return {
      ...base,
      ...incoming,
      ticks: {
        ...((base.ticks as object) ?? {}),
        ...((incoming.ticks as object) ?? {}),
      },
      grid: {
        ...((base.grid as object) ?? {}),
        ...((incoming.grid as object) ?? {}),
      },
      border: {
        ...((base.border as object) ?? {}),
        ...((incoming.border as object) ?? {}),
      },
    }
  }

  const radarScale = {
    r: {
      beginAtZero: true,
      min: 0,
      max: 1,
      ticks: {
        display: false,
        backdropColor: 'transparent',
      },
      pointLabels: {
        color: 'rgba(246, 232, 234, 0.85)',
        font: { size: 11 },
      },
      grid: { color: 'rgba(246, 232, 234, 0.12)' },
      angleLines: { color: 'rgba(246, 232, 234, 0.12)' },
      ...((extraScales.r as object) ?? {}),
    },
  }

  return {
    ...baseOptions,
    ...extra,
    layout: {
      padding: { bottom: 4 },
      ...((extra.layout as object) ?? {}),
    },
    plugins: {
      ...baseOptions.plugins,
      ...extraPlugins,
      legend: {
        ...((baseOptions.plugins.legend as object) ?? {}),
        ...((extraPlugins.legend as object) ?? {}),
        ...(isRadar ? { display: false } : {}),
      },
      tooltip: {
        ...((baseOptions.plugins.tooltip as object) ?? {}),
        ...((extraPlugins.tooltip as object) ?? {}),
      },
    },
    scales: hideScales
      ? {}
      : isRadar
        ? radarScale
        : {
            x: mergeScale('x'),
            y: mergeScale('y'),
          },
  }
})

async function remountChart(force = false): Promise<void> {
  const key = chartKey.value
  if (!force && showChart.value && lastMountedKey === key) {
    return
  }

  showChart.value = false
  await nextTick()
  if (mounted.value && hasDrawableData.value) {
    lastMountedKey = key
    showChart.value = true
  } else {
    lastMountedKey = null
  }
}

onMounted(async () => {
  mounted.value = true
  await remountChart(true)
})

onBeforeUnmount(() => {
  mounted.value = false
  showChart.value = false
  lastMountedKey = null
})

watch(chartKey, (next, prev) => {
  if (next !== prev) {
    void remountChart()
  }
})
</script>

<template>
  <div class="nexus-chart" :style="{ height }">
    <Chart
      v-if="showChart && hasDrawableData"
      :key="chartKey"
      :type="type"
      :data="data"
      :options="mergedOptions"
      class="chart"
    />
  </div>
</template>

<style scoped>
.nexus-chart {
  position: relative;
  width: 100%;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
