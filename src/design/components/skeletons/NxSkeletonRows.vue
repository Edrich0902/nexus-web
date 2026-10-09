<script setup lang="ts">
/** Placeholder for hairline lists of rows (tracks, standings, pull requests). */
withDefaults(defineProps<{ rows?: number; thumb?: boolean }>(), { rows: 6, thumb: true })
</script>

<template>
  <div class="nx-sk-rows" aria-busy="true" aria-live="polite">
    <div v-for="n in rows" :key="n" class="row">
      <Skeleton v-if="thumb" width="40px" height="40px" border-radius="var(--r-xs)" />
      <div class="txt">
        <Skeleton :width="`${55 + ((n * 17) % 35)}%`" height="0.8rem" />
        <Skeleton :width="`${30 + ((n * 11) % 25)}%`" height="0.65rem" />
      </div>
      <Skeleton width="2.4rem" height="0.65rem" />
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.row:last-child {
  border-bottom: 0;
}

.txt {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
</style>
