<script setup lang="ts">
import { computed } from 'vue'
import NxIcon from '@design/components/NxIcon.vue'
import type { AnalysisQuota } from '@/types/analysis/drink-analysis'

const props = defineProps<{
  quota: AnalysisQuota | null
}>()

const available = computed(() => props.quota?.models.filter((m) => m.available).length ?? 0)
</script>

<template>
  <div
    v-if="quota"
    class="quota-badge"
    :class="{ limited: !quota.any_available }"
    :title="quota.any_available ? 'AI analysis is available' : 'All AI models are rate-limited right now'"
  >
    <NxIcon name="sparkles" :size="14" />
    <span>{{ quota.any_available ? 'AI ready' : 'AI limited' }}</span>
    <small class="num">{{ available }}/{{ quota.models.length }}</small>
  </div>
</template>

<style scoped>
.quota-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--tint);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.quota-badge :deep(svg) {
  color: var(--acc);
}

.limited :deep(svg) {
  color: var(--ink-4);
}

small {
  color: var(--ink-4);
  font-size: 12px;
}
</style>
