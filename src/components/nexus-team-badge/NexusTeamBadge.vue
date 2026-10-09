<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    label?: string | null
    /** Rendered size in px. */
    size?: number
  }>(),
  { src: null, label: null, size: 28 },
)

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)

const image = computed(() => {
  if (!props.src || failed.value) return null
  const base = props.src.replace(/\/(tiny|small|medium)\/?$/, '')
  return `${base}/${props.size > 48 ? 'small' : 'tiny'}`
})

const initials = computed(() =>
  (props.label ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join(''),
)
</script>

<template>
  <span class="badge" :style="{ '--s': `${size}px` }" aria-hidden="true">
    <img v-if="image" :src="image" alt="" loading="lazy" @error="failed = true" />
    <span v-else class="initials">{{ initials }}</span>
  </span>
</template>

<style scoped>
.badge {
  width: var(--s);
  height: var(--s);
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
}

img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.initials {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--tint-2);
  color: var(--ink-2);
  font-size: calc(var(--s) * 0.36);
  font-weight: 600;
}
</style>
