<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import type { MenuItem } from 'primevue/menuitem'
import { useConfirm } from 'primevue/useconfirm'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'
import NexusAvatar from '@components/nexus-avatar/NexusAvatar.vue'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'

type SidebarMenuItem = MenuItem & {
  iconComponent?: Component
  to?: string
  matchPrefix?: boolean
}

const auth = useAuthStore()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()

const displayName = computed(() => auth.user?.name ?? 'Operator')
const displayEmail = computed(() => auth.user?.email ?? '')

const items = ref<SidebarMenuItem[]>([
  {
    label: 'Station',
    items: [
      {
        label: 'Home',
        to: '/home',
        icon: 'pi pi-home',
      },
    ],
  },
  {
    label: 'Modules',
    items: [
      {
        label: 'Spotify',
        to: '/spotify',
        iconComponent: NexusSpotifyIcon,
        matchPrefix: true,
      },
    ],
  },
])

function isNavActive(
  item: SidebarMenuItem,
  isExactActive: boolean,
): boolean {
  if (item.matchPrefix && item.to) {
    return route.path === item.to || route.path.startsWith(`${item.to}/`)
  }
  return isExactActive
}

const handleSignOut = (event: Event) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'End this terminal session?',
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Logout',
      severity: 'danger',
    },
    accept: async () => {
      await auth.logout()
      await router.replace({ name: 'login' })
    },
  })
}
</script>

<template>
  <aside class="sidebar-shell">
    <Menu :model="items" class="app-sidebar w-full">
      <template #start>
        <div class="flex items-center gap-3 px-4 py-4">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 shrink-0"
          >
            <span class="pi pi-code text-lg" />
          </div>
          <div class="flex flex-col leading-tight min-w-0 flex-1">
            <span class="text-base font-semibold text-[var(--lavender-blush)]"
              >Nexus Hub</span
            >
            <span
              class="text-xs text-[color-mix(in_srgb,var(--lavender-blush)_55%,transparent)]"
              >Command Station</span
            >
          </div>
        </div>
      </template>

      <template #item="{ item, props }">
        <router-link
          v-if="item.to"
          v-slot="{ href, navigate, isExactActive }"
          :to="item.to"
          custom
        >
          <a
            v-ripple
            :href="href"
            v-bind="props.action"
            :class="{
              'nav-item--active': isNavActive(
                item as SidebarMenuItem,
                isExactActive,
              ),
            }"
            @click="navigate"
          >
            <component
              :is="(item as SidebarMenuItem).iconComponent"
              v-if="(item as SidebarMenuItem).iconComponent"
              class="nav-icon"
              :size="18"
            />
            <span
              v-else-if="item.icon"
              :class="item.icon"
              class="w-5 text-center text-base shrink-0"
            />
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </router-link>
        <a
          v-else
          v-ripple
          :href="item.url"
          :target="item.target"
          v-bind="props.action"
        >
          <span :class="item.icon" class="w-5 text-center text-base shrink-0" />
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </template>
    </Menu>

    <div class="sidebar-footer">
      <div class="flex items-center gap-3">
        <NexusAvatar v-if="auth.user" :user="auth.user" size="normal" />
        <div class="flex flex-col min-w-0 flex-1 leading-tight">
          <span
            class="text-sm font-medium text-[var(--lavender-blush)] truncate"
            >{{ displayName }}</span
          >
          <span
            class="text-xs text-[color-mix(in_srgb,var(--lavender-blush)_50%,transparent)] truncate"
            >{{ displayEmail }}</span
          >
        </div>
        <button
          v-tooltip.top="'Logout'"
          type="button"
          class="flex items-center justify-center w-9 h-9 rounded-lg text-[color-mix(in_srgb,var(--lavender-blush)_55%,transparent)] hover:text-primary hover:bg-[color-mix(in_srgb,var(--lavender-blush)_8%,transparent)] transition-colors cursor-pointer"
          @click="handleSignOut"
        >
          <span class="pi pi-sign-out" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  overflow: hidden;
  background-color: var(--coffee-bean-panel);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.sidebar-shell :deep(.p-menu),
.sidebar-shell :deep(.p-menu-list),
.sidebar-shell :deep(.p-menu-start),
.sidebar-shell :deep([data-pc-section='root']),
.sidebar-shell :deep([data-pc-section='list']),
.sidebar-shell :deep([data-pc-section='start']) {
  background-color: var(--coffee-bean-panel) !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.app-sidebar {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex !important;
  flex-direction: column !important;
  --p-menu-background: var(--coffee-bean-panel);
  --p-menu-border-color: transparent;
  --p-content-background: var(--coffee-bean-panel);
}

.app-sidebar :deep(.p-menu-submenu-label) {
  color: color-mix(in srgb, var(--lavender-blush) 45%, transparent);
}

.app-sidebar :deep(.p-menu-item-link),
.app-sidebar a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  border-radius: 0.5rem;
  color: color-mix(in srgb, var(--lavender-blush) 78%, transparent);
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.app-sidebar a:hover {
  background: color-mix(in srgb, var(--meadow-green) 14%, transparent);
  color: var(--lavender-blush);
}

.app-sidebar a.nav-item--active {
  background: color-mix(in srgb, var(--meadow-green) 18%, transparent);
  color: var(--meadow-green);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: #1db954;
}

.nav-item--active .nav-icon {
  color: #1db954;
}

.nav-label {
  font-size: 0.925rem;
  font-weight: 500;
}

.sidebar-footer {
  flex-shrink: 0;
  margin-top: auto;
  padding: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  background-color: var(--coffee-bean-panel);
}
</style>
