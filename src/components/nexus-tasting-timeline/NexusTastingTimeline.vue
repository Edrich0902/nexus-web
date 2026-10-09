<script setup lang="ts">
import NxStream from '@design/components/NxStream.vue'
import NxStreamItem from '@design/components/NxStreamItem.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import type { CellarWineTasting } from '@/types/food-drink/cellar'

defineProps<{
  tastings: CellarWineTasting[]
}>()

const emit = defineEmits<{
  remove: [tastingId: number]
}>()

function shortDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: '2-digit' }),
  })
}

function chips(t: CellarWineTasting): string[] {
  return t.rating != null ? [`★ ${t.rating.toFixed(1)}`] : []
}
</script>

<template>
  <NxEmptyState
    v-if="!tastings.length"
    title="No tastings yet"
    body="Log each time you open a bottle — the date, who you shared it with and how it showed."
  />
  <NxStream v-else>
    <NxStreamItem
      v-for="t in tastings"
      :key="t.id"
      :time="shortDate(t.tasted_on)"
      kind="Tasting"
      :meta="t.location ?? undefined"
      :title="t.occasion || 'Opened a bottle'"
      :body="t.notes ?? undefined"
      :chips="chips(t)"
    >
      <NxIconButton
        class="remove"
        icon="trash"
        label="Delete tasting"
        size="sm"
        @click="emit('remove', t.id)"
      />
    </NxStreamItem>
  </NxStream>
</template>

<style scoped>
.remove {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

:deep(.card) {
  position: relative;
}

:deep(.card:hover) .remove,
.remove:focus-visible {
  opacity: 1;
}

@media (hover: none) {
  .remove {
    opacity: 1;
  }
}
</style>
