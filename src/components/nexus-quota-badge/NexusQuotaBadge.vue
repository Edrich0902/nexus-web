<script setup lang="ts">
import type { WineApiQuota } from '@/types/food-drink/cellar'

defineProps<{
  quota: WineApiQuota | null
}>()
</script>

<template>
  <div v-if="quota" class="quota-badge" title="WineAPI daily request budget">
    <i class="pi pi-cloud" />
    <span>
      {{ quota.used }}/{{ quota.daily_limit }}
      <small>API</small>
    </span>
    <Tag
      v-if="quota.search_remaining === 0"
      value="Search reserved"
      severity="warn"
      rounded
    />
  </div>
</template>

<style scoped>
.quota-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--wine-accent) 18%, transparent);
  color: var(--lavender-blush);
  font-size: 0.8rem;
}

.quota-badge small {
  opacity: 0.65;
  margin-left: 0.15rem;
}
</style>
