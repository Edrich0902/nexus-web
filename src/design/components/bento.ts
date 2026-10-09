import type { InjectionKey } from 'vue'

export const BENTO_COLS: InjectionKey<number> = Symbol('nx-bento-cols')

/** Map a desktop span onto the tablet (4-col) and phone (2-col) grids. */
export function responsiveSpans(span: number, cols: number): { md: number; sm: number } {
  const ratio = span / cols
  return {
    md: ratio >= 0.6 ? 4 : ratio >= 0.25 ? 2 : 1,
    sm: ratio >= 0.4 ? 2 : 1,
  }
}
