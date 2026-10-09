import type { IconName } from './icons'
import type { SectionKey } from './tokens'

export interface Destination {
  key: string
  label: string
  icon: IconName
  to: string
  section: SectionKey
  /** Extra words the command palette should match on. */
  keywords?: string[]
}

/** Primary destinations shown in the dock, grouped by separators. */
export const dockGroups: Destination[][] = [
  [{ key: 'home', label: 'Home', icon: 'home', to: '/home', section: 'home' }],
  [
    { key: 'listening', label: 'Listening', icon: 'listening', to: '/spotify', section: 'listening', keywords: ['spotify', 'music'] },
    { key: 'code', label: 'Code', icon: 'code', to: '/github', section: 'code', keywords: ['github', 'pull requests'] },
    { key: 'cellar', label: 'Wine', icon: 'wine', to: '/cellar', section: 'cellar', keywords: ['cellar', 'bottles'] },
    { key: 'beer', label: 'Beer', icon: 'beer', to: '/beer', section: 'beer' },
    { key: 'spirits', label: 'Spirits', icon: 'spirits', to: '/spirits', section: 'spirits', keywords: ['whisky', 'gin', 'rum'] },
    { key: 'kitchen', label: 'Recipes', icon: 'kitchen', to: '/kitchen', section: 'kitchen', keywords: ['kitchen', 'cook'] },
    { key: 'food-drink', label: 'Food & Drink', icon: 'food-drink', to: '/food-drink', section: 'food-drink', keywords: ['pairings'] },
    { key: 'library', label: 'Library', icon: 'library', to: '/library', section: 'library', keywords: ['books', 'reading'] },
  ],
  [
    { key: 'f1', label: 'Formula 1', icon: 'f1', to: '/f1', section: 'f1', keywords: ['race', 'grand prix'] },
    { key: 'sports', label: 'Sports', icon: 'sports', to: '/sports/football', section: 'sports', keywords: ['football', 'rugby', 'tennis'] },
  ],
]

/** Phone tab bar: the four most-used destinations; everything else lives in "More". */
export const phoneTabs = ['home', 'listening', 'cellar', 'f1'] as const

/** Secondary destinations: reachable from the avatar menu, "More" sheet and ⌘K. */
export const secondaryDestinations: Destination[] = [
  { key: 'media', label: 'Media vault', icon: 'media', to: '/media', section: 'media', keywords: ['photos', 'images'] },
  { key: 'admin', label: 'Admin', icon: 'admin', to: '/admin', section: 'admin', keywords: ['queue', 'jobs', 'ops'] },
  { key: 'profile', label: 'Profile', icon: 'profile', to: '/profile', section: 'profile', keywords: ['account'] },
]

/** Deeper pages worth jumping to directly from ⌘K. */
export const subDestinations: Destination[] = [
  { key: 'spotify-search', label: 'Search Spotify', icon: 'search', to: '/spotify/search', section: 'listening' },
  { key: 'spotify-library', label: 'Your Spotify library', icon: 'music', to: '/spotify/library', section: 'listening', keywords: ['playlists'] },
  { key: 'spotify-stats', label: 'Listening stats', icon: 'listening', to: '/spotify/stats', section: 'listening', keywords: ['top artists'] },
  { key: 'github-pulls', label: 'Pull requests', icon: 'code', to: '/github/pulls', section: 'code', keywords: ['prs', 'reviews'] },
  { key: 'github-search', label: 'Search code', icon: 'search', to: '/github/search', section: 'code', keywords: ['repositories'] },
  { key: 'github-stats', label: 'Code stats', icon: 'code', to: '/github/stats', section: 'code', keywords: ['contributions'] },
  { key: 'kitchen-discover', label: 'Discover recipes', icon: 'kitchen', to: '/kitchen/discover', section: 'kitchen' },
  { key: 'pairings', label: 'Food and drink pairings', icon: 'food-drink', to: '/food-drink/pairings', section: 'food-drink' },
  { key: 'sessions', label: 'Signed-in devices', icon: 'profile', to: '/profile/sessions', section: 'profile', keywords: ['sessions', 'security'] },
  { key: 'sport-football', label: 'Football', icon: 'sports', to: '/sports/football', section: 'sports' },
  { key: 'sport-rugby', label: 'Rugby', icon: 'sports', to: '/sports/rugby', section: 'sports' },
  { key: 'sport-tennis', label: 'Tennis', icon: 'sports', to: '/sports/tennis', section: 'sports' },
  { key: 'sport-golf', label: 'Golf', icon: 'sports', to: '/sports/golf', section: 'sports' },
  { key: 'sport-darts', label: 'Darts', icon: 'sports', to: '/sports/darts', section: 'sports' },
  { key: 'sport-field-hockey', label: 'Field hockey', icon: 'sports', to: '/sports/field-hockey', section: 'sports' },
]

export const primaryDestinations: Destination[] = dockGroups.flat()

export const allDestinations: Destination[] = [
  ...primaryDestinations,
  ...secondaryDestinations,
  ...subDestinations,
]

const PREFIX_SECTIONS: [string, SectionKey][] = [
  ['/spotify', 'listening'],
  ['/github', 'code'],
  ['/cellar', 'cellar'],
  ['/beer', 'beer'],
  ['/spirits', 'spirits'],
  ['/kitchen', 'kitchen'],
  ['/food-drink', 'food-drink'],
  ['/library', 'library'],
  ['/f1', 'f1'],
  ['/sports', 'sports'],
  ['/media', 'media'],
  ['/admin', 'admin'],
  ['/profile', 'profile'],
  ['/login', 'auth'],
]

export function sectionForPath(path: string): SectionKey {
  for (const [prefix, key] of PREFIX_SECTIONS) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return key
  }
  return 'home'
}

export function isDestinationActive(dest: Destination, path: string): boolean {
  if (dest.key === 'sports') return path.startsWith('/sports')
  return path === dest.to || path.startsWith(`${dest.to}/`)
}
