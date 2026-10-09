<script setup lang="ts">
import { computed } from 'vue'

/** A small taste fingerprint: one spoke per axis, values 0–1. */
const props = withDefaults(defineProps<{ values: number[]; size?: number }>(), { size: 92 })

const C = 46
const R = 38

function point(i: number, v: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / props.values.length
  return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v]
}

function polygon(scale: (i: number) => number): string {
  return props.values.map((_, i) => point(i, scale(i)).map((n) => n.toFixed(1)).join(',')).join(' ')
}

const rings = computed(() => [0.33, 0.66, 1].map((s) => polygon(() => s)))
const spokes = computed(() => props.values.map((_, i) => point(i, 1)))
const shape = computed(() => polygon((i) => Math.max(0.08, props.values[i] ?? 0)))
</script>

<template>
  <svg class="nx-radar" viewBox="0 0 92 92" :width="size" :height="size" aria-hidden="true">
    <polygon v-for="(r, i) in rings" :key="i" class="ring" :points="r" />
    <line v-for="([x, y], i) in spokes" :key="`s${i}`" :x1="C" :y1="C" :x2="x" :y2="y" />
    <polygon class="shape" :points="shape" />
  </svg>
</template>

<style scoped>
.nx-radar {
  display: block;
  flex-shrink: 0;
}

.ring {
  fill: none;
  stroke: var(--line-strong, var(--line));
  stroke-width: 1;
}

line {
  stroke: var(--line);
}

.shape {
  fill: color-mix(in srgb, var(--acc) 32%, transparent);
  stroke: var(--acc);
  stroke-width: 1.5;
  stroke-linejoin: round;
  transition: all 0.4s var(--ease);
}
</style>
