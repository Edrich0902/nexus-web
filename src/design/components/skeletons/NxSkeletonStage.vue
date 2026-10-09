<script setup lang="ts">
withDefaults(defineProps<{ visual?: boolean }>(), { visual: true })
</script>

<template>
  <div class="nx-sk-stage" :class="{ 'has-visual': visual }" aria-busy="true" aria-live="polite">
    <Skeleton v-if="visual" class="art" width="100%" height="100%" border-radius="var(--r-lg)" />
    <div class="copy">
      <Skeleton width="9rem" height="0.8rem" />
      <Skeleton width="85%" height="4.4rem" border-radius="var(--r-sm)" />
      <Skeleton width="55%" height="1rem" />
      <div class="actions">
        <Skeleton width="7rem" height="2.6rem" border-radius="999px" />
        <Skeleton width="6rem" height="2.6rem" border-radius="999px" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.nx-sk-stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 56px;
  align-items: center;
  padding: 24px 0 8px;
}

.nx-sk-stage.has-visual {
  grid-template-columns: 300px 1fr;
}

.art {
  aspect-ratio: 1;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 960px) {
  .nx-sk-stage.has-visual {
    grid-template-columns: 200px 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .nx-sk-stage.has-visual {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .art {
    width: 132px !important;
  }
}
</style>
