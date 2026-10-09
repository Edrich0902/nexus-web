<script setup lang="ts">
import { computed, ref } from 'vue'
import { sections } from '@design/tokens'
import { useAmbientStore } from '@design/ambient'
import { toBarChartData, toDoughnutChartData } from '@lib/charts'
import NxStage from '@design/components/NxStage.vue'
import NxSerifSummary from '@design/components/NxSerifSummary.vue'
import NxSectionHeader from '@design/components/NxSectionHeader.vue'
import NxBento from '@design/components/NxBento.vue'
import NxField from '@design/components/NxField.vue'
import NxStream from '@design/components/NxStream.vue'
import NxStreamGroup from '@design/components/NxStreamGroup.vue'
import NxStreamItem from '@design/components/NxStreamItem.vue'
import NxStatNumber from '@design/components/NxStatNumber.vue'
import NxRankList, { type RankItem } from '@design/components/NxRankList.vue'
import NxHourBars from '@design/components/NxHourBars.vue'
import NxRangeBar from '@design/components/NxRangeBar.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxSkeletonStage from '@design/components/skeletons/NxSkeletonStage.vue'
import NxSkeletonFields from '@design/components/skeletons/NxSkeletonFields.vue'
import NxSkeletonStream from '@design/components/skeletons/NxSkeletonStream.vue'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import StatsTemplate from '@design/templates/StatsTemplate.vue'
import WorkbenchTemplate from '@design/templates/WorkbenchTemplate.vue'
import type { ViewState } from '@design/templates/types'

