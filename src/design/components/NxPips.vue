<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    max?: number
    label?: string
  }>(),
  { max: 5, label: undefined },
)
</script>

<template>
  <span
    class="nx-pips"
    role="meter"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
  >
    <i v-for="n in max" :key="n" :class="{ on: n <= Math.round(value) }" />
  </span>
</template>

<style scoped>
.nx-pips {
  display: flex;
  gap: 4px;
}

.nx-pips i {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: currentColor;
  opacity: 0.18;
}

.nx-pips i.on {
  opacity: 1;
}
</style>
