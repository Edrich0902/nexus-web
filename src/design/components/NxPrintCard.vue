<script setup lang="ts">
import { computed } from 'vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NxIcon from './NxIcon.vue'
import NxRadar from './NxRadar.vue'
import { inkFor } from '../color'
import type { PrintModel } from '../prints'

/**
 * Fingerprint card: the item on its own colour panel, with what's inside it
 * (taste profile, reading state or cooking history) and the notes it shares
 * with the rest of the collection.
 */
const props = withDefaults(
  defineProps<{
    print: PrintModel
    /** Panel colour, usually from the artwork's palette. */
    bg?: string | null
    /** Active note filter, if any. */
    note?: string | null
  }>(),
  { bg: null, note: null },
)

const panel = computed(() => props.bg ?? props.print.fallbackBg)
const panelInk = computed(() => inkFor(panel.value))
const hasArt = computed(() => Boolean(props.print.art.media || props.print.art.src))
const match = computed(() => (props.note ? props.print.notes.includes(props.note) : null))

const tags = computed(() => {
  const shown = (props.print.tags ?? props.print.notes).slice(0, 4)
  if (props.note && match.value && !shown.includes(props.note)) return [props.note, ...shown.slice(0, 3)]
  return shown
})

const scales = computed(() => props.print.profile?.slice(0, 4) ?? [])
</script>

<template>
  <RouterLink
    :to="print.to"
    class="nx-print"
    :class="{ hit: match === true, dim: match === false }"
    :style="{ '--bg': panel, '--bg-ink': panelInk }"
  >
    <div class="art" :class="`m-${print.art.mode}`">
      <NexusImage
        v-if="hasArt"
        :media="print.art.media"
        :src="print.art.src"
        variant="hero"
        size="fill"
        :fit="print.art.mode === 'photo' ? 'cover' : 'contain'"
      />
      <NxIcon v-else :name="print.art.icon" :size="34" class="fallback" />
      <span v-if="print.favourite" class="fav" aria-label="Favourite">
        <NxIcon name="heart" :size="14" />
      </span>
    </div>

    <div class="body">
      <div class="head">
        <span class="head-left">{{ print.head.left }}</span>
        <span v-if="print.head.right" class="num">{{ print.head.right }}</span>
      </div>
      <h3 class="title">{{ print.title }}</h3>
      <div v-if="print.by" class="by">{{ print.by }}</div>

      <div v-if="print.profile" class="mid">
        <NxRadar :values="print.profile.map((a) => a.value)" />
        <dl class="scale">
          <div v-for="a in scales" :key="a.label" :title="`${a.label}: ${a.word}`">
            <dt>{{ a.label }}</dt>
            <dd>
              <i><b :style="{ width: `${Math.max(6, a.value * 100)}%` }" /></i>
              <span class="sr-only">{{ a.word }}</span>
            </dd>
          </div>
        </dl>
      </div>
      <p v-else-if="print.status" class="status" :class="`t-${print.status.tone}`">
        <span class="pulse" aria-hidden="true" />{{ print.status.text }}
      </p>

      <div v-if="print.progress" class="progress">
        <div class="progress-meta">
          <span>{{ print.progress.left }}</span>
          <span v-if="print.progress.right" class="num">{{ print.progress.right }}</span>
        </div>
        <div class="steps" aria-hidden="true">
          <i v-for="s in 3" :key="s" :class="{ on: s <= print.progress.step }" />
        </div>
      </div>

      <dl v-if="print.facts?.length" class="facts">
        <div v-for="f in print.facts" :key="f.label">
          <dt>{{ f.label }}</dt>
          <dd class="num">{{ f.value }}</dd>
        </div>
      </dl>
      <div v-if="print.cooked" class="cooked">
        <span class="dots" :aria-label="`Cooked ${print.cooked.count} times`">
          <i v-for="i in 6" :key="i" :class="{ on: i <= print.cooked.count }" />
        </span>
        <span v-if="print.cooked.note">{{ print.cooked.note }}</span>
      </div>

      <p v-if="print.blurb" class="blurb">{{ print.blurb }}</p>

      <ul v-if="tags.length" class="tags">
        <li v-for="t in tags" :key="t" :class="{ on: t === note }">{{ t }}</li>
      </ul>

      <div class="foot">
        <span v-if="print.foot.pair" class="pair"><i aria-hidden="true" />Pairs with {{ print.foot.pair }}</span>
        <span v-else :class="{ mono: print.foot.mono }">{{ print.foot.text }}</span>
        <span
          v-if="print.rating != null"
          class="rating num"
          :aria-label="`Rated ${print.rating.toFixed(1)} out of 5`"
        >
          <NxIcon name="star" :size="12" />{{ print.rating.toFixed(1) }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.nx-print {
  position: relative;
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  min-height: 248px;
  border-radius: 22px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  color: inherit;
  text-decoration: none;
  animation: print-rise 0.5s var(--ease) backwards;
  animation-delay: calc(min(var(--i, 0), 12) * 40ms);
  transition:
    opacity 0.35s var(--ease),
    transform 0.35s var(--ease),
    border-color 0.3s,
    filter 0.35s;
}

.nx-print:hover {
  border-color: var(--line-strong, var(--line));
}

.nx-print:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 3px;
}