const state = ref<ViewState>('ready')
const stateOptions: { value: ViewState; label: string }[] = [
  { value: 'ready', label: 'Ready' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
]

const range = ref<'4w' | '6m' | 'all'>('4w')
const template = ref<'index' | 'detail' | 'stats' | 'workbench'>('index')

const s = sections

const ranks: RankItem[] = [
  { id: 1, title: 'Fred again..', sub: 'Electronic', value: '412 plays' },
  { id: 2, title: 'Bonobo', sub: 'Downtempo', value: '288 plays' },
  { id: 3, title: 'Khruangbin', sub: 'Psych', value: '231 plays' },
  { id: 4, title: 'Jamie xx', sub: 'Electronic', value: '190 plays' },
  { id: 5, title: 'Little Simz', sub: 'Hip-hop', value: '174 plays' },
]

const hours = [2, 1, 0, 0, 0, 0, 3, 8, 14, 18, 16, 12, 10, 14, 22, 26, 20, 18, 24, 32, 28, 18, 9, 4]

const ambient = useAmbientStore()
const bar = computed(() => {
  void ambient.active.acc
  return toBarChartData(
    [
      { label: 'Mon', count: 42 },
      { label: 'Tue', count: 58 },
      { label: 'Wed', count: 33 },
      { label: 'Thu', count: 71 },
      { label: 'Fri', count: 64 },
      { label: 'Sat', count: 90 },
      { label: 'Sun', count: 48 },
    ],
    'Minutes',
  )
})
const doughnut = toDoughnutChartData([
  { label: 'Red', count: 24 },
  { label: 'White', count: 11 },
  { label: 'Sparkling', count: 6 },
  { label: 'Rosé', count: 3 },
])
</script>

<template>
  <div class="kit">
    <div class="state-bar">
      <span class="nx-label">Preview state</span>
      <NxPillGroup v-model="state" :options="stateOptions" label="Preview state" size="sm" />
    </div>

    <section>
      <h2 class="nx-label">Stage</h2>
      <NxSkeletonStage v-if="state === 'loading'" />
      <NxStage
        v-else
        eyebrow="Now playing · Kitchen speaker"
        live
        title="Time"
        accent="(You and I)"
        lede="Khruangbin · Mordechai — 2:14 of 6:19"
        :progress="0.35"
      >
        <template #visual>
          <div class="fake-art" />
        </template>
        <template #actions>
          <Button label="Pause" rounded severity="contrast" />
          <Button label="Queue" rounded severity="secondary" />
        </template>
      </NxStage>
      <NxSerifSummary class="mt">
        You have listened for <b>2h 14m</b> today, tasted <b>3 wines</b> this week and
        committed <em>14 times</em>.
      </NxSerifSummary>
    </section>

    <section>
      <NxSectionHeader title="Colour fields" action-label="See all" />
      <NxSkeletonFields v-if="state === 'loading'" :spans="[5, 4, 3, 3, 3, 3, 3]" />
      <NxEmptyState
        v-else-if="state === 'empty'"
        title="No modules yet"
        body="Connect Spotify or add a bottle to see your fields."
      />
      <NxEmptyState
        v-else-if="state === 'error'"
        title="Could not load your day"
        body="Try again in a moment."
        icon="close"
        tone="error"
      />
      <NxBento v-else>
        <NxField
          :bg="s.listening.field.bg"
          label="Listening today"
          aside="↑ 18%"
          value="2h 14m"
          :value-size="72"
          sub="Mostly Khruangbin and Bonobo"
          :span="5"
          :rows="2"
          to="/spotify"
        />
        <NxField :bg="s.cellar.field.bg" label="Cellar" aside="44 bottles" value="6" sub="ready to drink" :span="4" :pips="{ value: 4 }" to="/cellar" />
        <NxField :bg="s.f1.field.bg" label="Next race" value="3d" sub="Singapore GP · Sun 14:00" :span="3" to="/f1" />
        <NxField :bg="s.beer.field.bg" label="Beer" value="27" sub="this year" :span="3" :progress="0.54" />
        <NxField :bg="s.code.field.bg" label="Code" value="14" sub="commits this week" :span="3" />
        <NxField :bg="s.library.field.bg" variant="tint" label="Reading" value="62%" sub="The Overstory" :span="3" />
        <NxField variant="outline" label="Media" value="—" sub="Nothing uploaded" :span="3" />
      </NxBento>
    </section>

    <section class="two">
      <div>
        <NxSectionHeader title="Stream" />
        <NxSkeletonStream v-if="state === 'loading'" />
        <NxEmptyState v-else-if="state !== 'ready'" title="A quiet day" body="Activity shows up here as it happens." />
        <NxStream v-else>
          <NxStreamGroup label="Now">
            <NxStreamItem time="13:10" :color="s.listening.field.bg" kind="Listening" meta="Kitchen speaker" title="Time (You and I)" body="Khruangbin · Mordechai" />
          </NxStreamGroup>
          <NxStreamGroup label="Earlier">
            <NxStreamItem time="11:02" :color="s.code.ambient.acc" kind="Code" meta="nexus-web" title="Merged #142 · Ambient engine" :chips="['+812', '−340', '12 files']" />
            <NxStreamItem time="07:45" :color="s.cellar.ambient.acc" kind="Cellar" meta="Tasting" title="2016 Kanonkop Paul Sauer" body="Cassis, cedar, still tight." :chips="['92 pts', 'Hold 3y']" />
          </NxStreamGroup>
          <NxStreamGroup label="Coming up" future>
            <NxStreamItem time="Sun" :color="s.f1.ambient.acc" kind="F1" meta="Marina Bay" title="Singapore Grand Prix" future />
          </NxStreamGroup>
        </NxStream>
      </div>

      <div class="stack">
        <NxPanel title="Stat numbers">
          <div class="stats-row">
            <NxStatNumber label="Plays" value="6,482" sub="last 4 weeks" />
            <NxStatNumber label="Minutes" value="312" unit="min" size="sm" />
            <NxStatNumber label="Peak" value="21:00" size="sm" />
          </div>
        </NxPanel>
        <NxPanel title="By hour">
          <NxHourBars :values="hours" :ticks="['00', '06', '12', '18', '23']" label="Plays by hour" />
        </NxPanel>
        <NxPanel title="Drinking window">
          <NxRangeBar :min="2018" :max="2040" :from="2022" :to="2034" :peak="2028" :now="2026" label="Drinking window" />
        </NxPanel>
      </div>
    </section>

    <section>
      <div class="row-head">
        <h2 class="nx-label">Rank lists</h2>
        <NxPillGroup
          v-model="range"
          size="sm"
          label="Range"
          :options="[
            { value: '4w', label: '4 weeks' },
            { value: '6m', label: '6 months' },
            { value: 'all', label: 'All time' },
          ]"
        />
      </div>
      <NxRankList :items="ranks" variant="circles" />
      <NxPanel class="mt">
        <NxRankList :items="ranks.map((r) => ({ ...r, image: null }))" variant="rows" shape="square" />
      </NxPanel>
    </section>

    <section class="two">
      <NxPanel title="Chart · bar (accent)">
        <NexusChart type="bar" :data="bar" height="14rem" />
      </NxPanel>
      <NxPanel title="Chart · doughnut (field series)">
        <NexusChart type="doughnut" :data="doughnut" height="14rem" />
      </NxPanel>
    </section>

    <section>
      <NxPanel title="Facts">
        <NxFacts
          :items="[
            { label: 'Producer', value: 'Kanonkop' },
            { label: 'Region', value: 'Stellenbosch' },
            { label: 'Vintage', value: 2016 },
            { label: 'Grapes', value: 'Cabernet, Merlot, Cab Franc' },
            { label: 'Alcohol', value: '14.5%' },
            { label: 'Hidden when empty', value: null },
          ]"
        />
      </NxPanel>
    </section>

    <section>
      <div class="row-head">
        <h2 class="nx-label">Templates</h2>
        <NxPillGroup
          v-model="template"
          size="sm"
          label="Template"
          :options="[
            { value: 'index', label: 'Index' },
            { value: 'detail', label: 'Detail' },
            { value: 'stats', label: 'Stats' },
            { value: 'workbench', label: 'Workbench' },
          ]"
        />
      </div>
      <div class="frame">
        <IndexTemplate v-if="template === 'index'" :state="state" empty-title="Your cellar is empty" empty-body="Add a bottle to start.">
          <template #stage>
            <NxStage eyebrow="Cellar" title="44 bottles," accent="6 ready" size="compact" />
          </template>
          <template #fields>
            <NxBento :row-height="110">
              <NxField :bg="s.cellar.field.bg" label="Red" value="24" :span="4" />
              <NxField :bg="s.cellar.ambient.acc" label="White" value="11" :span="4" />
              <NxField variant="tint" :bg="s.cellar.ambient.acc" label="Sparkling" value="6" :span="4" />
            </NxBento>
          </template>
          <template #toolbar>
            <InputText placeholder="Search bottles" />
            <Button label="Add bottle" rounded />
          </template>
          <div class="grid-demo">
            <div v-for="n in 8" :key="n" class="tile" />
          </div>
        </IndexTemplate>

        <DetailTemplate v-else-if="template === 'detail'" :state="state" back-to="/design" back-label="Cellar">
          <template #stage>
            <NxStage eyebrow="Red · Stellenbosch" title="Paul Sauer" accent="2016" lede="Kanonkop" size="compact">
              <template #visual><div class="fake-art" /></template>
            </NxStage>
          </template>
          <NxPanel title="Notes"><NxSerifSummary size="nose">Cassis, cedar and <b>graphite</b>; still tight.</NxSerifSummary></NxPanel>
          <template #aside>
            <NxPanel title="Window"><NxRangeBar :min="2018" :max="2040" :from="2022" :to="2034" :now="2026" /></NxPanel>
          </template>
        </DetailTemplate>

        <StatsTemplate v-else-if="template === 'stats'" :state="state">
          <template #stage>
            <NxStage eyebrow="Listening stats" title="Your" accent="4 weeks" size="compact" />
          </template>
          <template #range>
            <NxPillGroup v-model="range" size="sm" label="Range" :options="[{ value: '4w', label: '4 weeks' }, { value: '6m', label: '6 months' }]" />
          </template>
          <template #fields>
            <NxBento :row-height="110">
              <NxField :bg="s.listening.field.bg" label="Plays" value="6,482" :span="6" />
              <NxField variant="tint" :bg="s.listening.field.bg" label="Hours" value="312" :span="6" />
            </NxBento>
          </template>
          <NxPanel title="By hour"><NxHourBars :values="hours" /></NxPanel>
          <NxPanel title="Top artists"><NxRankList :items="ranks.slice(0, 3)" /></NxPanel>
        </StatsTemplate>

        <WorkbenchTemplate v-else>
          <template #header>
            <h2 class="nx-serif wb-title">Pull requests</h2>
            <Button label="New" rounded size="small" />
          </template>
          <template #rail>
            <div v-for="n in 12" :key="n" class="pr"><NxIcon name="code" :size="14" /> #{{ 140 + n }} Ambient tweak {{ n }}</div>
          </template>
          <pre class="nx-mono diff">+ const ambient = useAmbientStore()
- const layout = useLayoutStore()</pre>
        </WorkbenchTemplate>
      </div>
    </section>
  </div>
</template>

<style scoped>
.kit {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.state-bar {
  position: sticky;
  top: calc(var(--shell-top) + 8px);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  align-self: flex-start;
  padding: 6px 6px 6px 16px;
  border-radius: 999px;
  background: var(--overlay);
  backdrop-filter: blur(14px);
}

section > h2 {
  margin: 0 0 14px;
}

.mt {
  margin-top: 24px;
}

.two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  align-items: start;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.row-head h2 {
  margin: 0;
}

.fake-art {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 30% 30%, var(--acc), transparent 60%),
    radial-gradient(circle at 70% 80%, #1ed760, transparent 55%),
    var(--amb-2);
}

.frame {
  border: 1px dashed var(--line-strong);
  border-radius: var(--r-xxl);
  padding: 24px;
}

.grid-demo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.tile {
  aspect-ratio: 3 / 4;
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.wb-title {
  font-size: 32px;
  font-weight: 400;
  margin: 0;
}

.pr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.diff {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ink-2);
}

@media (max-width: 960px) {
  .two {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .frame {
    padding: 14px;
  }
}
</style>
