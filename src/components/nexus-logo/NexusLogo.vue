<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 24 },
)

/** Masks are document-scoped, so each instance needs its own id. */
const maskId = `nexus-logo-junction-${useId()}`
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    :width="size"
    :height="size"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <mask
      :id="maskId"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="64"
      height="64"
    >
      <rect width="64" height="64" fill="#fff" />
      <path d="M32 21.5 42.5 32 32 42.5 21.5 32Z" fill="#000" />
    </mask>
    <path
      d="M14 49V15l36 34V15"
      stroke="currentColor"
      stroke-width="9"
      stroke-linecap="round"
      stroke-linejoin="round"
      :mask="`url(#${maskId})`"
    />
    <path d="M32 25.5 38.5 32 32 38.5 25.5 32Z" fill="currentColor" />
  </svg>
</template>
