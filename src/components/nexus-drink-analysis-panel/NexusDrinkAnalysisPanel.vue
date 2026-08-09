<script setup lang="ts">
import { computed } from 'vue'
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

const structureRows = computed(() => {
  const a = props.analysis
  if (!a) return []
  const s = a.sensory
  return [
    s.appearance && { label: 'Appearance', value: s.appearance },
    s.body && { label: 'Body', value: s.body },
    s.sweetness && { label: 'Sweetness', value: s.sweetness },
    s.acidity && { label: 'Acidity', value: s.acidity },
    s.tannin && { label: 'Tannin', value: s.tannin },
    s.bitterness && { label: 'Bitterness', value: s.bitterness },
    s.bitterness_ibu != null && { label: 'IBU', value: String(s.bitterness_ibu) },
    s.carbonation && { label: 'Carbonation', value: s.carbonation },
    s.smoke_peat && { label: 'Smoke / peat', value: s.smoke_peat },
    s.mouthfeel && { label: 'Mouthfeel', value: s.mouthfeel },
    s.finish && { label: 'Finish', value: s.finish },
  ].filter(Boolean) as { label: string; value: string }[]
})

const aromas = computed(() => props.analysis?.sensory.aroma_notes ?? [])
const flavours = computed(() => props.analysis?.sensory.taste_notes ?? [])
const characteristics = computed(
  () => props.analysis?.narrative.characteristics ?? [],
)
const facts = computed(() => props.analysis?.narrative.interesting_facts ?? [])
const pairings = computed(() => props.analysis?.narrative.food_pairings ?? [])

const servingLine = computed(() => {
  const n = props.analysis?.narrative
  if (!n) return null
  const parts: string[] = []
  if (n.serving_suggestions) parts.push(n.serving_suggestions)
  if (n.glassware) parts.push(n.glassware)
  const t = n.serving_temp_c
  if (t?.min != null || t?.max != null) {
    if (t.min != null && t.max != null) parts.push(`${t.min}–${t.max}°C`)
    else if (t.min != null) parts.push(`from ${t.min}°C`)
    else if (t.max != null) parts.push(`up to ${t.max}°C`)
  }
  return parts.length ? parts.join(' · ') : null
})

const busy = computed(
  () => props.status === 'pending' || Boolean(props.analysing),
)
</script>

<template>
  <section class="analysis">
    <header class="analysis__head">
      <h3>Tasting notes</h3>
      <Button
        v-if="!complete"
        :label="busy ? 'Analysing…' : 'Analyse'"
        icon="pi pi-sparkles"
        size="small"
        :loading="busy"
        :disabled="busy"
        @click="emit('analyse', false)"
      />
      <Button
        v-else
        label="Re-analyse"
        icon="pi pi-refresh"
        size="small"
        severity="secondary"
        text
        :loading="analysing"
        @click="emit('analyse', true)"
      />
    </header>

    <div v-if="busy" class="analysis__status analysis__status--info">
      Analysis is running — rich tasting notes will appear shortly. A label photo
      improves accuracy.
    </div>

    <div v-else-if="status === 'failed'" class="analysis__status analysis__status--warn">
      {{ error || 'Analysis failed. Try again.' }}
    </div>

    <p v-else-if="!complete" class="analysis__hint">
      Run analysis to generate aromas, flavours, structure, pairings, and notes for
      this bottle.
    </p>

    <template v-else-if="analysis">
      <p v-if="analysis.narrative.tasting_notes" class="analysis__lede">
        {{ analysis.narrative.tasting_notes }}
      </p>

      <div v-if="aromas.length" class="section">
        <h4>Aromas</h4>
        <ul class="notes" aria-label="Aroma notes">
          <li v-for="n in aromas" :key="'aroma-' + n">{{ n }}</li>
        </ul>
      </div>

      <div v-if="flavours.length" class="section">
        <h4>Flavours</h4>
        <ul class="notes" aria-label="Flavour notes">
          <li v-for="n in flavours" :key="'taste-' + n">{{ n }}</li>
        </ul>
      </div>

      <div v-if="structureRows.length" class="section">
        <h4>Structure</h4>
        <dl class="structure">
          <div v-for="row in structureRows" :key="row.label" class="structure__row">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="characteristics.length" class="section">
        <h4>Character</h4>
        <ul class="bullets">
          <li v-for="(c, i) in characteristics" :key="'c-' + i">{{ c }}</li>
        </ul>
      </div>

      <div v-if="facts.length" class="section">
        <h4>Worth knowing</h4>
        <ul class="bullets">
          <li v-for="(f, i) in facts" :key="'f-' + i">{{ f }}</li>
        </ul>
      </div>

      <div v-if="pairings.length" class="section">
        <h4>Food pairings</h4>
        <ul class="notes" aria-label="Food pairings">
          <li v-for="p in pairings" :key="'p-' + p">{{ p }}</li>
        </ul>
      </div>

      <p v-if="servingLine" class="analysis__serve">
        <span class="serve-label">Serve</span>
        {{ servingLine }}
      </p>
    </template>
  </section>
</template>

<style scoped>
.analysis {
  padding: 1rem 1.1rem 1.15rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--lavender-blush) 7%, transparent);
}

.analysis__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
}

.analysis__head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.analysis__status {
  margin: 0 0 0.35rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.55rem;
  font-size: 0.9rem;
  line-height: 1.45;
}

.analysis__status--info {
  background: color-mix(in srgb, var(--wine-accent, #c45c6a) 14%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 92%, transparent);
}

.analysis__status--warn {
  background: color-mix(in srgb, #d97706 16%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 92%, transparent);
}

.analysis__hint {
  margin: 0;
  line-height: 1.5;
  font-size: 0.92rem;
  opacity: 0.7;
}

.analysis__lede {
  margin: 0 0 1rem;
  line-height: 1.55;
  font-size: 0.98rem;
}

.section {
  margin: 0 0 1rem;
}

.section:last-of-type {
  margin-bottom: 0.65rem;
}

.section h4 {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.58;
}

.notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.notes li {
  margin: 0;
  padding: 0.28rem 0.6rem;
  font-size: 0.82rem;
  line-height: 1.25;
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--lavender-blush) 9%, transparent);
  color: color-mix(in srgb, var(--lavender-blush) 88%, transparent);
}

.structure {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.45rem 0.85rem;
  margin: 0;
}

.structure__row {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.structure__row dt {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.5;
}

.structure__row dd {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.3;
}

.bullets {
  margin: 0;
  padding-left: 1.05rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bullets li {
  line-height: 1.45;
  font-size: 0.92rem;
}

.analysis__serve {
  margin: 0.35rem 0 0;
  padding-top: 0.85rem;
  border-top: 1px solid color-mix(in srgb, var(--lavender-blush) 10%, transparent);
  font-size: 0.88rem;
  line-height: 1.45;
  opacity: 0.85;
}

.serve-label {
  display: inline-block;
  margin-right: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.55;
}
</style>
