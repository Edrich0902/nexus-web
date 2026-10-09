<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import NxIcon from '../NxIcon.vue'
import { inkFor } from '../../color'
import {
  highlightParts,
  useCommandStore,
  type CommandItem,
  type CommandSource,
} from '../../command/command.store'

const store = useCommandStore()

const input = ref<HTMLInputElement | null>(null)
const list = ref<HTMLElement | null>(null)
const syncItems = ref<CommandItem[]>([])
const asyncItems = ref<Record<string, CommandItem[]>>({})
const loading = ref(false)
const selected = ref(0)

let debounce: ReturnType<typeof setTimeout> | null = null
let controller: AbortController | null = null

const items = computed<CommandItem[]>(() => {
  const ordered: CommandItem[] = []
  for (const source of store.sources) {
    if (source.async) ordered.push(...(asyncItems.value[source.id] ?? []))
    else ordered.push(...syncItems.value.filter((i) => i.id.startsWith(`${source.id}|`)))
  }
  return ordered
})

const groups = computed(() => {
  const map = new Map<string, CommandItem[]>()
  for (const item of items.value) {
    const bucket = map.get(item.group) ?? []
    bucket.push(item)
    map.set(item.group, bucket)
  }
  return [...map.entries()].map(([name, entries]) => ({ name, entries }))
})

const flat = computed(() => groups.value.flatMap((g) => g.entries))

function runSync(query: string): void {
  const next: CommandItem[] = []
  const dummy = new AbortController()
  for (const source of store.sources) {
    if (source.async) continue
    const out = source.fetch(query, dummy.signal) as CommandItem[]
    next.push(...out.map((i) => ({ ...i, id: `${source.id}|${i.id}` })))
  }
  syncItems.value = next
}

function runAsync(query: string): void {
  if (debounce) clearTimeout(debounce)
  controller?.abort()
  const asyncSources = store.sources.filter((s) => s.async)
  const eligible = asyncSources.filter((s) => query.trim().length >= (s.minQuery ?? 2))
  if (!eligible.length) {
    asyncItems.value = {}
    loading.value = false
    return
  }
  loading.value = true
  debounce = setTimeout(async () => {
    const ctrl = new AbortController()
    controller = ctrl
    const results = await Promise.allSettled(
      eligible.map(async (s: CommandSource) => [s.id, await s.fetch(query, ctrl.signal)] as const),
    )
    if (ctrl.signal.aborted) return
    const next: Record<string, CommandItem[]> = {}
    for (const r of results) {
      if (r.status === 'fulfilled') next[r.value[0]] = r.value[1]
    }
    asyncItems.value = next
    loading.value = false
  }, 180)
}

watch(
  () => [store.query, store.open, store.sources] as const,
  ([query, open]) => {
    if (!open) return
    runSync(query)
    runAsync(query)
    selected.value = 0
  },
  { immediate: true },
)

watch(flat, (list) => {
  if (selected.value >= list.length) selected.value = Math.max(0, list.length - 1)
})

function move(delta: number): void {
  const n = flat.value.length
  if (!n) return
  selected.value = (selected.value + delta + n) % n
  void nextTick(() => {
    list.value?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  })
}

async function runItem(item: CommandItem | undefined): Promise<void> {
  if (!item) return
  store.hide()
  await item.run()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    void runItem(flat.value[selected.value])
  }
}

function onShow(): void {
  void nextTick(() => input.value?.focus())
}

function indexOf(item: CommandItem): number {
  return flat.value.indexOf(item)
}

function chipStyle(item: CommandItem): Record<string, string> | undefined {
  if (!item.color) return undefined
  return { background: item.color, color: inkFor(item.color) }
}

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
  controller?.abort()
})
</script>

