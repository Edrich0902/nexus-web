<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 18 },
)
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
  >
    <path
      d="M6 2h9a1 1 0 0 1 1 1v2h1.5A2.5 2.5 0 0 1 20 7.5V14a3 3 0 0 1-3 3h-1v3h2v2H6v-2h2v-3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm9 5V4H7a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9h1.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H15z"
    />
  </svg>
</template>
