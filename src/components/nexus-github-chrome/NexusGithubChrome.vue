<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useGithubStore } from '@stores/github/github.store'

const github = useGithubStore()
const route = useRoute()

const links = [
  { name: 'github', label: 'Home', match: (n: string) => n === 'github' },
  {
    name: 'github-pulls',
    label: 'Pull requests',
    match: (n: string) => n === 'github-pulls' || n.startsWith('github-pull'),
  },
] as const
</script>

<template>
  <div class="github-chrome">
    <nav v-if="github.connected" class="github-nav" aria-label="GitHub">
      <router-link
        v-for="link in links"
        :key="link.name"
        :to="{ name: link.name }"
        class="nav-link"
        :class="{ active: link.match(String(route.name ?? '')) }"
      >
        {{ link.label }}
      </router-link>
    </nav>
    <slot />
  </div>
</template>

<style scoped>
.github-chrome {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.github-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.35rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--lavender-blush) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.nav-link {
  padding: 0.45rem 0.85rem;
  border-radius: 0.65rem;
  text-decoration: none;
  color: color-mix(in srgb, var(--lavender-blush) 70%, transparent);
  font-size: 0.9rem;
  font-weight: 600;
}

.nav-link:hover,
.nav-link.active {
  background: color-mix(in srgb, var(--github-ink) 12%, transparent);
  color: var(--github-ink);
}
</style>
