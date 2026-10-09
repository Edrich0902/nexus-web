<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    sub?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { unit: undefined, sub: undefined, size: 'md' },
)
</script>

<template>
  <div class="nx-stat" :class="`size-${size}`">
    <div class="nx-label lab">{{ label }}</div>
    <div class="val num">
      {{ value }}<span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div v-if="sub || $slots.sub" class="sub"><slot name="sub">{{ sub }}</slot></div>
  </div>
</template>

<style scoped>
.nx-stat {
  min-width: 0;
}

.lab {
  margin-bottom: 6px;
}

.val {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.95;
}

.size-sm .val {
  font-size: 28px;
}

.size-md .val {
  font-size: 44px;
}

.size-lg .val {
  font-size: clamp(52px, 6vw, 76px);
}

.unit {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.36em;
  letter-spacing: 0;
  color: var(--ink-3);
  margin-left: 4px;
}

.sub {
  font-size: 13px;
  color: var(--ink-3);
  margin-top: 6px;
}
</style>
