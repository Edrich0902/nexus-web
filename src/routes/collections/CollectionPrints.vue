<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NxPrintCard from '@design/components/NxPrintCard.vue'
import NxNoteFilter from '@design/components/NxNoteFilter.vue'
import { usePalettes } from '@design/usePalettes'
import { panelColour, topNotes } from '@design/profile'
import type { PrintModel } from '@design/prints'

/** A collection as fingerprint cards, browsable by shared note. */
const props = withDefaults(defineProps<{ prints: PrintModel[]; filterLabel?: string }>(), {
  filterLabel: 'Notes',
})

const note = ref<string | null>(null)
const options = computed(() => {
  if (props.prints.length < 2) return []
  const top = topNotes(props.prints.map((p) => p.notes))
  return top.length > 1 ? top : []
})

watch(options, (list) => {
  if (note.value && !list.includes(note.value)) note.value = null
})

const palette = usePalettes(() => props.prints.map((p) => p.paletteUrl))
</script>

<template>
  <div class="collection-prints">
    <NxNoteFilter v-model="note" :options="options" :label="filterLabel" />
    <div class="grid">
      <NxPrintCard
        v-for="(p, i) in prints"
        :key="p.key"
        :print="p"
        :note="note"
        :bg="panelColour(palette(p.paletteUrl), p.fallbackBg)"
        :style="{ '--i': i }"
      />
    </div>
  </div>
</template>

<style scoped>
.collection-prints {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr));
  gap: 16px;
}
</style>
