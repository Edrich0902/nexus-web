<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import DetailTemplate from '@design/templates/DetailTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPanel from '@design/components/NxPanel.vue'
import NxFacts from '@design/components/NxFacts.vue'
import NxRating from '@design/components/NxRating.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import { usePaletteAmbient } from '@design/usePaletteAmbient'
import type { Ambient } from '@design/tokens'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import NexusDrinkAnalysisPanel from '@components/nexus-drink-analysis-panel/NexusDrinkAnalysisPanel.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import { mediaDeliveryUrl } from '@lib/media'
import type { AnalysisQuota, AnalysisStatus, DrinkAnalysis } from '@/types/analysis/drink-analysis'
import type { MediaAttachPayload, MediaImage } from '@/types/media/media'

/**
 * Shared page for a bottle or can (wine, beer, spirit): label artwork tints
 * the ambient, the serif stage carries the name, AI tasting notes fill the
 * main column and the facts / notes sit in the aside.
 */
const props = withDefaults(
  defineProps<{
    state: ViewState
    backTo: RouteLocationRaw
    backLabel: string
    /** Singular noun used in labels: "wine", "beer", "spirit". */
    noun: string
    eyebrow?: string
    title?: string
    accent?: string
    lede?: string
    media?: MediaImage | null
    imageUrl?: string | null
    rating?: number | null
    facts?: { label: string; value: string | number | null | undefined }[]
    notes?: string | null
    status?: AnalysisStatus | null
    analysis?: DrinkAnalysis | null
    analysisError?: string | null
    analysing?: boolean
    quota?: AnalysisQuota | null
    uploadCollection: string
    attachTo?: MediaAttachPayload | null
    fallbackAmbient?: Partial<Ambient> | null
  }>(),
  {
    eyebrow: undefined,
    title: undefined,
    accent: undefined,
    lede: undefined,
    media: null,
    imageUrl: null,
    rating: null,
    facts: () => [],
    notes: null,
    status: null,
    analysis: null,
    analysisError: null,
    analysing: false,
    quota: null,
    attachTo: null,
    fallbackAmbient: null,
  },
)

const emit = defineEmits<{
  analyse: [force?: boolean]
  remove: []
  image: [image: MediaImage]
}>()

const confirm = useConfirm()
const showUploader = ref(false)

const hasArt = computed(() => Boolean(props.media || props.imageUrl))

usePaletteAmbient(
  () => mediaDeliveryUrl(props.media, 'thumb') ?? props.imageUrl,
  () => props.fallbackAmbient,
)

function askRemove(event: MouseEvent): void {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Delete this ${props.noun}? Tastings and notes go with it.`,
    acceptLabel: 'Delete',
    rejectLabel: 'Keep',
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', text: true, size: 'small' },
    accept: () => emit('remove'),
  })
}

function onUploaded(image: MediaImage | null): void {
  if (image) emit('image', image)
}
</script>

<template>
  <DetailTemplate :state="state" :back-to="backTo" :back-label="backLabel" :error-title="`This ${noun} could not be loaded`">
    <template #stage>
      <NxStage :eyebrow="eyebrow" :title="title" :accent="accent" :lede="lede">
        <template #visual>
          <NexusImage
            v-if="hasArt"
            :media="media"
            :src="imageUrl"
            :alt="title ?? ''"
            variant="hero"
            size="fill"
            fit="cover"
            previewable
          />
          <button v-else type="button" class="add-art" @click="showUploader = true">
            <NxIcon name="image" :size="26" />
            <span>Add a label photo</span>
          </button>
        </template>
        <template v-if="lede || $slots.lede" #lede>
          <span v-if="lede">{{ lede }}</span>
          <slot name="lede" />
        </template>
        <template #actions>
          <slot name="actions" />
          <Button rounded severity="secondary" :label="hasArt ? 'Label photo' : 'Add photo'" @click="showUploader = true">
            <template #icon="{ class: iconClass }">
              <NxIcon name="image" :size="16" :class="iconClass" />
            </template>
          </Button>
          <NxIconButton icon="trash" :label="`Delete ${noun}`" variant="tint" @click="askRemove" />
        </template>
      </NxStage>
      <NexusImageUploader
        v-model:visible="showUploader"
        :model-value="media ?? null"
        :collection="uploadCollection"
        :attach-to="attachTo"
        :header="`${title ?? noun} · label photo`"
        @update:model-value="onUploaded"
      />
    </template>

    <NexusDrinkAnalysisPanel
      :status="status"
      :analysis="analysis"
      :error="analysisError"
      :analysing="analysing"
      @analyse="(force) => emit('analyse', force)"
    />

    <slot />

    <template #aside>
      <NxPanel title="At a glance">
        <div class="glance">
          <NxRating :value="rating" size="lg" />
          <NxFacts :items="facts" :cols="2" />
        </div>
      </NxPanel>
      <NxPanel v-if="notes" title="Your notes">
        <p class="notes">{{ notes }}</p>
      </NxPanel>
      <slot name="aside" />
      <div v-if="quota" class="quota">
        <NexusQuotaBadge :quota="quota" />
      </div>
    </template>
  </DetailTemplate>
</template>

<style scoped>
.add-art {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed var(--line-strong);
  border-radius: inherit;
  background: transparent;
  color: var(--ink-3);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.add-art:hover {
  color: var(--ink);
  border-color: var(--acc);
}

.add-art :deep(svg) {
  color: var(--acc);
}

.glance {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.notes {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink-2);
  white-space: pre-line;
}

.quota {
  display: flex;
  justify-content: flex-end;
}
</style>
