import { defineStore } from 'pinia'
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { contrastRatio, shade } from './color'
import { sections, type Ambient, type SectionKey } from './tokens'

const VARS: Record<keyof Ambient, string> = {
  amb: '--amb',
  amb2: '--amb-2',
  acc: '--acc',
  ink: '--ink',
}

export function applyAmbient(ambient: Ambient, root: HTMLElement = document.documentElement): void {
  for (const key of Object.keys(VARS) as (keyof Ambient)[]) {
    root.style.setProperty(VARS[key], ambient[key])
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', ambient.amb)
}

let overrideSeq = 0

export const useAmbientStore = defineStore('ambient', () => {
  const section = ref<SectionKey>('home')
  const overrides = ref<{ id: number; ambient: Partial<Ambient> }[]>([])

  const base = computed<Ambient>(() => sections[section.value].ambient)

  const active = computed<Ambient>(() => {
    const top = overrides.value[overrides.value.length - 1]
    return top ? { ...base.value, ...top.ambient } : base.value
  })

  function setSection(key: SectionKey | undefined): void {
    section.value = key ?? 'home'
  }

  function pushOverride(ambient: Partial<Ambient>): number {
    const id = ++overrideSeq
    overrides.value = [...overrides.value, { id, ambient }]
    return id
  }

  function updateOverride(id: number, ambient: Partial<Ambient>): void {
    overrides.value = overrides.value.map((o) => (o.id === id ? { id, ambient } : o))
  }

  function removeOverride(id: number): void {
    overrides.value = overrides.value.filter((o) => o.id !== id)
  }

  watch(active, (value) => applyAmbient(value), { immediate: true })

  return {
    section,
    base,
    active,
    setSection,
    pushOverride,
    updateOverride,
    removeOverride,
  }
})

/**
 * Tint the whole app while the calling component is mounted, e.g. album art
 * colours on a track page or a wine's style on its detail page. Pass null /
 * undefined to fall back to the route's section ambient.
 */
export function useAmbient(source: MaybeRefOrGetter<Partial<Ambient> | null | undefined>): void {
  const store = useAmbientStore()
  let id: number | null = null

  watch(
    () => toValue(source),
    (value) => {
      if (value && Object.keys(value).length) {
        if (id === null) id = store.pushOverride(value)
        else store.updateOverride(id, value)
      } else if (id !== null) {
        store.removeOverride(id)
        id = null
      }
    },
    { immediate: true, deep: true },
  )

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      if (id !== null) store.removeOverride(id)
    })
  }
}

/**
 * Derive a legible dark ambient from artwork colours: the background is the
 * dominant colour pushed toward black, the accent is the most vibrant colour
 * lifted until it reads on that background.
 */
export function ambientFromPalette(palette: { dominant: string; vibrant: string; light: string }): Ambient {
  const amb = shade(palette.dominant, -0.82)
  const amb2 = shade(palette.dominant, -0.7)

  let acc = palette.vibrant
  for (let step = 0; step < 6 && (contrastRatio(acc, amb) ?? 0) < 4.5; step++) {
    acc = shade(acc, 0.2)
  }

  const ink = shade(palette.light, 0.85)

  return { amb, amb2, acc, ink: (contrastRatio(ink, amb) ?? 0) >= 10 ? ink : '#f6efe9' }
}
