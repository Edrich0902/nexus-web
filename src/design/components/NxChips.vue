<script setup lang="ts">
/** Inline tags: aromas, categories, cuisines. */
withDefaults(
  defineProps<{
    items: string[]
    label?: string
    tone?: 'tint' | 'accent'
  }>(),
  { label: undefined, tone: 'tint' },
)
</script>

<template>
  <ul v-if="items.length" class="nx-chips" :class="`t-${tone}`" :aria-label="label">
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
</template>

<style scoped>
.nx-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  line-height: 1.2;
  background: var(--tint);
  color: var(--ink-2);
}

.t-accent li {
  background: color-mix(in srgb, var(--acc) 16%, transparent);
  color: var(--ink);
}
</style>
