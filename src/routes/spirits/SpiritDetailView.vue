<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import NexusRatingDisplay from '@components/nexus-rating-display/NexusRatingDisplay.vue'
import NexusSkeletonMedia from '@components/nexus-skeleton-media/NexusSkeletonMedia.vue'
import NexusDrinkAnalysisPanel from '@components/nexus-drink-analysis-panel/NexusDrinkAnalysisPanel.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import { useSpiritsStore } from '@stores/food-drink/spirits.store'
import { useAnalysisStore } from '@stores/analysis/analysis.store'
import type { MediaImage } from '@/types/media/media'

const spirits = useSpiritsStore()
const analysis = useAnalysisStore()
const route = useRoute()
const router = useRouter()
const spiritId = computed(() => Number(route.params.spiritId))
const showImageUploader = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPoll(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPollIfPending(): void {
  stopPoll()
  if (spirits.spirit?.analysis_status !== 'pending') return
  pollTimer = setInterval(() => {
    void spirits.loadSpirit(spiritId.value, { silent: true }).then(() => {
      if (spirits.spirit?.analysis_status !== 'pending') stopPoll()
    })
  }, 2500)
}

async function load(): Promise<void> {
  if (!Number.isFinite(spiritId.value)) return
  await Promise.all([spirits.loadSpirit(spiritId.value), analysis.loadQuota()])
  startPollIfPending()
}

onMounted(load)
onUnmounted(stopPoll)
watch(spiritId, load)

async function onAnalyse(force?: boolean): Promise<void> {
  await spirits.analyseSpirit(spiritId.value, Boolean(force))
  await analysis.loadQuota()
  startPollIfPending()
}

async function remove(): Promise<void> {
  if (await spirits.removeSpirit(spiritId.value)) {
    await router.push({ name: 'spirits' })
  }
}

function onImageUploaded(image: MediaImage | null): void {
  if (!spirits.spirit || !image) return
  spirits.spirit.media = image
  spirits.spirit.image_url = image.url
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Spirit detail">
    <template #toolbar>
      <NexusQuotaBadge :quota="analysis.quota" />
      <Button label="Back" icon="pi pi-arrow-left" text @click="router.push({ name: 'spirits' })" />
    </template>

    <NexusSkeletonMedia v-if="spirits.spiritLoading" />
    <div v-else-if="spirits.spirit" class="detail">
      <header class="hero">
        <div class="hero-media">
          <NexusImage
            :media="spirits.spirit.media"
            :src="spirits.spirit.image_url"
            :alt="spirits.spirit.name"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
        </div>
        <div class="hero-body">
          <div class="hero-info">
            <p class="eyebrow">{{ spirits.spirit.category || 'Spirit' }}</p>
            <h2>{{ spirits.spirit.name }}</h2>
            <p class="meta">
              <span v-if="spirits.spirit.producer">{{ spirits.spirit.producer }}</span>
              <span v-if="spirits.spirit.age_statement"> · {{ spirits.spirit.age_statement }}</span>
              <span v-if="spirits.spirit.abv != null"> · {{ spirits.spirit.abv }}% ABV</span>
            </p>
            <NexusRatingDisplay
              :model-value="spirits.spirit.rating"
              accent="var(--spirit-accent, #c47a3a)"
            />
          </div>
          <div class="hero-actions">
            <Button
              icon="pi pi-image"
              severity="secondary"
              text
              rounded
              v-tooltip.left="'Label photo'"
              @click="showImageUploader = true"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              v-tooltip.left="'Delete'"
              @click="remove"
            />
          </div>
        </div>
      </header>

      <NexusDrinkAnalysisPanel
        :status="spirits.spirit.analysis_status"
        :analysis="spirits.spirit.ai_analysis"
        :error="spirits.spirit.analysis_error"
        :analysing="spirits.analysing"
        @analyse="onAnalyse"
      />

      <section v-if="spirits.spirit.notes" class="panel">
        <h3>Notes</h3>
        <p>{{ spirits.spirit.notes }}</p>
      </section>
    </div>

    <NexusImageUploader
      v-if="spirits.spirit"
      v-model:visible="showImageUploader"
      :model-value="spirits.spirit.media ?? null"
      collection="spirits"
      :attach-to="{ type: 'spirit_spirit', id: spirits.spirit.id }"
      header="Bottle label photo"
      @update:model-value="onImageUploaded"
    />
  </NexusPageWrapper>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  gap: 1.35rem;
  padding: 1.15rem;
  border-radius: 1.1rem;
  background: var(--spirit-card-surface);
  align-items: stretch;
}

.hero-media {
  min-height: 18rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--spirit-accent) 18%, transparent);
}

.hero-media :deep(.nexus-image) {
  width: 100%;
  height: 100%;
  min-height: 18rem;
}

.hero-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.65;
}

h2 {
  margin: 0.2rem 0;
  font-size: clamp(1.55rem, 2.6vw, 2rem);
}

.meta {
  margin: 0;
  opacity: 0.72;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.panel {
  padding: 1rem 1.1rem;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--coffee-bean-panel) 90%, transparent);
}

@media (max-width: 720px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: row;
  }
}
</style>
