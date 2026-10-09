/** GitHub's own language colours for the common cases; others fall back to ink. */
const LANGUAGE_COLOURS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Vue: '#41b883',
  PHP: '#4f5d95',
  Blade: '#f7523f',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Java: '#b07219',
  'C#': '#178600',
  Dart: '#00b4ab',
  Ruby: '#701516',
  Shell: '#89e051',
  CSS: '#663399',
  SCSS: '#c6538c',
  HTML: '#e34c26',
}

export function languageColour(language: string | null | undefined): string {
  return (language && LANGUAGE_COLOURS[language]) || 'var(--ink-3)'
}

export function firstLine(message: string | null | undefined): string {
  return (message ?? '').split('\n')[0]?.trim() || '(no message)'
}

export function shortSha(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 7) : ''
}

export type PullState = 'open' | 'draft' | 'merged' | 'closed'

export function pullState(pull: { state: string | null; draft?: boolean; merged?: boolean; merged_at?: string | null }): PullState {
  if (pull.merged || pull.merged_at) return 'merged'
  if (pull.state === 'closed') return 'closed'
  return pull.draft ? 'draft' : 'open'
}

export const PULL_STATE_LABEL: Record<PullState, string> = {
  open: 'Open',
  draft: 'Draft',
  merged: 'Merged',
  closed: 'Closed',
}

export const PULL_FILTERS = [
  { value: 'open' as const, label: 'Open' },
  { value: 'merged' as const, label: 'Merged' },
  { value: 'closed' as const, label: 'Closed' },
  { value: 'all' as const, label: 'All' },
]
