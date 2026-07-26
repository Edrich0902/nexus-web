<script setup lang="ts">
import { computed } from 'vue'

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

/** PrimeVue Rating has no half-stars — use 10 stars mapped to 0.5–5.0. */
const starsValue = computed({
  get: () => {
    if (props.modelValue == null) return 0
    return Math.round(props.modelValue * 2)
  },
  set: (raw: number) => {
    if (raw <= 0) {
      emit('update:modelValue', null)
      return
    }
    emit('update:modelValue', Math.min(5, raw / 2))
  },
})

const label = computed(() =>
  props.modelValue != null ? props.modelValue.toFixed(1) : '—',
)
</script>

<template>
  <div class="nexus-rating" :class="{ readonly }">
    <Rating
      v-model="starsValue"
      :stars="10"
      :readonly="readonly"
      :cancel="!readonly"
    />
    <span class="score">{{ label }}</span>
  </div>
</template>

<style scoped>
.nexus-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.score {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  min-width: 1.75rem;
}

.nexus-rating :deep(.p-rating) {
  gap: 0.1rem;
}

.nexus-rating :deep(.p-rating-icon) {
  font-size: 0.75rem;
  color: var(--wine-accent, #c45c6a);
}
</style>
