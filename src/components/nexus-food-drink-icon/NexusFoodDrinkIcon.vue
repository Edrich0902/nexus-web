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
      d="M4 4h7v16H6a2 2 0 0 1-2-2V4zm9 0h7v14a2 2 0 0 1-2 2h-5V4zm2 3v2h3V7h-3zm0 4v2h3v-2h-3zM6 7v2h3V7H6zm0 4v2h3v-2H6z"
    />
  </svg>
</template>
