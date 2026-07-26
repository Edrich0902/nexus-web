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
      d="M4 3h7a2 2 0 0 1 2 2v14.2a1 1 0 0 1-1.45.89L9 18.4l-2.55 1.69A1 1 0 0 1 5 19.2V5a2 2 0 0 0-2-2h1zm9 0h7a2 2 0 0 1 2 2v14.2a1 1 0 0 1-1.45.89L18 18.4l-2.55 1.69A1 1 0 0 1 14 19.2V5a2 2 0 0 0-2-2h1z"
    />
  </svg>
</template>
