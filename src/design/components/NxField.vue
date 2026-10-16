<script setup lang="ts">
import { computed, inject } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NxPips from './NxPips.vue'
import { BENTO_COLS, responsiveSpans } from './bento'
import { inkFor } from '../color'

/**
 * A colour field: a solid, saturated block with a small label row and an
 * oversized value. Place inside NxBento; `span` / `rows` size it by importance.
 * Pass `contentKey` to flip/fade when the slide changes.
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
    /** Cover / label art for media slides. */
    imageUrl?: string | null
    /** When this changes, the body flips to the new slide. */
    contentKey?: string | number | null
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
    imageUrl: null,
    contentKey: null,
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

const isStat = computed(() => {
  const v = String(props.value ?? '').trim()
  if (!v) return false
  if (v.length <= 5) return true
  return /^[\d#.,\s/%+\-−kdKmMbB]+$/.test(v)
})

const flipKey = computed(() => props.contentKey ?? `${props.label}|${props.value}|${props.sub}|${props.imageUrl}`)

/** Full-bleed band in the masonry columns (listening / hero tiles). */
const wide = computed(() => props.span / cols >= 0.4 || props.rows >= 2)
</script>

<template>
  <component
    :is="tag"
    :to="to"
    class="nx-field"
    :class="[`v-${variant}`, { link: Boolean(to), media: Boolean(imageUrl), wide }]"
    :style="style"
  >
    <Transition name="nx-field-flip" mode="out-in">
      <div :key="String(flipKey)" class="slide" :class="{ 'has-media': Boolean(imageUrl) }">
        <div v-if="label || aside || $slots.label" class="lab">
          <span><slot name="label">{{ label }}</slot></span>
          <span v-if="aside || $slots.aside" class="aside"><slot name="aside">{{ aside }}</slot></span>
        </div>
        <slot>
          <template v-if="imageUrl">
            <div class="cover">
              <NexusImage :src="imageUrl" alt="" size="fill" fit="contain" variant="hero" />
            </div>
            <div v-if="value !== undefined && value !== null && value !== ''" class="big num title">{{ value }}</div>
          </template>
          <div v-else-if="value !== undefined && value !== null && value !== ''" class="value-row">
            <div class="big num" :class="{ title: !isStat }">{{ value }}</div>
          </div>
        </slot>
        <div v-if="sub || $slots.sub" class="sub"><slot name="sub">{{ sub }}</slot></div>
        <NxPips v-if="pips" class="pips" :value="pips.value" :max="pips.max ?? 5" :label="label" />
        <div v-if="progress !== null && progress !== undefined" class="pb">
          <i :style="{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }" />
        </div>
      </div>
    </Transition>
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
  min-height: 120px;
  background: var(--surface-2);
  color: var(--ink);
  transition: transform 0.35s var(--ease);
}

.nx-field.media {
  min-height: 0;
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

.slide {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  transform-origin: center center;
  transform-style: preserve-3d;
}

.slide.has-media {
  flex: 0 1 auto;
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
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: auto;
  padding-top: 8px;
  min-width: 0;
}

.cover {
  margin-top: 10px;
  width: 100%;
  border-radius: var(--r-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.12);
}

.cover :deep(.nexus-image) {
  width: 100%;
  height: auto;
}

.cover :deep(img),
.cover :deep(picture) {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.big {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--vsize);
  letter-spacing: -0.045em;
  line-height: 0.95;
  min-width: 0;
  flex: 1;
}

.big.title {
  font-size: clamp(1.25rem, var(--vsize), 1.75rem);
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.has-media .big.title {
  flex: none;
  margin-top: 10px;
}

.sub {
  font-size: 13px;
  opacity: 0.78;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.nx-field-flip-leave-active {
  transition:
    opacity 0.56s cubic-bezier(0.55, 0.06, 0.68, 0.19),
    transform 0.56s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.nx-field-flip-enter-active {
  transition:
    opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.72s cubic-bezier(0.16, 1, 0.3, 1);
}

.nx-field-flip-enter-from {
  opacity: 0;
  transform: perspective(720px) rotateX(-32deg) translateY(36px) scale(1.14);
}

.nx-field-flip-leave-to {
  opacity: 0;
  transform: perspective(720px) rotateX(40deg) translateY(-22px) scale(0.84);
}

@media (prefers-reduced-motion: reduce) {
  .nx-field-flip-enter-active,
  .nx-field-flip-leave-active {
    transition: opacity 0.2s linear;
  }

  .nx-field-flip-enter-from,
  .nx-field-flip-leave-to {
    transform: none;
  }
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
  }

  .big:not(.title) {
    font-size: min(var(--vsize), 44px);
  }
}
</style>
