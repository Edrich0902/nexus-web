<script setup lang="ts">
import { computed } from 'vue'
import NxIcon from './NxIcon.vue'
import type { IconName } from '../icons'

const props = withDefaults(
  defineProps<{
    icon: IconName
    /** Accessible name; also shown as a tooltip unless `tooltip` is false. */
    label: string
    variant?: 'ghost' | 'tint' | 'accent' | 'ink'
    size?: 'sm' | 'md' | 'lg'
    active?: boolean
    disabled?: boolean
    tooltip?: false | 'top' | 'bottom'
  }>(),
  { variant: 'ghost', size: 'md', active: false, disabled: false, tooltip: 'top' },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const ICON_SIZE = { sm: 16, md: 18, lg: 20 } as const

const tip = computed(() => (props.tooltip ? props.label : undefined))

const attrs = computed(() => ({
  type: 'button' as const,
  class: ['nx-icon-btn', `v-${props.variant}`, `s-${props.size}`, { on: props.active }],
  'aria-label': props.label,
  'aria-pressed': props.active || undefined,
  disabled: props.disabled,
}))
</script>

<template>
  <button v-if="tooltip === 'bottom'" v-tooltip.bottom="tip" v-bind="attrs" @click="emit('click', $event)">
    <NxIcon :name="icon" :size="ICON_SIZE[size]" />
    <slot />
  </button>
  <button v-else v-tooltip.top="tip" v-bind="attrs" @click="emit('click', $event)">
    <NxIcon :name="icon" :size="ICON_SIZE[size]" />
    <slot />
  </button>
</template>

<style scoped>
.nx-icon-btn {
  position: relative;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s,
    transform 0.2s var(--ease);
}

.nx-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nx-icon-btn:not(:disabled):hover {
  background: var(--tint-2);
  color: var(--ink);
}

.nx-icon-btn:not(:disabled):active {
  transform: scale(0.94);
}

.s-sm {
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
}

.s-md {
  width: 40px;
  height: 40px;
}

.s-lg {
  width: 48px;
  height: 48px;
  border-radius: 999px;
}

.v-tint {
  background: var(--tint);
  color: var(--ink-2);
}

.v-accent {
  background: var(--acc);
  color: var(--acc-ink);
  border-radius: 999px;
}

.v-accent:not(:disabled):hover {
  background: color-mix(in srgb, var(--acc) 85%, var(--ink));
  color: var(--acc-ink);
}

.v-ink {
  background: var(--ink);
  color: var(--amb);
  border-radius: 999px;
}

.v-ink:not(:disabled):hover {
  background: color-mix(in srgb, var(--ink) 88%, var(--amb));
  color: var(--amb);
}

.on {
  background: var(--ink);
  color: var(--amb);
}

.on:not(:disabled):hover {
  background: var(--ink);
  color: var(--amb);
}
</style>
