<script setup lang="ts">
import NxIcon from '@design/components/NxIcon.vue'

/** Circuit map on a light plate: OpenF1 maps are dark lines meant for white pages. */
defineProps<{ src?: string | null; alt?: string }>()
</script>

<template>
  <div class="circuit">
    <img v-if="src" :src="src" :alt="alt ?? ''" loading="lazy" />
    <NxIcon v-else name="f1" :size="56" />
  </div>
</template>

<style scoped>
.circuit {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 28px;
  background: var(--ink);
  color: var(--amb);
}

.circuit img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (max-width: 640px) {
  .circuit {
    padding: 14px;
  }
}
</style>
