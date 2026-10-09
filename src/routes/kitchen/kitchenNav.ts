import type { PillNavItem } from '@design/components/NxPillNav.vue'

export const kitchenNav: PillNavItem[] = [
  { key: 'saved', label: 'Saved', to: { name: 'kitchen' } },
  { key: 'discover', label: 'Discover', to: { name: 'kitchen-discover' }, match: '/kitchen/discover' },
]
