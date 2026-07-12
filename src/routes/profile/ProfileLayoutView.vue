<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'

const route = useRoute()

const links = [
  { name: 'profile', label: 'Details', icon: 'pi pi-user' },
  { name: 'profile-sessions', label: 'Active sessions', icon: 'pi pi-desktop' },
] as const

const pageTitle = computed(() =>
  route.name === 'profile-sessions' ? 'Active sessions' : 'Profile',
)
</script>

<template>
  <NexusPageWrapper show-toolbar :title="pageTitle">
    <div class="flex flex-col gap-4 flex-1 min-h-0">
      <nav
        class="flex flex-wrap gap-2 border-b border-[color-mix(in_srgb,var(--lavender-blush)_12%,transparent)] pb-3"
      >
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          class="profile-subnav__link"
          :class="{ 'profile-subnav__link--active': route.name === link.name }"
        >
          <span :class="link.icon" class="text-sm" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <RouterView />
    </div>
  </NexusPageWrapper>
</template>

<style scoped>
.profile-subnav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--lavender-blush) 65%, transparent);
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.profile-subnav__link:hover {
  background: color-mix(in srgb, var(--lavender-blush) 8%, transparent);
  color: var(--lavender-blush);
}

.profile-subnav__link--active {
  background: color-mix(in srgb, var(--bubblegum-pink) 18%, transparent);
  color: var(--bubblegum-pink);
}
</style>
