<script setup lang="ts">
import { computed, ref } from 'vue'
import NxIcon from '@design/components/NxIcon.vue'

/** Five stars in half steps (0.5–5.0). Click the left half of a star for a half. */
const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    readonly?: boolean
    size?: 'small' | 'large'
  }>(),
  {
    modelValue: null,
    readonly: false,
    size: 'small',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const hover = ref<number | null>(null)
const shown = computed(() => hover.value ?? props.modelValue ?? 0)
const iconSize = computed(() => (props.size === 'large' ? 28 : 20))

function fill(index: number): number {
  return Math.max(0, Math.min(1, shown.value - index)) * 100
}

function valueAt(index: number, event: PointerEvent | MouseEvent): number {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return index + (event.clientX - rect.left < rect.width / 2 ? 0.5 : 1)
}

function set(value: number | null): void {
  if (props.readonly) return
  emit('update:modelValue', value == null || value <= 0 ? null : Math.min(5, Math.round(value * 2) / 2))
}

function onKey(event: KeyboardEvent): void {
  if (props.readonly) return
  const current = props.modelValue ?? 0
  const map: Record<string, number | null> = {
    ArrowRight: current + 0.5,
    ArrowUp: current + 0.5,
    ArrowLeft: current - 0.5,
    ArrowDown: current - 0.5,
    Home: null,
    End: 5,
    Delete: null,
    Backspace: null,
  }
  if (!(event.key in map)) return
  event.preventDefault()
  set(map[event.key] ?? null)
}
</script>

<template>
  <div class="rating" :class="[`s-${size}`, { readonly }]">
    <div
      class="stars"
      role="slider"
      :tabindex="readonly ? -1 : 0"
      aria-label="Rating"
      aria-valuemin="0"
      aria-valuemax="5"
      :aria-valuenow="modelValue ?? 0"
      :aria-valuetext="modelValue != null ? `${modelValue.toFixed(1)} out of 5` : 'Not rated'"
      :aria-readonly="readonly || undefined"
      @keydown="onKey"
      @pointerleave="hover = null"
    >
      <span
        v-for="i in 5"
        :key="i"
        class="star"
        @pointermove="!readonly && (hover = valueAt(i - 1, $event))"
        @click="set(valueAt(i - 1, $event))"
      >
        <NxIcon name="star" :size="iconSize" class="base" />
        <span class="on" :style="{ width: `${fill(i - 1)}%` }">
          <NxIcon name="star" :size="iconSize" />
        </span>
      </span>
    </div>
    <span class="score">{{ shown ? shown.toFixed(1) : '—' }}</span>
    <button
      v-if="!readonly && modelValue != null"
      type="button"
      class="clear"
      aria-label="Clear rating"
      @click="set(null)"
    >
      <NxIcon name="close" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.stars {
  display: inline-flex;
  gap: 2px;
  border-radius: var(--r-xs);
  cursor: pointer;
}

.readonly .stars {
  cursor: default;
}

.stars:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 3px;
}

.star {
  position: relative;
  display: inline-flex;
  line-height: 0;
}

.base {
  color: var(--ink-4);
}

.on {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  color: var(--acc);
  line-height: 0;
}

.on :deep(svg) {
  fill: currentColor;
}

.score {
  min-width: 2.4ch;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}

.s-large .score {
  font-size: 18px;
}

.clear {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--ink-3);
  background: transparent;
  cursor: pointer;
}

.clear:hover {
  color: var(--ink);
  background: var(--tint);
}
</style>
