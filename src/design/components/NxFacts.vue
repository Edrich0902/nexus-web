<script setup lang="ts">
/** Label / value pairs (producer, region, vintage…) in a responsive grid. */
withDefaults(
  defineProps<{
    items: { label: string; value: string | number | null | undefined }[]
    cols?: number
  }>(),
  { cols: 3 },
)
</script>

<template>
  <dl class="nx-facts" :style="{ '--cols': cols }">
    <template v-for="f in items" :key="f.label">
      <div v-if="f.value !== null && f.value !== undefined && f.value !== ''" class="f">
        <dt class="nx-label">{{ f.label }}</dt>
        <dd>{{ f.value }}</dd>
      </div>
    </template>
  </dl>
</template>

<style scoped>
.nx-facts {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 18px 24px;
  margin: 0;
}

dt {
  margin-bottom: 4px;
}

dd {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .nx-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
