<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NxIcon from '@design/components/NxIcon.vue'
import { parseUnifiedDiff } from '@lib/github-diff'
import type { GithubPullFile } from '@/types/github/github'

const props = withDefaults(
  defineProps<{
    files: GithubPullFile[]
    /** Expand all files on mount / when files change */
    expandAll?: boolean
  }>(),
  { expandAll: false },
)

const expanded = ref<Record<string, boolean>>({})

watch(
  () => props.files,
  (files) => {
    if (!props.expandAll) return
    const next: Record<string, boolean> = {}
    for (const file of files) {
      if (file.filename) next[file.filename] = true
    }
    expanded.value = next
  },
  { immediate: true },
)

function fileKey(file: GithubPullFile, index: number): string {
  return file.filename ?? file.sha ?? `file-${index}`
}

function toggle(key: string): void {
  expanded.value = {
    ...expanded.value,
    [key]: !expanded.value[key],
  }
}

function hunksFor(file: GithubPullFile) {
  if (!file.patch) return []
  return parseUnifiedDiff(file.patch)
}

const hasFiles = computed(() => props.files.length > 0)
</script>

<template>
  <section class="diff-viewer">
    <div v-if="!hasFiles" class="empty">No file changes to show.</div>
    <article
      v-for="(file, index) in files"
      :key="fileKey(file, index)"
      class="file-card"
    >
      <button
        type="button"
        class="file-head"
        :aria-expanded="Boolean(expanded[fileKey(file, index)])"
        @click="toggle(fileKey(file, index))"
      >
        <NxIcon
          name="chevron-right"
          :size="14"
          class="chev"
          :class="{ open: expanded[fileKey(file, index)] }"
        />
        <span class="filename">{{ file.filename ?? 'unknown file' }}</span>
        <span class="file-meta">
          <span class="add">+{{ file.additions ?? 0 }}</span>
          <span class="del">−{{ file.deletions ?? 0 }}</span>
          <span>{{ file.status }}</span>
        </span>
      </button>

      <div v-if="expanded[fileKey(file, index)]" class="file-body">
        <p v-if="!file.patch" class="empty">
          Patch not available for this file (binary or too large).
        </p>
        <div v-else class="side-by-side">
          <div
            v-for="(hunk, hIndex) in hunksFor(file)"
            :key="`${fileKey(file, index)}-hunk-${hIndex}`"
            class="hunk"
          >
            <div class="hunk-header">{{ hunk.header }}</div>
            <div class="hunk-body">
              <div class="pane pane-left">
                <div
                  v-for="(row, rIndex) in hunk.rows"
                  :key="`${fileKey(file, index)}-left-${hIndex}-${rIndex}`"
                  class="row"
                >
                  <div class="gutter" :class="`cell-${row.left.type}`">
                    {{ row.left.lineNumber ?? '' }}
                  </div>
                  <div class="code" :class="`cell-${row.left.type}`">
                    <span class="sign">{{
                      row.left.type === 'del'
                        ? '−'
                        : row.left.type === 'context'
                          ? ' '
                          : ''
                    }}</span>
                    <span class="text">{{ row.left.text }}</span>
                  </div>
                </div>
              </div>
              <div class="pane pane-right">
                <div
                  v-for="(row, rIndex) in hunk.rows"
                  :key="`${fileKey(file, index)}-right-${hIndex}-${rIndex}`"
                  class="row"
                >
                  <div class="gutter" :class="`cell-${row.right.type}`">
                    {{ row.right.lineNumber ?? '' }}
                  </div>
                  <div class="code" :class="`cell-${row.right.type}`">
                    <span class="sign">{{
                      row.right.type === 'add'
                        ? '+'
                        : row.right.type === 'context'
                          ? ' '
                          : ''
                    }}</span>
                    <span class="text">{{ row.right.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-card {
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--surface);
}

.file-head {
  width: 100%;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.file-head:hover {
  background: var(--tint);
}

.chev {
  flex-shrink: 0;
  color: var(--ink-3);
  transition: transform var(--dur-hover, 0.2s) ease;
}

.chev.open {
  transform: rotate(90deg);
}

.filename {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.file-meta {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.add {
  color: var(--ok);
}

.del {
  color: var(--bad);
}

.file-body {
  border-top: 1px solid var(--line);
  overflow-x: auto;
}

.side-by-side {
  min-width: 640px;
  background: color-mix(in srgb, var(--amb) 70%, #000);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
}

.hunk-header {
  padding: 6px 12px;
  color: var(--ink-3);
  background: var(--tint);
  border-block: 1px solid var(--line);
  white-space: pre;
  overflow-x: auto;
}

.hunk-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.pane {
  min-width: 0;
  overflow-x: auto;
  border-right: 1px solid var(--line);
}

.pane-right {
  border-right: 0;
}

.row {
  display: grid;
  grid-template-columns: 3.25rem max-content;
  width: max-content;
  min-width: 100%;
  min-height: 1.5em;
}

.gutter {
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 0 8px;
  text-align: right;
  color: var(--ink-3);
  user-select: none;
  border-right: 1px solid var(--line);
  white-space: nowrap;
  background: color-mix(in srgb, var(--amb) 70%, #000);
}

.gutter.cell-del {
  background: color-mix(in srgb, var(--bad) 18%, color-mix(in srgb, var(--amb) 70%, #000));
}

.gutter.cell-add {
  background: color-mix(in srgb, var(--ok) 18%, color-mix(in srgb, var(--amb) 70%, #000));
}

.gutter.cell-empty {
  background: var(--tint);
}

.code {
  display: flex;
  align-items: flex-start;
  padding: 0 8px;
  white-space: pre;
}

.sign {
  flex: 0 0 0.85rem;
  width: 0.85rem;
  opacity: 0.85;
  user-select: none;
}

.text {
  white-space: pre;
}

.cell-context {
  color: var(--ink-2);
}

.code.cell-del {
  background: color-mix(in srgb, var(--bad) 15%, transparent);
  color: var(--ink);
  box-shadow: inset 2px 0 0 var(--bad);
}

.code.cell-add {
  background: color-mix(in srgb, var(--ok) 15%, transparent);
  color: var(--ink);
  box-shadow: inset 2px 0 0 var(--ok);
}

.code.cell-empty {
  background: var(--tint);
  color: transparent;
  min-width: 4rem;
}

.empty {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  color: var(--ink-3);
}
</style>
