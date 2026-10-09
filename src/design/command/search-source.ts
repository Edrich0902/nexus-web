import type { RouteLocationRaw, Router } from 'vue-router'
import { search } from '@services/hub.service'
import type { SearchItem } from '@/types/hub/hub'
import type { IconName } from '../icons'
import { sections, type SectionKey } from '../tokens'
import type { CommandItem, CommandSource } from './command.store'

const kinds: Record<string, { section: SectionKey; icon: IconName; to: (item: SearchItem) => RouteLocationRaw }> = {
  cellar_wine: { section: 'cellar', icon: 'cellar', to: (i) => ({ name: 'cellar-wine', params: { wineId: i.id } }) },
  beer_beer: { section: 'beer', icon: 'beer', to: (i) => ({ name: 'beer-detail', params: { beerId: i.id } }) },
  spirit_spirit: { section: 'spirits', icon: 'spirits', to: (i) => ({ name: 'spirit-detail', params: { spiritId: i.id } }) },
  kitchen_recipe: { section: 'kitchen', icon: 'kitchen', to: (i) => ({ name: 'kitchen-recipe', params: { recipeId: i.id } }) },
  library_book: { section: 'library', icon: 'library', to: (i) => ({ name: 'library-book', params: { bookId: i.id } }) },
  github_repo: {
    section: 'code',
    icon: 'code',
    to: (i) => ({ name: 'github-repo', params: { owner: i.owner ?? '', repo: i.repo ?? '' } }),
  },
  spotify_playlist: {
    section: 'listening',
    icon: 'listening',
    to: (i) => ({ name: 'spotify-playlist', params: { playlistId: i.id } }),
  },
}

/** "In your collections": server-side search across every module. */
export function createSearchSource(router: Router): CommandSource {
  return {
    id: 'search',
    order: 30,
    async: true,
    minQuery: 2,
    fetch: async (query, signal) => {
      const { groups } = await search(query.trim(), signal)
      return groups.flatMap((group) =>
        group.items.flatMap((item): CommandItem[] => {
          const kind = kinds[item.type]
          if (!kind) return []
          return [
            {
              id: `search:${item.type}:${item.id}`,
              label: item.title,
              hint: item.subtitle ?? undefined,
              group: 'In your collections',
              icon: kind.icon,
              color: sections[kind.section].field.bg,
              meta: group.label,
              run: () => {
                void router.push(kind.to(item))
              },
            },
          ]
        }),
      )
    },
  }
}
