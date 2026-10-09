<script setup lang="ts">
/** Timeline container. Use NxStreamGroup for "Now / Earlier / Coming up" headings. */
</script>

<template>
  <div class="nx-stream" role="list">
    <slot />
  </div>
</template>

<style scoped>
.nx-stream {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