.nx-print.hit {
  border-color: color-mix(in srgb, var(--acc) 60%, transparent);
}

.nx-print.dim {
  opacity: 0.28;
  transform: scale(0.985);
  filter: saturate(0.4);
}

@keyframes print-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

/* ── Artwork panel ─────────────────────────────────────── */

.art {
  position: relative;
  overflow: hidden;
  background: var(--bg);
  transition: background 0.6s var(--ease);
}

/* Absolutely placed so the image height resolves against the panel, and no
   z-index or transform here: multiply must blend with the panel colour. */
.art :deep(.nexus-image) {
  position: absolute;
  inset: 0;
  background: transparent;
}

.art :deep(img) {
  transition: transform 0.5s var(--ease);
}

.m-multiply :deep(img),
.m-cutout :deep(img) {
  width: auto;
  max-width: none;
  height: calc(100% - 12px);
}

.m-multiply :deep(img) {
  mix-blend-mode: multiply;
}

.m-cutout :deep(img) {
  height: calc(100% - 28px);
  filter: drop-shadow(0 14px 16px rgb(0 0 0 / 0.35));
}

.m-cover :deep(img) {
  width: 76%;
  height: auto;
  max-height: calc(100% - 36px);
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 18px 30px -12px rgb(0 0 0 / 0.55);
}

.nx-print:hover .art :deep(img) {
  transform: scale(1.04);
}

.nx-print:hover .m-cover :deep(img) {
  transform: translateY(-4px) rotate(-1deg);
}

.fallback {
  position: absolute;
  inset: 0;
  margin: auto;
  color: var(--bg-ink);
  opacity: 0.7;
}

.fav {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--acc);
  background: color-mix(in srgb, var(--amb) 72%, transparent);
  backdrop-filter: blur(8px);
}

.fav :deep(svg) {
  fill: currentColor;
}

/* ── Body ──────────────────────────────────────────────── */

.body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  min-width: 0;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-3);
}

.head-left {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.head .num {
  flex-shrink: 0;
}

.title {
  margin: -4px 0 0;
  font: 400 26px/1.05 var(--font-serif);
  letter-spacing: -0.01em;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.by {
  margin-top: -6px;
  font-size: 13px;
  color: var(--ink-2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mid {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.scale {
  display: grid;
  gap: 5px;
  margin: 0;
  font-size: 12px;
}

.scale div {
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  gap: 8px;
  color: var(--ink-3);
}

.scale dt,
.scale dd {
  margin: 0;
}

.scale i {
  display: block;
  height: 4px;
  border-radius: 4px;
  background: var(--tint-2);
  overflow: hidden;
}

.scale b {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--acc);
  transition: width 0.5s var(--ease);
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: var(--tint);
  font-size: 13px;
  color: var(--ink-2);
}

.pulse {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ink-3);
}

.t-busy .pulse {
  background: var(--acc);
  animation: print-pulse 1.4s ease-in-out infinite;
}

.t-error .pulse {
  background: var(--bad);
}

@keyframes print-pulse {
  50% {
    opacity: 0.25;
    transform: scale(0.7);
  }
}

.progress {
  display: grid;
  gap: 8px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-3);
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.steps i {
  height: 6px;
  border-radius: 6px;
  background: var(--tint-2);
  transition: background 0.4s var(--ease);
}

.steps i.on {
  background: var(--acc);
}

.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.facts div {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  background: var(--tint);
  min-width: 0;
}

.facts dt {
  font-size: 11px;
  color: var(--ink-3);
}

.facts dd {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cooked {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-3);
}

.dots {
  display: inline-flex;
  gap: 4px;
}

.dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--line-strong, var(--line));
}

.dots i.on {
  background: var(--acc);
  border-color: var(--acc);
}

.blurb {
  margin: 0;
  font: italic 17px/1.35 var(--font-serif);
  color: var(--ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--ink-2);
  background: var(--tint);
  border: 1px solid var(--line);
  transition: all 0.25s;
}

.tags li.on {
  color: var(--amb);
  background: var(--acc);
  border-color: var(--acc);
  font-weight: 600;
}

.foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-3);
}

.foot > span:first-child {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mono {
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.pair {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pair i {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--acc);
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: var(--ink-2);
  font-weight: 600;
}

.rating :deep(svg) {
  color: var(--acc);
  fill: currentColor;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .nx-print {
    grid-template-columns: 120px minmax(0, 1fr);
    min-height: 220px;
  }

  .body {
    padding: 14px;
  }

  .title {
    font-size: 22px;
  }

  .mid {
    grid-template-columns: 1fr;
  }

  .mid :deep(.nx-radar) {
    display: none;
  }

  .scale div {
    grid-template-columns: 70px 1fr;
  }

  .facts dd {
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nx-print,
  .t-busy .pulse {
    animation: none;
  }
}
</style>
