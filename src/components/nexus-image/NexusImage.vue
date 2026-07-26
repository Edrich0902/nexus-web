<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    size?: 'sm' | 'md' | 'lg' | 'fill'
    rounded?: boolean
    fit?: 'contain' | 'cover'
  }>(),
  {
    src: null,
    alt: '',
    size: 'md',
    rounded: false,
    fit: 'contain',
  },
)
</script>

<template>
  <div
    class="nexus-image"
    :class="[
      `nexus-image--${size}`,
      `nexus-image--fit-${fit}`,
      { 'nexus-image--rounded': rounded },
    ]"
  >
    <img v-if="src" :src="src" :alt="alt" loading="lazy" />
    <div v-else class="nexus-image__fallback" aria-hidden="true" />
  </div>
</template>

<style scoped>
.nexus-image {
  overflow: hidden;
  background: color-mix(in srgb, var(--p-content-border-color) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexus-image--sm {
  width: 2.5rem;
  height: 2.5rem;
}

.nexus-image--md {
  width: 4rem;
  height: 3rem;
}

.nexus-image--lg {
  width: 5.5rem;
  height: 4rem;
}

.nexus-image--fill {
  width: 100%;
  height: 100%;
}

.nexus-image--rounded {
  border-radius: 0.5rem;
}

.nexus-image img {
  width: 100%;
  height: 100%;
  display: block;
}

.nexus-image--fit-contain img {
  object-fit: contain;
}

.nexus-image--fit-cover img {
  object-fit: cover;
}

.nexus-image__fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--kitchen-accent, #6a9e6e) 28%, transparent),
    transparent
  );
}
</style>
