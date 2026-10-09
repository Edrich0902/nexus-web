<script setup lang="ts">
withDefaults(defineProps<{ label: string; future?: boolean }>(), { future: false })
</script>

<template>
  <div class="nx-stream-group" :class="{ future }">
    <div class="grp">{{ label }}</div>
    <slot />
  </div>
</template>

<style scoped>
.nx-stream-group + .nx-stream-group {
  margin-top: 10px;
}

.grp {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 10px 80px;
}

.future :deep(.card) {
  background: transparent;
  border: 1px dashed var(--line-strong);
}

@media (max-width: 640px) {
  .grp {
    margin-left: 62px;
  }
}
</style>
