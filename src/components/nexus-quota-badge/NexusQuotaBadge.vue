<script setup lang="ts">
import type { AnalysisQuota } from '@/types/analysis/drink-analysis'

defineProps<{
  quota: AnalysisQuota | null
}>()
</script>

<template>
  <div
    v-if="quota"
    class="quota-badge"
    :title="quota.any_available ? 'Gemini model pool available' : 'All models exhausted'"
  >
    <i class="pi pi-sparkles" aria-hidden="true" />
    <span v-if="quota.any_available">AI ready</span>
    <span v-else>AI limited</span>
    <small>
      {{ quota.models.filter((m) => m.available).length }}/{{ quota.models.length }} models
    </small>
  </div>
</template>

<style scoped>
.quota-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--lavender-blush, #c8b8d8) 18%, transparent);
  color: var(--text-color, inherit);
  font-size: 0.8rem;
  white-space: nowrap;
}

.quota-badge small {
  opacity: 0.7;
}
</style>
