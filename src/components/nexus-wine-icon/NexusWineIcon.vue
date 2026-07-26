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
      d="M12 2c-.6 0-1 .4-1 1v2.1C7.6 5.6 5 8.5 5 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-3.5-2.6-6.4-6-6.9V3c0-.6-.4-1-1-1zm0 6c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm-1 12h2v2h-2v-2z"
    />
  </svg>
</template>
