<script setup lang="ts">
import { computed } from 'vue'

/**
 * Compact 24-bar (or any length) distribution, e.g. listening by hour.
 * The peak bar is drawn in the accent colour.
 */
const props = withDefaults(
  defineProps<{
    values: number[]
    /** Labels under the axis, e.g. ['00', '06', '12', '18', '23']. */
    ticks?: string[]
    height?: number
    label?: string
  }>(),
  { ticks: () => [], height: 120, label: 'Distribution' },
)

const max = computed(() => Math.max(1, ...props.values))
const peak = computed(() => props.values.indexOf(Math.max(...props.values)))
</script>

<template>
  <figure class="nx-hours" :aria-label="label">
    <div class="bars" :style="{ height: `${height}px` }">
      <i
        v-for="(v, i) in values"
        :key="i"
        :class="{ pk: i === peak && v > 0 }"
        :style="{ height: `${Math.max(3, (v / max) * 100)}%` }"
        :title="String(v)"
      />
    </div>
    <figcaption v-if="ticks.length" class="ax" :class="{ aligned: ticks.length === values.length }">
      <span v-for="t in ticks" :key="t">{{ t }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.nx-hours {
  margin: 0;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.bars i {
  flex: 1;
  background: var(--tint-2);
  border-radius: 3px 3px 0 0;
  transition: height 0.5s var(--ease);
}

.bars i.pk {
  background: var(--acc);
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
</style>
