<script setup lang="ts">
import { computed } from 'vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxSerifSummary from '@design/components/NxSerifSummary.vue'
import NxChips from '@design/components/NxChips.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxIcon from '@design/components/NxIcon.vue'
import type { AnalysisStatus, DrinkAnalysis } from '@/types/analysis/drink-analysis'

const props = defineProps<{
  status?: AnalysisStatus | null
  analysis?: DrinkAnalysis | null
  error?: string | null
  analysing?: boolean
}>()

const emit = defineEmits<{
  analyse: [force?: boolean]
}>()

const complete = computed(() => props.status === 'complete' && props.analysis)

const busy = computed(() => props.status === 'pending' || Boolean(props.analysing))

const structure = computed(() => {
  const s = props.analysis?.sensory
  if (!s) return []
  return [
    { label: 'Appearance', value: s.appearance },
    { label: 'Body', value: s.body },
    { label: 'Sweetness', value: s.sweetness },
    { label: 'Acidity', value: s.acidity },
    { label: 'Tannin', value: s.tannin },
    { label: 'Bitterness', value: s.bitterness },
    { label: 'IBU', value: s.bitterness_ibu ?? undefined },
    { label: 'Carbonation', value: s.carbonation },
    { label: 'Smoke / peat', value: s.smoke_peat },
    { label: 'Mouthfeel', value: s.mouthfeel },
    { label: 'Finish', value: s.finish },
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== '')
})

const aromas = computed(() => props.analysis?.sensory.aroma_notes ?? [])
const flavours = computed(() => props.analysis?.sensory.taste_notes ?? [])
const characteristics = computed(() => props.analysis?.narrative.characteristics ?? [])
const facts = computed(() => props.analysis?.narrative.interesting_facts ?? [])
const pairings = computed(() => props.analysis?.narrative.food_pairings ?? [])

const servingLine = computed(() => {
  const n = props.analysis?.narrative
  if (!n) return null
  const parts: string[] = []
  if (n.serving_suggestions) parts.push(n.serving_suggestions)
  if (n.glassware) parts.push(n.glassware)
  const t = n.serving_temp_c
  if (t?.min != null && t?.max != null) parts.push(`${t.min}–${t.max}°C`)
  else if (t?.min != null) parts.push(`from ${t.min}°C`)
  else if (t?.max != null) parts.push(`up to ${t.max}°C`)
  return parts.length ? parts.join(' · ') : null
})
</script>

<template>
  <section class="analysis" aria-labelledby="analysis-title">
    <NxSectionHeader id="analysis-title" title="Tasting notes">
      <template #action>
        <Button
          v-if="!complete"
          :label="busy ? 'Analysing…' : 'Analyse'"
          size="small"
          rounded
          :loading="busy"
          :disabled="busy"
          @click="emit('analyse', false)"
        >
          <template #icon="{ class: iconClass }">
            <NxIcon name="sparkles" :size="15" :class="iconClass" />
          </template>
        </Button>
        <Button
          v-else
          label="Re-analyse"
          size="small"
          rounded
          severity="secondary"
          text
          :loading="analysing"
          @click="emit('analyse', true)"
        >
          <template #icon="{ class: iconClass }">
            <NxIcon name="refresh" :size="15" :class="iconClass" />
          </template>
        </Button>
      </template>
    </NxSectionHeader>

    <div v-if="busy" class="note info" role="status">
      <NxIcon name="sparkles" :size="16" />
      Reading the label and writing notes. This usually takes under a minute; a clear label photo helps.
    </div>

    <div v-else-if="status === 'failed'" class="note warn" role="alert">
      {{ error || 'Analysis failed. Try again.' }}
    </div>

    <p v-else-if="!complete" class="hint">
      Run an analysis for aromas, flavours, structure, pairings and serving notes.
    </p>

    <div v-else-if="analysis" class="body">
      <NxSerifSummary v-if="analysis.narrative.tasting_notes" size="md">
        {{ analysis.narrative.tasting_notes }}
      </NxSerifSummary>

      <div v-if="aromas.length || flavours.length" class="pair">
        <div v-if="aromas.length">
          <h4 class="nx-label">Aromas</h4>
          <NxChips :items="aromas" label="Aroma notes" tone="accent" />
        </div>
        <div v-if="flavours.length">
          <h4 class="nx-label">Flavours</h4>
          <NxChips :items="flavours" label="Flavour notes" tone="accent" />
        </div>
      </div>

      <div v-if="structure.length">
        <h4 class="nx-label">Structure</h4>
        <NxFacts :items="structure" :cols="3" />
      </div>

      <div v-if="characteristics.length || facts.length" class="pair">
        <div v-if="characteristics.length">
          <h4 class="nx-label">Character</h4>
          <ul class="lines">
            <li v-for="(c, i) in characteristics" :key="'c-' + i">{{ c }}</li>
          </ul>
        </div>
        <div v-if="facts.length">
          <h4 class="nx-label">Worth knowing</h4>
          <ul class="lines">
            <li v-for="(f, i) in facts" :key="'f-' + i">{{ f }}</li>
          </ul>
        </div>
      </div>

      <div v-if="pairings.length">
        <h4 class="nx-label">Food pairings</h4>
        <NxChips :items="pairings" label="Food pairings" />
      </div>

      <p v-if="servingLine" class="serve">
        <span class="nx-label">Serve</span>
        {{ servingLine }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.analysis {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--r-md);
  font-size: 14px;
  line-height: 1.5;
}

.note :deep(svg) {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--acc);
  animation: nx-pulse 1.6s infinite;
}

.info {
  background: color-mix(in srgb, var(--acc) 12%, transparent);
}

.warn {
  background: color-mix(in srgb, #e5484d 16%, transparent);
}

.hint {
  margin: 0;
  color: var(--ink-3);
  font-size: 15px;
  max-width: 52ch;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

h4 {
  margin: 0 0 10px;
}

.pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lines li {
  padding: 10px 0;
  border-top: 1px solid var(--line);
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ink-2);
}

.serve {
  margin: 0;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-size: 14.5px;
  color: var(--ink-2);
}

.serve .nx-label {
  margin-right: 10px;
}

@media (max-width: 640px) {
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>
