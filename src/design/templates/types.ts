export type ViewState = 'ready' | 'loading' | 'empty' | 'error'

/** Collapse the usual loading / error / empty flags into one view state. */
export function viewState(opts: { loading: boolean; error?: unknown; empty?: boolean }): ViewState {
  if (opts.loading) return 'loading'
  if (opts.error) return 'error'
  if (opts.empty) return 'empty'
  return 'ready'
}
