<script setup lang="ts" generic="T extends string | number">
/** Segmented control: a row of pills where exactly one is selected. */
defineProps<{
  options: { value: T; label: string }[]
  label?: string
  size?: 'sm' | 'md'
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="nx-pills" :class="`size-${size ?? 'md'}`" role="radiogroup" :aria-label="label">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      :class="{ on: model === opt.value }"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.nx-pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--tint);
}

button {
  border: 0;
  background: transparent;
  color: var(--ink-2);
  font: inherit;
  font-weight: 500;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.size-md button {
  padding: 7px 14px;
  font-size: 13px;
}

.size-sm button {
  padding: 5px 11px;
  font-size: 12px;
}

button:hover {
  color: var(--ink);
}

button.on {
  background: var(--ink);
  color: var(--amb);
}
</style>
