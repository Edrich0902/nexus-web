import { defineQuery, defineMutation } from '@pinia/colada'
import * as f1Service from '@services/f1.service'

export const f1Keys = {
  all: ['f1'] as const,
  status: ['f1', 'status'] as const,
  home: ['f1', 'home'] as const,
  season: (year?: number) => ['f1', 'season', year ?? 'current'] as const,
  standings: (year?: number) => ['f1', 'standings', year ?? 'current'] as const,
  meeting: (key: number) => ['f1', 'meeting', key] as const,
  session: (key: number) => ['f1', 'session', key] as const,
  analysis: (key: number) => ['f1', 'analysis', key] as const,
  replay: (key: number, driver?: number) =>
    ['f1', 'replay', key, driver ?? 'all'] as const,
}

export const useF1StatusQuery = defineQuery({
  key: f1Keys.status,
  query: () => f1Service.getStatus(),
})

export const useF1SyncMutation = defineMutation({
  mutation: (payload: { type?: string; year?: number } = {}) =>
    f1Service.sync(payload.type ?? 'all', payload.year),
})
