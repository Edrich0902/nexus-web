import { defineQuery, defineMutation } from '@pinia/colada'
import * as sportsService from '@services/sports.service'

export const sportsKeys = {
  all: ['sports'] as const,
  status: ['sports', 'status'] as const,
  home: ['sports', 'home'] as const,
  sport: (slug: string) => ['sports', 'sport', slug] as const,
}

export const useSportsStatusQuery = defineQuery({
  key: sportsKeys.status,
  query: () => sportsService.getStatus(),
})

export const useSportsSyncMutation = defineMutation({
  mutation: (type: string = 'all') => sportsService.sync(type),
})
