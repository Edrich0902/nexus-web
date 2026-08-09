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
    <!-- Whisky tumbler: thick base, glass body -->
    <path
      d="M7 3h10v2.1l-.5 1.2C17.7 7.4 18.5 9 18.5 11v7.5c0 1.4-1.1 2.5-2.5 2.5H8c-1.4 0-2.5-1.1-2.5-2.5V11c0-2 .8-3.6 2-4.7L7 5.1V3zm1.7 5.3C8 9 7.5 10 7.5 11v7.5c0 .3.2.5.5.5h8c.3 0 .5-.2.5-.5V11c0-1-.5-2-1.2-2.7L15 7H9l-.3 1.3zM9 5h6v1.2l-.4.9H9.4L9 6.2V5zm1.5 7h3v1.5h-3V12z"
    />
  </svg>
</template>
