<script setup lang="ts">
export interface MeterItem {
  key: string
  label: string
  /** 0–1. */
  value: number
  /** Overrides the default percentage readout. */
  display?: string
}

/** Labelled thin bars for 0–1 measures (audio character, completion, share). */
withDefaults(defineProps<{ items: MeterItem[]; cols?: 1 | 2 }>(), { cols: 2 })
</script>

<template>
  <div class="nx-meters" :class="`cols-${cols}`">
    <div
      v-for="m in items"
      :key="m.key"
      class="meter"
      role="meter"
      :aria-label="m.label"
      :aria-valuenow="Math.round(m.value * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="lab">
        <span class="name">{{ m.label }}</span>
        <span class="num">{{ m.display ?? Math.round(m.value * 100) }}</span>
      </div>
      <div class="rail"><i :style="{ width: `${Math.max(0, Math.min(1, m.value)) * 100}%` }" /></div>
    </div>
  </div>
</template>

<style scoped>
.nx-meters {
  display: grid;
  gap: 14px 22px;
}

.cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.lab {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.name {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lab .num {
  color: var(--ink-2);
}

.rail {
  height: 4px;
  border-radius: 4px;
  background: var(--tint-2);
  overflow: hidden;
}

.rail i {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--acc);
  transition: width 0.6s var(--ease);
}
</style>
