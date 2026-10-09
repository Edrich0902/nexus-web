import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import type { IconName } from '../icons'

export interface CommandItem {
  id: string
  label: string
  /** Secondary line under the label. */
  hint?: string
  /** Group heading, e.g. "Actions", "Go to", "In your collections". */
  group: string
  icon: IconName
  /** Icon chip colour (a solid colour field). Defaults to a tint. */
  color?: string
  /** Right-aligned hint: a shortcut or the module name. */
  meta?: string
  keywords?: string[]
  run: () => void | Promise<void>
}

/**
 * A command source turns the current query into items. Sync sources run on
 * every keystroke; async sources are debounced and can be aborted.
 */
export interface CommandSource {
  id: string
  /** Lower sorts first. */
  order: number
  async?: boolean
  /** Minimum query length before an async source runs. */
  minQuery?: number
  fetch: (query: string, signal: AbortSignal) => CommandItem[] | Promise<CommandItem[]>
}

export const useCommandStore = defineStore('command', () => {
  const open = ref(false)
  const query = ref('')
  const sources = ref<CommandSource[]>([])

  function register(source: CommandSource): () => void {
    sources.value = [...sources.value.filter((s) => s.id !== source.id), markRaw(source)].sort(
      (a, b) => a.order - b.order,
    )
    return () => unregister(source.id)
  }

  function unregister(id: string): void {
    sources.value = sources.value.filter((s) => s.id !== id)
  }

  function show(initialQuery = ''): void {
    query.value = initialQuery
    open.value = true
  }

  function hide(): void {
    open.value = false
  }

  function toggle(): void {
    if (open.value) hide()
    else show()
  }

  return { open, query, sources, register, unregister, show, hide, toggle }
})

/** Case-insensitive match score: 3 prefix, 2 word-prefix, 1 substring, 0 none. */
export function matchScore(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.trim().toLowerCase()
  if (!q) return 1
  if (t.startsWith(q)) return 3
  if (t.split(/[\s\-–·&]+/).some((w) => w.startsWith(q))) return 2
  return t.includes(q) ? 1 : 0
}

export function scoreItem(item: Pick<CommandItem, 'label' | 'hint' | 'keywords'>, query: string): number {
  const label = matchScore(item.label, query) * 3
  const keyword = Math.max(0, ...(item.keywords ?? []).map((k) => matchScore(k, query))) * 2
  const hint = item.hint ? matchScore(item.hint, query) : 0
  return Math.max(label, keyword, hint)
}

/** Split text into plain / matched parts for highlighting. */
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim()
  if (!q) return [{ text, hit: false }]
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return [{ text, hit: false }]
  return [
    { text: text.slice(0, idx), hit: false },
    { text: text.slice(idx, idx + q.length), hit: true },
    { text: text.slice(idx + q.length), hit: false },
  ].filter((p) => p.text.length > 0)
}
