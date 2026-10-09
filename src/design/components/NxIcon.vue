<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from '../icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    strokeWidth?: number
    label?: string
  }>(),
  { size: 18, strokeWidth: 1.75, label: undefined },
)

const component = computed(() => icons[props.name])
</script>

<template>
  <component
    :is="component"
    :size="size"
    :stroke-width="strokeWidth"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
    class="nx-icon"
  />
</template>

<style scoped>
.nx-icon {
  flex-shrink: 0;
}
</style>
