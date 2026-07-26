<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import type { MenuItem } from 'primevue/menuitem'
import { useConfirm } from 'primevue/useconfirm'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'
import NexusAvatar from '@components/nexus-avatar/NexusAvatar.vue'
import NexusLogo from '@components/nexus-logo/NexusLogo.vue'
import NexusSpotifyIcon from '@components/nexus-spotify-icon/NexusSpotifyIcon.vue'
import NexusGithubIcon from '@components/nexus-github-icon/NexusGithubIcon.vue'
import NexusSportIcon from '@components/nexus-sport-icon/NexusSportIcon.vue'
import NexusF1Icon from '@components/nexus-f1-icon/NexusF1Icon.vue'
import NexusFoodDrinkIcon from '@components/nexus-food-drink-icon/NexusFoodDrinkIcon.vue'
import NexusWineIcon from '@components/nexus-wine-icon/NexusWineIcon.vue'
import NexusBeerIcon from '@components/nexus-beer-icon/NexusBeerIcon.vue'
import NexusRecipeIcon from '@components/nexus-recipe-icon/NexusRecipeIcon.vue'
import type { SportsSlug } from '@/types/sports/sports'

type SidebarMenuItem = MenuItem & {
  iconComponent?: Component
  to?: string
  matchPrefix?: boolean
  accent?: 'spotify' | 'github' | 'f1' | 'admin' | 'food-drink' | 'cellar' | 'kitchen' | 'beer'
  sport?: SportsSlug
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
      {
        label: 'Admin',
        to: '/admin',
        icon: 'pi pi-server',
        matchPrefix: true,
        accent: 'admin',
      },
      {
        label: 'Media',
        to: '/media',
        icon: 'pi pi-images',
        matchPrefix: true,
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
        accent: 'spotify',
      },
      {
        label: 'GitHub',
        to: '/github',
        iconComponent: NexusGithubIcon,
        matchPrefix: true,
        accent: 'github',
      },
      {
        label: 'Food & Drink',
        to: '/food-drink',
        iconComponent: NexusFoodDrinkIcon,
        matchPrefix: true,
        accent: 'food-drink',
      },
    ],
  },
  {
    label: 'Cellar & Kitchen',
    items: [
      {
        label: 'Wine',
        to: '/cellar',
        iconComponent: NexusWineIcon,
        matchPrefix: true,
        accent: 'cellar',
      },
      {
        label: 'Beer',
        to: '/beer',
        iconComponent: NexusBeerIcon,
        matchPrefix: true,
        accent: 'beer',
      },
      {
        label: 'Recipes',
        to: '/kitchen',
        iconComponent: NexusRecipeIcon,
        matchPrefix: true,
        accent: 'kitchen',
      },
    ],
  },
  {
    label: 'Sports Hub',
    items: [
      {
        label: 'Formula 1',
        to: '/f1',
        iconComponent: NexusF1Icon,
        matchPrefix: true,
        accent: 'f1',
      },
      {
        label: 'Football',
        to: '/sports/football',
        iconComponent: NexusSportIcon,
        sport: 'football',
        matchPrefix: true,
      },
      {
        label: 'Tennis',
        to: '/sports/tennis',
        iconComponent: NexusSportIcon,
        sport: 'tennis',
        matchPrefix: true,
      },
      {
        label: 'Rugby',
        to: '/sports/rugby',
        iconComponent: NexusSportIcon,
        sport: 'rugby',
        matchPrefix: true,
      },
      {
        label: 'Golf',
        to: '/sports/golf',
        iconComponent: NexusSportIcon,
        sport: 'golf',
        matchPrefix: true,
      },
      {
        label: 'Darts',
        to: '/sports/darts',
        iconComponent: NexusSportIcon,
        sport: 'darts',
        matchPrefix: true,
      },
      {
        label: 'Field Hockey',
        to: '/sports/field-hockey',
        iconComponent: NexusSportIcon,
        sport: 'field-hockey',
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
    <div class="sidebar-header">
      <div class="flex items-center gap-3 px-4 py-4">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 shrink-0"
        >
          <NexusLogo :size="22" />
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
    </div>

    <div class="sidebar-nav">
      <Menu :model="items" class="app-sidebar w-full">
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
                :class="{
                  'nav-icon--spotify':
                    (item as SidebarMenuItem).accent === 'spotify',
                  'nav-icon--github':
                    (item as SidebarMenuItem).accent === 'github',
                  'nav-icon--f1': (item as SidebarMenuItem).accent === 'f1',
                  'nav-icon--admin':
                    (item as SidebarMenuItem).accent === 'admin',
                  'nav-icon--food-drink':
                    (item as SidebarMenuItem).accent === 'food-drink',
                  'nav-icon--cellar':
                    (item as SidebarMenuItem).accent === 'cellar',
                  'nav-icon--kitchen':
                    (item as SidebarMenuItem).accent === 'kitchen',
                  'nav-icon--beer':
                    (item as SidebarMenuItem).accent === 'beer',
                }"
                :size="18"
                :sport="(item as SidebarMenuItem).sport ?? 'hub'"
              />
              <span
                v-else-if="item.icon"
                :class="[
                  item.icon,
                  'w-5 text-center text-base shrink-0',
                  {
                    'nav-icon--admin':
                      (item as SidebarMenuItem).accent === 'admin',
                  },
                ]"
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
            <span
              :class="item.icon"
              class="w-5 text-center text-base shrink-0"
            />
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </template>
      </Menu>
    </div>

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
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  overflow: hidden;
  background-color: var(--coffee-bean-panel);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.sidebar-header {
  flex-shrink: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  background-color: var(--coffee-bean-panel);
}

.sidebar-nav {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar-shell :deep(.p-menu),
.sidebar-shell :deep(.p-menu-list),
.sidebar-shell :deep([data-pc-section='root']),
.sidebar-shell :deep([data-pc-section='list']) {
  background-color: var(--coffee-bean-panel) !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.app-sidebar {
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
}

.nav-icon--spotify,
.nav-item--active .nav-icon--spotify {
  color: var(--spotify-green);
}

.nav-icon--github,
.nav-item--active .nav-icon--github {
  color: var(--github-ink);
}

.nav-icon--f1,
.nav-item--active .nav-icon--f1 {
  color: var(--sport-f1);
}

.nav-icon--admin,
.nav-item--active .nav-icon--admin {
  color: var(--admin-accent);
}

.nav-icon--food-drink,
.nav-item--active .nav-icon--food-drink {
  color: var(--food-drink-accent);
}

.nav-icon--cellar,
.nav-item--active .nav-icon--cellar {
  color: var(--wine-accent);
}

.nav-icon--kitchen,
.nav-item--active .nav-icon--kitchen {
  color: var(--kitchen-accent);
}

.nav-icon--beer,
.nav-item--active .nav-icon--beer {
  color: var(--beer-accent);
}

.nav-label {
  font-size: 0.925rem;
  font-weight: 500;
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  background-color: var(--coffee-bean-panel);
}
</style>
