<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    tone?: 'neutral' | 'info' | 'success' | 'warn' | 'danger'
  }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <span class="chip" :class="`t-${tone}`">{{ label }}</span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--ink-2);
  background: var(--tint-2);
}

.t-info {
  color: var(--acc);
  background: color-mix(in srgb, var(--acc) 16%, transparent);
}

.t-success {
  color: var(--ok);
  background: color-mix(in srgb, var(--ok) 16%, transparent);
}

.t-warn {
  color: var(--warn);
  background: color-mix(in srgb, var(--warn) 16%, transparent);
}

.t-danger {
  color: var(--bad);
  background: color-mix(in srgb, var(--bad) 16%, transparent);
}
</style>
