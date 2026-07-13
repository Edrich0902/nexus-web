<script setup lang="ts">
import { computed } from 'vue'
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

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
      },
      tooltip: {
        ...((baseOptions.plugins.tooltip as object) ?? {}),
        ...((extraPlugins.tooltip as object) ?? {}),
      },
    },
    scales: hideScales
      ? {}
      : {
          x: mergeScale('x'),
          y: mergeScale('y'),
        },
  }
})
</script>

<template>
  <div class="nexus-chart" :style="{ height }">
    <Chart :type="type" :data="data" :options="mergedOptions" class="chart" />
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
