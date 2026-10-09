<script setup lang="ts">
withDefaults(defineProps<{ items?: number }>(), { items: 4 })
</script>

<template>
  <div class="nx-sk-stream" aria-busy="true" aria-live="polite">
    <div v-for="n in items" :key="n" class="ev">
      <Skeleton width="2.6rem" height="0.7rem" class="t" />
      <div class="ln"><i /></div>
      <Skeleton width="100%" :height="n % 2 ? '4.6rem' : '3.6rem'" border-radius="var(--r-md)" />
    </div>
  </div>
</template>

<style scoped>
.ev {
  display: grid;
  grid-template-columns: 56px 24px minmax(0, 1fr);
  padding: 6px 0;
}

.t {
  justify-self: end;
  margin: 12px 8px 0 0;
}

.ln {
  position: relative;
}

.ln::before {
  content: '';
  position: absolute;
  left: 11px;
  top: -6px;
  bottom: -6px;
  width: 1px;
  background: var(--line);
}

.ln i {
  position: absolute;
  left: 7px;
  top: 12px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--tint-2);
}

@media (max-width: 640px) {
  .ev {
    grid-template-columns: 42px 20px minmax(0, 1fr);
  }

  .ln::before {
    left: 9px;
  }

  .ln i {
    left: 5px;
  }
}
</style>
