<script setup lang="ts">
import { computed, inject } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import NxPips from './NxPips.vue'
import { BENTO_COLS, responsiveSpans } from './bento'
import { inkFor } from '../color'

/**
 * A colour field: a solid, saturated block with a small label row and an
 * oversized value. Place inside NxBento; `span` / `rows` size it by importance.
 */
const props = withDefaults(
  defineProps<{
    /** Field colour (hex). Text colour is derived unless `ink` is given. */
    bg?: string
    ink?: string
    variant?: 'solid' | 'tint' | 'outline'
    label?: string
    aside?: string
    value?: string | number
    /** Value font size in px (desktop). */
    valueSize?: number
    sub?: string
    span?: number
    rows?: number
    to?: RouteLocationRaw
    pips?: { value: number; max?: number } | null
    /** 0–1 progress rail at the bottom. */
    progress?: number | null
  }>(),
  {
    bg: undefined,
    ink: undefined,
    variant: 'solid',
    label: undefined,
    aside: undefined,
    value: undefined,
    valueSize: 52,
    sub: undefined,
    span: 3,
    rows: 1,
    to: undefined,
    pips: null,
    progress: null,
  },
)

const cols = inject(BENTO_COLS, 12)

const style = computed(() => {
  const spans = responsiveSpans(props.span, cols)
  const base: Record<string, string | number> = {
    '--span': Math.min(props.span, cols),
    '--span-md': spans.md,
    '--span-sm': spans.sm,
    '--rows': props.rows,
    '--vsize': `${props.valueSize}px`,
  }
  if (props.variant === 'solid' && props.bg) {
    base.background = props.bg
    base.color = props.ink ?? inkFor(props.bg)
  } else if (props.variant === 'tint' && props.bg) {
    base.background = `color-mix(in srgb, ${props.bg} 18%, transparent)`
    base['--field-accent'] = props.bg
  }
  return base
})

const tag = computed(() => (props.to ? 'RouterLink' : 'div'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    class="nx-field"
    :class="[`v-${variant}`, { link: Boolean(to) }]"
    :style="style"
  >
    <div v-if="label || aside || $slots.label" class="lab">
      <span><slot name="label">{{ label }}</slot></span>
      <span v-if="aside || $slots.aside" class="aside"><slot name="aside">{{ aside }}</slot></span>
    </div>
    <slot>
      <div v-if="value !== undefined && value !== null && value !== ''" class="big num">{{ value }}</div>
    </slot>
    <div v-if="sub || $slots.sub" class="sub"><slot name="sub">{{ sub }}</slot></div>
    <NxPips v-if="pips" class="pips" :value="pips.value" :max="pips.max ?? 5" :label="label" />
    <div v-if="progress !== null && progress !== undefined" class="pb">
      <i :style="{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }" />
    </div>
  </component>
</template>

<style scoped>
.nx-field {
  grid-column: span var(--span);
  grid-row: span var(--rows);
  border-radius: var(--r-xl);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 0;
  background: var(--surface-2);
  color: var(--ink);
  transition: transform 0.35s var(--ease);
}

.nx-field.link {
  cursor: pointer;
}

.nx-field.link:hover {
  transform: scale(0.985);
}

.v-outline {
  background: transparent;
  border: 1px dashed var(--line-strong);
}

.v-tint .big {
  color: var(--field-accent, var(--ink));
}

.lab {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.72;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.lab > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aside {
  flex-shrink: 0;
}

.big {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--vsize);
  letter-spacing: -0.045em;
  line-height: 0.9;
  margin-top: auto;
  padding-top: 8px;
  overflow-wrap: anywhere;
}

.sub {
  font-size: 13px;
  opacity: 0.78;
  margin-top: 6px;
}

.pips {
  margin-top: 12px;
}

.pb {
  height: 5px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.15);
  margin-top: 12px;
  overflow: hidden;
}

.pb i {
  display: block;
  height: 100%;
  background: currentColor;
}

@media (max-width: 960px) {
  .nx-field {
    grid-column: span var(--span-md);
  }
}

@media (max-width: 640px) {
  .nx-field {
    grid-column: span var(--span-sm);
    grid-row: span 1;
    padding: 14px 16px;
    min-height: 120px;
  }

  .big {
    font-size: min(var(--vsize), 44px);
  }
}
</style>
