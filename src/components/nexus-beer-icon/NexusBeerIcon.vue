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
      d="M7 2h10v2.2l-1.4 1.4C17.3 7.1 18 9 18 11c0 2.8-1.8 5.2-4.3 6.1V20H16v2H8v-2h2.3v-2.9C7.8 16.2 6 13.8 6 11c0-2 .7-3.9 2.4-5.4L7 4.2V2zm5 4c-2.2 0-4 2-4 5 0 2.2 1.6 4 3.7 4.4h.6C13.4 15 15 13.2 15 11c0-3-1.8-5-4-5z"
    />
  </svg>
</template>
