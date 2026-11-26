<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * Compact 24-bar (or any length) distribution, e.g. listening by hour.
 * The peak bar is drawn in the accent colour; hovering or tapping any bar
 * highlights it and displays its detail readout.
 */
const props = withDefaults(
  defineProps<{
    values: number[]
    /** Labels under the axis, e.g. ['00', '06', '12', '18', '23']. */
    ticks?: string[]
    /** Per-bar readout strings shown on hover/tap (defaults to peak when idle). */
    details?: string[]
    /** Show compact numeric labels above non-zero bars (ideal for <= 7 bars). */
    showValues?: boolean
    /** Optional suffix for compact bar labels (e.g. 'm'). */
    valueSuffix?: string
    height?: number
    label?: string
  }>(),
  { ticks: () => [], details: () => [], showValues: false, valueSuffix: '', height: 120, label: 'Distribution' },
)

const hovered = ref<number | null>(null)
const selected = ref<number | null>(null)

const max = computed(() => Math.max(1, ...props.values))
const peak = computed(() => {
  const top = Math.max(...props.values)
  return top > 0 ? props.values.indexOf(top) : -1
})

const active = computed(() => hovered.value ?? selected.value ?? (peak.value >= 0 ? peak.value : null))

const activeReadout = computed(() => {
  const idx = active.value
  if (idx === null) return null
  if (props.details[idx]) return props.details[idx]
  const tick = props.ticks.length === props.values.length ? props.ticks[idx] : undefined
  const val = props.values[idx] ?? 0
  return tick ? `${tick}: ${val}${props.valueSuffix}` : `${val}${props.valueSuffix}`
})
</script>

<template>
  <figure class="nx-hours" :aria-label="label">
    <div v-if="activeReadout" class="readout" aria-live="polite">
      {{ activeReadout }}
    </div>
    <div class="bars" :style="{ height: `${height}px` }">
      <button
        v-for="(v, i) in values"
        :key="i"
        type="button"
        class="bar-hit"
        :aria-label="details[i] ?? String(v)"
        :aria-pressed="selected === i"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
        @focus="hovered = i"
        @blur="hovered = null"
        @click="selected = selected === i ? null : i"
      >
        <span v-if="showValues && v > 0" class="val">{{ v }}{{ valueSuffix }}</span>
        <i
          :class="{
            pk: i === peak && v > 0,
            act: active === i && v > 0,
            dim: active !== null && active !== i,
          }"
          :style="{ height: `${Math.max(3, (v / max) * 100)}%` }"
        />
      </button>
    </div>
    <figcaption v-if="ticks.length" class="ax" :class="{ aligned: ticks.length === values.length }">
      <span v-for="(t, i) in ticks" :key="i" :class="{ lit: active === i }">{{ t }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.nx-hours {
  margin: 0;
}

.readout {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
  margin-bottom: 10px;
  min-height: 18px;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.bar-hit {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  outline: none;
}

.val {
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
  color: var(--ink-3);
  text-align: center;
  white-space: nowrap;
}

.bar-hit i {
  display: block;
  width: 100%;
  background: var(--tint-2);
  border-radius: 3px 3px 0 0;
  transition: height 0.5s var(--ease), opacity 0.2s var(--ease), background 0.2s var(--ease);
}

.bar-hit i.pk,
.bar-hit i.act {
  background: var(--acc);
}

.bar-hit i.dim {
  opacity: 0.45;
}

.ax {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 8px;
}

.ax.aligned {
  gap: 4px;
}

.ax.aligned span {
  flex: 1;
  min-width: 0;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ax span.lit {
  color: var(--ink);
}
</style>
