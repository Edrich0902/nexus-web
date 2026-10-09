<script setup lang="ts">
import { useRoute, type RouteLocationRaw } from 'vue-router'

export interface PillNavItem {
  key: string
  label: string
  to: RouteLocationRaw
  /** Path prefix that marks the pill active; defaults to exact route match. */
  match?: string
}

defineProps<{
  items: PillNavItem[]
  label: string
}>()

const route = useRoute()

function isActive(item: PillNavItem, exact: boolean): boolean {
  if (item.match) return route.path === item.match || route.path.startsWith(`${item.match}/`)
  return exact
}
</script>

<template>
  <nav class="nx-pill-nav" :aria-label="label">
    <RouterLink
      v-for="item in items"
      :key="item.key"
      v-slot="{ href, navigate, isExactActive }"
      :to="item.to"
      custom
    >
      <a
        :href="href"
        class="pill"
        :class="{ on: isActive(item, isExactActive) }"
        :aria-current="isActive(item, isExactActive) ? 'page' : undefined"
        @click="navigate"
      >
        {{ item.label }}
      </a>
    </RouterLink>
  </nav>
</template>

<style scoped>
.nx-pill-nav {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--line);
  overflow-x: auto;
  max-width: 100%;
}

.pill {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 6px 13px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s;
}

.pill:hover {
  color: var(--ink);
}

.pill.on {
  background: var(--ink);
  color: var(--amb);
  font-weight: 600;
}
</style>