<template>
  <Dialog
    v-model:visible="store.open"
    modal
    dismissable-mask
    :show-header="false"
    :draggable="false"
    position="top"
    :pt="{
      root: { class: 'nx-palette' },
      mask: { class: 'nx-palette-mask' },
      content: { class: 'nx-palette-body' },
    }"
    @show="onShow"
  >
    <div class="nx-palette-in">
      <NxIcon name="search" :size="20" />
      <input
        ref="input"
        v-model="store.query"
        type="text"
        placeholder="Ask, find or log anything"
        aria-label="Search Nexus"
        role="combobox"
        aria-controls="nx-palette-results"
        :aria-expanded="true"
        :aria-activedescendant="flat[selected] ? `nx-cmd-${selected}` : undefined"
        autocomplete="off"
        spellcheck="false"
        @keydown="onKeydown"
      />
      <span v-if="loading" class="nx-palette-spin" aria-hidden="true" />
      <kbd>esc</kbd>
    </div>

    <div id="nx-palette-results" ref="list" class="nx-palette-res" role="listbox">
      <template v-for="group in groups" :key="group.name">
        <div class="nx-palette-g">{{ group.name }}</div>
        <button
          v-for="item in group.entries"
          :id="`nx-cmd-${indexOf(item)}`"
          :key="item.id"
          type="button"
          role="option"
          class="nx-palette-it"
          :class="{ sel: indexOf(item) === selected }"
          :data-selected="indexOf(item) === selected"
          :aria-selected="indexOf(item) === selected"
          @mousemove="selected = indexOf(item)"
          @click="runItem(item)"
        >
          <span class="nx-palette-ic" :style="chipStyle(item)">
            <NxIcon :name="item.icon" :size="16" />
          </span>
          <span class="nx-palette-txt">
            <span class="t">
              <template v-for="(part, i) in highlightParts(item.label, store.query)" :key="i">
                <mark v-if="part.hit">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
            <span v-if="item.hint" class="s">{{ item.hint }}</span>
          </span>
          <span v-if="item.meta" class="k">{{ item.meta }}</span>
        </button>
      </template>
      <p v-if="!flat.length && !loading" class="nx-palette-empty">
        Nothing matches “{{ store.query }}”.
      </p>
    </div>

    <div class="nx-palette-foot">
      <span>↑↓ to move</span>
      <span>↵ to open</span>
      <span class="hide-phone">⌘K anywhere</span>
    </div>
  </Dialog>
</template>

<style>
.nx-palette-mask {
  background: rgba(0, 0, 0, 0.45) !important;
  padding-top: 14vh;
}

.p-dialog.nx-palette {
  width: min(680px, calc(100vw - 32px));
  border-radius: var(--r-xxl);
  background: var(--overlay);
  border: 1px solid var(--line);
  color: var(--ink);
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.nx-palette .nx-palette-body {
  padding: 0;
}

.nx-palette-in {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-3);
}

.nx-palette-in input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 19px;
  caret-color: var(--acc);
}

.nx-palette-in input::placeholder {
  color: var(--ink-3);
}

.nx-palette kbd {
  font-family: inherit;
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--line);
  color: var(--ink-3);
}

.nx-palette-spin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--line-strong);
  border-top-color: var(--acc);
  animation: nx-spin 0.8s linear infinite;
}

@keyframes nx-spin {
  to {
    transform: rotate(360deg);
  }
}

.nx-palette-res {
  padding: 8px;
  max-height: min(60vh, 520px);
  overflow: auto;
}

.nx-palette-g {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding: 12px 12px 6px;
}

.nx-palette-it {
  width: 100%;
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 9px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.nx-palette-it.sel {
  background: var(--tint-2);
}

.nx-palette-ic {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--tint-2);
  color: var(--ink);
}

.nx-palette-txt {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nx-palette-txt .t {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nx-palette mark {
  background: none;
  color: var(--acc);
}

.nx-palette-txt .s {
  font-size: 12.5px;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nx-palette-it .k {
  font-size: 12px;
  color: var(--ink-3);
}

.nx-palette-empty {
  margin: 0;
  padding: 24px 12px;
  text-align: center;
  color: var(--ink-3);
}

.nx-palette-foot {
  display: flex;
  gap: 16px;
  padding: 10px 20px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-3);
}

@media (max-width: 640px) {
  .nx-palette-mask {
    padding-top: 0;
  }

  .p-dialog.nx-palette {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    border-radius: 0;
    border: 0;
  }

  .nx-palette .nx-palette-body {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .nx-palette-res {
    flex: 1;
    max-height: none;
  }

  .nx-palette .hide-phone {
    display: none;
  }
}
</style>
