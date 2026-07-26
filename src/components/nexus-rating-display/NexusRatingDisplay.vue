<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    accent?: string
  }>(),
  {
    modelValue: null,
    accent: 'var(--wine-accent, #c45c6a)',
  },
)

const hasRating = computed(() => props.modelValue != null)
const label = computed(() =>
  props.modelValue != null ? props.modelValue.toFixed(1) : '—',
)
</script>

<template>
  <span class="nexus-rating-display" :class="{ empty: !hasRating }">
    <i class="pi" :class="hasRating ? 'pi-star-fill' : 'pi-star'" :style="{ color: accent }" />
    <span class="score">{{ label }}</span>
  </span>
</template>

<style scoped>
.nexus-rating-display {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.nexus-rating-display .pi {
  font-size: 0.9rem;
}

.score {
  font-weight: 600;
  color: color-mix(in srgb, var(--lavender-blush) 80%, transparent);
}

.nexus-rating-display.empty .score {
  font-weight: 400;
  opacity: 0.6;
}
</style>
