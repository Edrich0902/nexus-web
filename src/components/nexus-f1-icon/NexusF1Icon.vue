<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 18 },
)

/** Simplified racing helmet / F1 mark */
const PATH =
  'M12 2C7 2 3 5.5 3 10.5C3 14 5 16.5 7.5 18.5L8 22H10L10.5 19H13.5L14 22H16L16.5 18.5C19 16.5 21 14 21 10.5C21 5.5 17 2 12 2M8.5 11.5C7.7 11.5 7 10.8 7 10S7.7 8.5 8.5 8.5 10 9.2 10 10 9.3 11.5 8.5 11.5M15.5 11.5C14.7 11.5 14 10.8 14 10S14.7 8.5 15.5 8.5 17 9.2 17 10 16.3 11.5 15.5 11.5Z'
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    class="nexus-f1-icon"
  >
    <path :d="PATH" />
  </svg>
</template>

<style scoped>
.nexus-f1-icon {
  color: var(--sport-f1);
}
</style>
