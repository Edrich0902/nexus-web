<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
        @click="toggle(fileKey(file, index))"
      >
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
  gap: 0.55rem;
}

.file-card {
  border-radius: 0.85rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  background: color-mix(in srgb, var(--lavender-blush) 3%, transparent);
}

.file-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 0.75rem 0.9rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
}

.file-meta {
  display: flex;
  gap: 0.65rem;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}

.add {
  color: #3fb950;
  font-weight: 600;
}

.del {
  color: #f85149;
  font-weight: 600;
}

.file-body {
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 8%, transparent);
}

.side-by-side {
  background: #0d1117;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.45;
}

.hunk-header {
  padding: 0.35rem 0.65rem;
  color: #8b949e;
  background: #161b22;
  border-top: 1px solid #30363d;
  border-bottom: 1px solid #30363d;
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
  border-right: 1px solid #30363d;
}

.pane-right {
  border-right: 0;
}

.row {
  display: grid;
  grid-template-columns: 3.25rem max-content;
  width: max-content;
  min-width: 100%;
  min-height: 1.45em;
}

.gutter {
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 0 0.4rem;
  text-align: right;
  color: #6e7681;
  user-select: none;
  border-right: 1px solid #21262d;
  white-space: nowrap;
  background: #0d1117;
}

.gutter.cell-del {
  background: #2d1518;
}

.gutter.cell-add {
  background: #12261a;
}

.gutter.cell-empty {
  background: #161b22;
}

.code {
  display: flex;
  align-items: flex-start;
  padding: 0 0.5rem;
  white-space: pre;
}

.sign {
  flex: 0 0 0.85rem;
  width: 0.85rem;
  color: inherit;
  opacity: 0.85;
  user-select: none;
}

.text {
  white-space: pre;
}

.cell-context {
  color: #e6edf3;
}

.code.cell-context {
  background: transparent;
}

.code.cell-del {
  background: rgba(248, 81, 73, 0.15);
  color: #ffa198;
  box-shadow: inset 2px 0 0 #f85149;
}

.code.cell-add {
  background: rgba(63, 185, 80, 0.15);
  color: #7ee787;
  box-shadow: inset 2px 0 0 #3fb950;
}

.code.cell-empty {
  background: rgba(110, 118, 129, 0.08);
  color: transparent;
  min-width: 4rem;
}

.empty {
  padding: 1rem;
  color: color-mix(in srgb, var(--lavender-blush) 55%, transparent);
}
</style>
