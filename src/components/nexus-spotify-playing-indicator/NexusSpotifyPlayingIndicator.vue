<script setup lang="ts">
withDefaults(
  defineProps<{
    /** When false, bars freeze as a quiet “paused” mark. */
    active?: boolean
    size?: 'sm' | 'md'
  }>(),
  { active: true, size: 'sm' },
)
</script>

<template>
  <span
    class="eq"
    :class="[size, { active }]"
    aria-hidden="true"
  >
    <span class="bar" />
    <span class="bar" />
    <span class="bar" />
    <span class="bar" />
  </span>
</template>

<style scoped>
.eq {
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.12em;
  /* Match badge font size so the glyph centers with uppercase caps. */
  height: 0.78em;
  width: 0.95em;
  flex-shrink: 0;
  /* Optical nudge: uppercase label sits slightly high in its em box. */
  transform: translateY(-0.06em);
  color: var(--light-green);
  line-height: 0;
}

.eq.md {
  height: 0.82em;
  width: 1em;
  gap: 0.13em;
}

.bar {
  display: block;
  width: 0.18em;
  height: 35%;
  border-radius: 999px;
  background: currentColor;
  transform-origin: bottom center;
}

.eq.active .bar {
  animation: eq-pulse 0.9s ease-in-out infinite;
}

.eq.active .bar:nth-child(1) {
  animation-delay: 0s;
  height: 45%;
}

.eq.active .bar:nth-child(2) {
  animation-delay: 0.15s;
  height: 85%;
}

.eq.active .bar:nth-child(3) {
  animation-delay: 0.28s;
  height: 55%;
}

.eq.active .bar:nth-child(4) {
  animation-delay: 0.08s;
  height: 70%;
}

.eq:not(.active) .bar:nth-child(1) {
  height: 30%;
}
.eq:not(.active) .bar:nth-child(2) {
  height: 55%;
}
.eq:not(.active) .bar:nth-child(3) {
  height: 40%;
}
.eq:not(.active) .bar:nth-child(4) {
  height: 48%;
  opacity: 0.55;
}

@keyframes eq-pulse {
  0%,
  100% {
    transform: scaleY(0.4);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .eq.active .bar {
    animation: none;
    opacity: 1;
  }
}
</style>
