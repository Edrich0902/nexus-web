const HIDE_DELAY_MS = 900
const MIN_THUMB_PX = 28
const EDGE_INSET_PX = 3

type Axis = 'y' | 'x'

let thumbY: HTMLDivElement | null = null
let thumbX: HTMLDivElement | null = null
let hideTimer: number | undefined
let activeEl: Element | null = null

function scrollTarget(event: Event): Element | null {
  const { target } = event
  if (target instanceof Document) return document.documentElement
  if (target instanceof Element) return target
  return null
}

function ensureThumbs(): { y: HTMLDivElement; x: HTMLDivElement } {
  if (!thumbY) {
    thumbY = document.createElement('div')
    thumbY.className = 'nexus-scrollbar-thumb nexus-scrollbar-thumb--y'
    thumbY.setAttribute('aria-hidden', 'true')
    document.body.appendChild(thumbY)
  }
  if (!thumbX) {
    thumbX = document.createElement('div')
    thumbX.className = 'nexus-scrollbar-thumb nexus-scrollbar-thumb--x'
    thumbX.setAttribute('aria-hidden', 'true')
    document.body.appendChild(thumbX)
  }
  return { y: thumbY, x: thumbX }
}

function hideThumbs(): void {
  if (thumbY) thumbY.classList.remove('is-visible')
  if (thumbX) thumbX.classList.remove('is-visible')
  activeEl = null
}

function metrics(
  el: Element,
  axis: Axis,
): { size: number; client: number; scroll: number; max: number } | null {
  const size = axis === 'y' ? el.scrollHeight : el.scrollWidth
  const client = axis === 'y' ? el.clientHeight : el.clientWidth
  const scroll = axis === 'y' ? el.scrollTop : el.scrollLeft
  const max = size - client
  if (max <= 0) return null
  return { size, client, scroll, max }
}

function placeThumb(el: Element, axis: Axis, thumb: HTMLDivElement): boolean {
  const m = metrics(el, axis)
  if (!m) {
    thumb.classList.remove('is-visible')
    return false
  }

  const rect = el.getBoundingClientRect()
  const track = m.client
  const thumbSize = Math.max(MIN_THUMB_PX, (m.client / m.size) * track)
  const travel = Math.max(0, track - thumbSize)
  const offset = m.max === 0 ? 0 : (m.scroll / m.max) * travel

  if (axis === 'y') {
    thumb.style.width = `var(--scrollbar-size)`
    thumb.style.height = `${thumbSize}px`
    thumb.style.top = `${rect.top + offset}px`
    thumb.style.left = `${rect.right - EDGE_INSET_PX}px`
    thumb.style.transform = 'translateX(-100%)'
  } else {
    thumb.style.height = `var(--scrollbar-size)`
    thumb.style.width = `${thumbSize}px`
    thumb.style.left = `${rect.left + offset}px`
    thumb.style.top = `${rect.bottom - EDGE_INSET_PX}px`
    thumb.style.transform = 'translateY(-100%)'
  }

  thumb.classList.add('is-visible')
  return true
}

function syncOverlay(el: Element): void {
  const { y, x } = ensureThumbs()
  activeEl = el
  const showedY = placeThumb(el, 'y', y)
  const showedX = placeThumb(el, 'x', x)
  if (!showedY && !showedX) hideThumbs()
}

function scheduleHide(): void {
  if (hideTimer !== undefined) window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    hideThumbs()
    hideTimer = undefined
  }, HIDE_DELAY_MS)
}

/**
 * Overlay scroll indicators that float above content (no layout gutter)
 * and only appear while an element is actively scrolling.
 */
export function initAutoHideScrollbars(): void {
  document.addEventListener(
    'scroll',
    (event) => {
      const el = scrollTarget(event)
      if (!el) return
      syncOverlay(el)
      scheduleHide()
    },
    { capture: true, passive: true },
  )

  window.addEventListener(
    'resize',
    () => {
      if (activeEl) syncOverlay(activeEl)
    },
    { passive: true },
  )
}
