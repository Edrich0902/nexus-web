<script setup lang="ts">
import { computed, ref } from 'vue'
import { sections, moments, type Ambient, type SectionKey, type MomentKey } from '@design/tokens'
import { useAmbient } from '@design/ambient'
import { inkFor } from '@design/color'
import { icons, type IconName } from '@design/icons'
import NxIcon from '@design/components/NxIcon.vue'
import DesignKitGallery from './DesignKitGallery.vue'

const picked = ref<Ambient | null>(null)
useAmbient(picked)

const sectionList = computed(() => Object.values(sections))
const momentList = computed(() => Object.entries(moments) as [MomentKey, Ambient][])
const iconNames = Object.keys(icons) as IconName[]

function pickSection(key: SectionKey): void {
  picked.value = sections[key].ambient
}

function pickMoment(key: MomentKey): void {
  picked.value = moments[key]
}

const text = ref('')
const choice = ref<string | null>(null)
const toggle = ref(true)
</script>

<template>
  <div class="design">
    <header class="design-head">
      <p class="nx-eyebrow">Design system</p>
      <h1 class="nx-serif">Nexus <em>tokens</em></h1>
      <p class="lede">Click a section or moment to retint the whole app.</p>
    </header>

    <section>
      <h2 class="nx-label">Sections</h2>
      <div class="swatches">
        <button
          v-for="s in sectionList"
          :key="s.key"
          type="button"
          class="swatch"
          :style="{ background: s.field.bg, color: s.field.ink }"
          @click="pickSection(s.key)"
        >
          <span class="swatch-label">{{ s.label }}</span>
          <span class="swatch-amb">
            <i :style="{ background: s.ambient.amb }" />
            <i :style="{ background: s.ambient.amb2 }" />
            <i :style="{ background: s.ambient.acc }" />
            <i :style="{ background: s.ambient.ink }" />
          </span>
        </button>
      </div>
    </section>

    <section>
      <h2 class="nx-label">Moments</h2>
      <div class="moments">
        <button
          v-for="[key, m] in momentList"
          :key="key"
          type="button"
          class="moment"
          :style="{ background: m.amb, color: m.ink, borderColor: m.acc }"
          @click="pickMoment(key)"
        >
          <span :style="{ color: m.acc }">●</span> {{ key }}
        </button>
        <button type="button" class="moment" @click="picked = null">Route default</button>
      </div>
    </section>

    <section>
      <h2 class="nx-label">Type</h2>
      <div class="type">
        <p class="nx-serif type-stage">Time <em>(You and I)</em></p>
        <p class="nx-serif type-summary">
          You have listened for <b>2h 14m</b> today and committed <b>14 times</b> this week.
        </p>
        <p class="nx-display type-big num">6,482</p>
        <p class="type-body">Inter body copy at 14px for readable product UI.</p>
        <p class="nx-mono type-mono">13:10 · 11:02 · 07:45</p>
      </div>
    </section>

    <section>
      <h2 class="nx-label">Text on colour (inkFor)</h2>
      <div class="ink-row">
        <span
          v-for="bg in ['#e3261b', '#e5ad1f', '#9cb0e0', '#6b1a2b', '#1ed760', '#f3ebe6', '#2f6f66']"
          :key="bg"
          class="ink-chip"
          :style="{ background: bg, color: inkFor(bg) }"
        >{{ bg }}</span>
      </div>
    </section>

    <section>
      <h2 class="nx-label">Icons</h2>
      <div class="icons">
        <span v-for="name in iconNames" :key="name" class="icon-cell" :title="name">
          <NxIcon :name="name" />
        </span>
      </div>
    </section>

    <section>
      <h2 class="nx-label">PrimeVue on the preset</h2>
      <div class="prime">
        <div class="row">
          <Button label="Primary" />
          <Button label="Secondary" severity="secondary" />
          <Button label="Contrast" severity="contrast" />
          <Button label="Outlined" outlined />
          <Button label="Text" text severity="secondary" />
          <Button label="Danger" severity="danger" />
        </div>
        <div class="row">
          <InputText v-model="text" placeholder="Search your cellar" />
          <Select
            v-model="choice"
            :options="['Red', 'White', 'Rosé', 'Sparkling']"
            placeholder="Style"
            class="w-48"
          />
          <ToggleSwitch v-model="toggle" />
        </div>
        <div class="row">
          <Tag value="Ready to drink" />
          <Tag value="Secondary" severity="secondary" />
          <Message severity="info" :closable="false">Analysed 2 days ago</Message>
        </div>
        <div class="row">
          <Skeleton width="12rem" height="1.25rem" />
          <Skeleton width="6rem" height="6rem" border-radius="18px" />
        </div>
      </div>
    </section>

    <header class="design-head">
      <p class="nx-eyebrow">Component kit</p>
      <h2 class="nx-serif kit-title">Fields, <em>stages</em> &amp; streams</h2>
    </header>
    <DesignKitGallery />
  </div>
</template>

<style scoped>
.design {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding-top: 24px;
}

.kit-title {
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 400;
  line-height: 1;
  margin: 12px 0 0;
}

.kit-title em {
  color: var(--acc);
}

.design-head h1 {
  font-size: clamp(48px, 7vw, 88px);
  line-height: 0.98;
  letter-spacing: -0.02em;
  margin: 12px 0 14px;
}

.design-head h1 em,
.type-stage em {
  color: var(--acc);
}

.lede {
  font-size: 17px;
  color: var(--ink-2);
  margin: 0;
}

section h2 {
  margin: 0 0 14px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.swatch {
  border: 0;
  border-radius: var(--r-xl);
  padding: 16px;
  height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
  transition: transform 0.35s var(--ease);
}

.swatch:hover {
  transform: scale(0.985);
}

.swatch-label {
  font-weight: 700;
}

.swatch-amb {
  display: flex;
  gap: 4px;
}

.swatch-amb i {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.moments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.moment {
  border: 1px solid var(--line);
  background: var(--tint);
  border-radius: 999px;
  padding: 8px 14px;
  text-transform: capitalize;
  cursor: pointer;
}

.type p {
  margin: 0 0 16px;
}

.type-stage {
  font-size: clamp(48px, 7vw, 88px);
  line-height: 0.98;
}

.type-summary {
  font-size: 32px;
  line-height: 1.3;
  max-width: 34ch;
  color: var(--ink-3);
}

.type-summary b {
  font-weight: 400;
  color: var(--ink);
}

.type-big {
  font-size: 96px;
}

.type-mono {
  color: var(--ink-3);
}

.ink-row,
.icons,
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.ink-chip {
  border-radius: var(--r-md);
  padding: 12px 16px;
  font-weight: 600;
}

.icon-cell {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--r-md);
  background: var(--tint);
  color: var(--ink-2);
}

.prime {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
