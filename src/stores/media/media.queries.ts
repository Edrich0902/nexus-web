/**
 * Kept for Pinia Colada key conventions / future query wiring.
 * The media store currently loads list/usage via the service layer.
 */
export const mediaKeys = {
  all: ['media'] as const,
  list: (params: Record<string, unknown>) => ['media', 'list', params] as const,
  detail: (id: number) => ['media', 'detail', id] as const,
  usage: ['media', 'usage'] as const,
  unsplash: (q: string, page: number) =>
    ['media', 'unsplash', q, page] as const,
}
