<script setup lang="ts">
defineProps<{
  /** Renders the page title row with the `toolbar` slot for page actions. */
  showToolbar?: boolean
  title?: string
}>()
</script>

<template>
  <div class="nexus-page">
    <div v-if="showToolbar && (title || $slots.toolbar)" class="nexus-page-head">
      <h1 class="nexus-page-title">{{ title ?? '' }}</h1>
      <div class="nexus-page-actions">
        <slot name="toolbar" />
      </div>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.nexus-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.nexus-page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 0 8px;
}

.nexus-page-title {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1;
  letter-spacing: -0.02em;
  min-width: 0;
  overflow-wrap: anywhere;
}

.nexus-page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
