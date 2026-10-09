<script setup lang="ts">
/**
 * The editorial headline at the top of a page: artwork, eyebrow, a serif title
 * with an optional italic accent word, a lede and pill actions.
 */
withDefaults(
  defineProps<{
    eyebrow?: string
    /** Pulsing dot before the eyebrow (something is live / playing). */
    live?: boolean
    title?: string
    /** Italic, accent-coloured tail of the title. */
    accent?: string
    lede?: string
    /** 0–1 progress rail under the lede (track position, reading progress). */
    progress?: number | null
    /** `compact` drops the artwork column and shrinks the title. */
    size?: 'hero' | 'compact'
  }>(),
  {
    eyebrow: undefined,
    live: false,
    title: undefined,
    accent: undefined,
    lede: undefined,
    progress: null,
    size: 'hero',
  },
)
</script>

<template>
  <header class="nx-stage nx-rise" :class="[`size-${size}`, { 'has-visual': $slots.visual }]">
    <div v-if="$slots.visual" class="visual">
      <slot name="visual" />
    </div>
    <div class="copy">
      <div v-if="eyebrow || $slots.eyebrow" class="nx-eyebrow eyebrow">
        <span v-if="live" class="live" aria-hidden="true" />
        <slot name="eyebrow">{{ eyebrow }}</slot>
      </div>
      <h1 class="title">
        <slot name="title">
          {{ title }}<template v-if="accent">{{ ' ' }}<em>{{ accent }}</em></template>
        </slot>
      </h1>
      <div v-if="lede || $slots.lede" class="lede">
        <slot name="lede">{{ lede }}</slot>
      </div>
      <div
        v-if="progress !== null && progress !== undefined"
        class="bar"
        role="progressbar"
        :aria-valuenow="Math.round(progress * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <i :style="{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }" />
      </div>
      <div v-if="$slots.actions" class="actions">
        <slot name="actions" />
      </div>
      <slot />
    </div>
  </header>
</template>

<style scoped>
.nx-stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 56px;
  align-items: center;
  padding: 24px 0 8px;
}

.nx-stage.has-visual.size-hero {
  grid-template-columns: 300px 1fr;
}

.nx-stage.has-visual.size-compact {
  grid-template-columns: 160px 1fr;
  gap: 32px;
}

.visual {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--r-lg);
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--amb-2);
}

.visual :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.copy {
  min-width: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--acc);
  animation: nx-pulse 1.6s infinite;
}

.title {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(48px, 6.4vw, 88px);
  line-height: 0.98;
  letter-spacing: -0.02em;
  margin: 12px 0 14px;
  overflow-wrap: anywhere;
}

.size-compact .title {
  font-size: clamp(40px, 4.6vw, 64px);
}

.title :deep(em) {
  color: var(--acc);
}

.lede {
  font-size: 17px;
  color: var(--ink-2);
  max-width: 56ch;
}

.bar {
  margin-top: 24px;
  height: 3px;
  border-radius: 3px;
  background: var(--line);
  max-width: 520px;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: var(--ink);
  transition: width 0.6s var(--ease);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 960px) {
  .nx-stage.has-visual.size-hero {
    grid-template-columns: 200px 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .nx-stage,
  .nx-stage.has-visual.size-hero,
  .nx-stage.has-visual.size-compact {
    grid-template-columns: 1fr;
    gap: 20px;
    padding-top: 12px;
  }

  .visual {
    width: 132px;
  }

  .title {
    font-size: clamp(38px, 11vw, 48px);
  }

  .size-compact .title {
    font-size: clamp(34px, 10vw, 40px);
  }

  .lede {
    font-size: 15.5px;
  }
}
</style>
