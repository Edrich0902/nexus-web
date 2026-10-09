import type { Router } from 'vue-router'
import { allDestinations, primaryDestinations, secondaryDestinations } from '../navigation'
import { sections } from '../tokens'
import { scoreItem, type CommandItem, type CommandSource } from './command.store'

interface NavigationSourceOptions {
  router: Router
  extraActions?: () => CommandItem[]
}

/** "Go to" commands for every destination, plus app-level actions. */
export function createNavigationSource({ router, extraActions }: NavigationSourceOptions): CommandSource {
  const toItem = (dest: (typeof allDestinations)[number]): CommandItem => ({
    id: `go:${dest.key}`,
    label: dest.label,
    group: 'Go to',
    icon: dest.icon,
    color: sections[dest.section].field.bg,
    meta: sections[dest.section].label === dest.label ? undefined : sections[dest.section].label,
    keywords: dest.keywords,
    run: () => {
      void router.push(dest.to)
    },
  })

  return {
    id: 'navigation',
    order: 20,
    fetch: (query) => {
      const actions = extraActions?.() ?? []
      if (!query.trim()) {
        return [...actions, ...[...primaryDestinations, ...secondaryDestinations].map(toItem)]
      }
      const ranked = [...actions, ...allDestinations.map(toItem)]
        .map((item) => ({ item, score: scoreItem(item, query) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
      return ranked.slice(0, 12).map((r) => r.item)
    },
  }
}
