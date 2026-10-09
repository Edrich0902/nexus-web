<script setup lang="ts">
import { computed } from 'vue'

/**
 * A window on a scale with a "now" marker, e.g. a wine's drinking window
 * (from / peak / to against the current year).
 */
const props = withDefaults(
  defineProps<{
    min: number
    max: number
    from: number
    to: number
    now?: number | null
    peak?: number | null
    /** Labels under the bar (defaults to from / peak / to). */
    labels?: string[]
    label?: string
  }>(),
  { now: null, peak: null, labels: undefined, label: 'Range' },
)

const pct = (v: number) => {
  const span = props.max - props.min || 1
  return Math.max(0, Math.min(100, ((v - props.min) / span) * 100))
}

const left = computed(() => pct(props.from))
const width = computed(() => Math.max(1, pct(props.to) - pct(props.from)))
const nowLeft = computed(() => (props.now === null ? null : pct(props.now)))
const peakLeft = computed(() => (props.peak === null ? null : pct(props.peak)))
const axis = computed(
  () =>
    props.labels ??
    [String(props.from), props.peak !== null ? `peak ${props.peak}` : '', String(props.to)].filter(Boolean),
)
</script>

<template>
  <div class="nx-range" role="img" :aria-label="`${label}: ${from} to ${to}${now !== null ? `, now ${now}` : ''}`">
    <div class="rail">
      <div class="fill" :style="{ left: `${left}%`, width: `${width}%` }" />
      <div v-if="peakLeft !== null" class="peak" :style="{ left: `${peakLeft}%` }" />
      <div v-if="nowLeft !== null" class="now" :style="{ left: `${nowLeft}%` }"><span>now</span></div>
    </div>
    <div class="ax">
      <span v-for="l in axis" :key="l">{{ l }}</span>
    </div>
  </div>
</template>

<style scoped>
.nx-range {
  padding-top: 18px;
}

.rail {
  position: relative;
  height: 10px;
  border-radius: 10px;
  background: var(--tint);
}

.fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 10px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--acc) 45%, transparent), var(--acc));
}

.peak {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 16px;
  background: var(--ink-2);
  transform: translateX(-1px);
}

.now {
  position: absolute;
  top: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--ink);
  border: 4px solid var(--amb);
  transform: translateX(-10px);
}

.now span {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
}

.ax {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-3);
  margin-top: 10px;
}
</style>
