<script setup lang="ts">
/**
 * A large serif sentence. Wrap the values that matter in <b> to lift them to
 * full ink; <em> picks up the accent colour.
 */
withDefaults(defineProps<{ size?: 'lg' | 'md' | 'nose' }>(), { size: 'lg' })
</script>

<template>
  <p class="nx-serif-summary" :class="`size-${size}`">
    <slot />
  </p>
</template>

<style scoped>
.nx-serif-summary {
  font-family: var(--font-serif);
  font-weight: 400;
  color: var(--ink-3);
  margin: 0;
}

.size-lg {
  font-size: clamp(24px, 2.6vw, 32px);
  line-height: 1.3;
  max-width: 34ch;
}

.size-md {
  font-size: 24px;
  line-height: 1.3;
  max-width: 40ch;
}

.size-nose {
  font-size: clamp(30px, 3.8vw, 46px);
  line-height: 1.15;
  letter-spacing: -0.01em;
  max-width: 26ch;
  color: var(--ink-2);
}

.nx-serif-summary :deep(b) {
  font-weight: 400;
  color: var(--ink);
}

.nx-serif-summary :deep(em) {
  color: var(--acc);
}
</style>
