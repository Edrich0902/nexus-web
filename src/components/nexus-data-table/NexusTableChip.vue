<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    tone?: 'neutral' | 'info' | 'success' | 'warn' | 'danger'
  }>(),
  { tone: 'neutral' },
)

const classes = computed(() => [`ndt-chip`, `ndt-chip--${props.tone}`])
</script>

<template>
  <span :class="classes">{{ label }}</span>
</template>

<style scoped>
.ndt-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.ndt-chip--neutral {
  color: color-mix(in srgb, var(--lavender-blush) 85%, transparent);
  background: color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  border-color: color-mix(in srgb, var(--lavender-blush) 16%, transparent);
}

.ndt-chip--info {
  color: #9ec9ea;
  background: color-mix(in srgb, var(--admin-accent) 22%, transparent);
  border-color: color-mix(in srgb, var(--admin-accent) 35%, transparent);
}

.ndt-chip--success {
  color: #ace894;
  background: color-mix(in srgb, var(--meadow-green) 22%, transparent);
  border-color: color-mix(in srgb, var(--meadow-green) 35%, transparent);
}

.ndt-chip--warn {
  color: #fbbf24;
  background: color-mix(in srgb, #fbbf24 18%, transparent);
  border-color: color-mix(in srgb, #fbbf24 35%, transparent);
}

.ndt-chip--danger {
  color: #fb7185;
  background: color-mix(in srgb, #fb7185 18%, transparent);
  border-color: color-mix(in srgb, #fb7185 35%, transparent);
}
</style>
