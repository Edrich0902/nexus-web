<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import { formatDateTime } from '@lib/datetime'
import { useMediaStore } from '@stores/media/media.store'
import type { MediaAsset } from '@/types/media/media'

const media = useMediaStore()
const uploaderOpen = ref(false)
const selected = ref<MediaAsset | null>(null)
const confirmDelete = ref(false)
const forceDelete = ref(false)

const collection = ref<string | undefined>(undefined)
const source = ref<string | undefined>(undefined)
const attached = ref<string | undefined>(undefined)
const q = ref('')

const collectionOptions = [
  { label: 'All collections', value: undefined },
  { label: 'Avatar', value: 'avatar' },
  { label: 'Cellar', value: 'cellar' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Beer', value: 'beer' },
  { label: 'Vault', value: 'vault' },
  { label: 'Mirror', value: 'mirror' },
]

const sourceOptions = [
  { label: 'All sources', value: undefined },
  { label: 'Upload', value: 'upload' },
  { label: 'Unsplash', value: 'unsplash' },
  { label: 'Mirror', value: 'mirror' },
]

const attachedOptions = [
  { label: 'All', value: undefined },
  { label: 'Attached', value: 'attached' },
  { label: 'Orphans', value: 'orphan' },
]

const originals = computed(() => media.usage?.resources ?? 0)
const derived = computed(() => media.usage?.derived_resources ?? 0)
const totalAssets = computed(() => {
  const objects = media.usage?.objects
  if (typeof objects === 'number') return objects
  return originals.value + derived.value
})

const creditsLabel = computed(() => {
  const credits = media.usage?.credits
  if (!credits) return '—'
  const used = Number(credits.usage ?? 0)
  if (credits.limit != null) {
    return `${used.toFixed(used < 10 ? 2 : 1)} of ${credits.limit}`
  }
  return used.toFixed(2)
})

const usageFootnote = computed(() => {
  const parts: string[] = []
  if (media.usage?.plan) parts.push(`${media.usage.plan} plan`)
  if (media.usage?.fetched_at) {
    parts.push(`Checked ${formatDateTime(media.usage.fetched_at)}`)
  }
  if (media.usage?.last_updated) {
    parts.push(`Cloudinary last updated ${media.usage.last_updated}`)
  }
  return parts.join(' · ')
})

onMounted(async () => {
  await Promise.all([media.fetchList(), media.fetchUsage()])
})

async function applyFilters(): Promise<void> {
  media.setListParams({
    collection: collection.value,
    source: source.value,
    attached: attached.value,
    q: q.value.trim() || undefined,
    page: 1,
  })
  await media.fetchList()
}

function bytesLabel(bytes: number | undefined | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function creditPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

async function onDelete(asset: MediaAsset): Promise<void> {
  selected.value = asset
  forceDelete.value = false
  confirmDelete.value = true
}

async function confirmDeleteAction(): Promise<void> {
  if (!selected.value) return
  const result = await media.remove(selected.value.id, forceDelete.value)
  if (result === 'conflict') {
    forceDelete.value = true
    return
  }
  confirmDelete.value = false
  selected.value = null
  forceDelete.value = false
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Media vault">
    <template #toolbar>
      <Button
        label="Upload"
        icon="pi pi-upload"
        size="small"
        @click="uploaderOpen = true"
      />
    </template>

    <section v-if="media.usage" class="usage-panel">
      <header class="usage-panel__intro">
        <div>
          <p class="usage-panel__eyebrow">Cloudinary usage</p>
          <h2 class="usage-panel__title">
            {{ totalAssets }}
            {{ plural(totalAssets, 'asset', 'assets') }} in the cloud
          </h2>
          <p class="usage-panel__summary">
            {{ originals }}
            {{ plural(originals, 'upload', 'uploads') }}
            <template v-if="derived > 0">
              · {{ derived }}
              {{ plural(derived, 'resized variant', 'resized variants') }}
            </template>
          </p>
        </div>
        <div class="usage-panel__actions">
          <Tag
            v-if="media.usage.plan"
            :value="media.usage.plan"
            severity="secondary"
            rounded
          />
          <Button
            v-tooltip.top="'Refresh usage'"
            icon="pi pi-refresh"
            severity="secondary"
            text
            rounded
            aria-label="Refresh usage"
            :loading="media.usageLoading"
            @click="media.fetchUsage(true)"
          />
          <Button
            v-tooltip.top="'Reconcile orphans'"
            icon="pi pi-sync"
            severity="secondary"
            text
            rounded
            aria-label="Reconcile orphans"
            @click="media.reconcile()"
          />
        </div>
      </header>

      <div class="usage">
        <div class="meter">
          <div class="meter-head">
            <span>Credits used</span>
            <span>{{ creditsLabel }}</span>
          </div>
          <ProgressBar
            :value="creditPercent(media.usage.credits.used_percent)"
            :show-value="false"
          />
        </div>
        <div class="meter">
          <div class="meter-head">
            <span>Storage</span>
            <span>{{ bytesLabel(media.usage.storage.usage) }}</span>
          </div>
          <ProgressBar
            :value="creditPercent((media.usage.storage.credits_usage ?? 0) * 4)"
            :show-value="false"
          />
        </div>
        <div class="meter">
          <div class="meter-head">
            <span>Bandwidth</span>
            <span>{{ bytesLabel(media.usage.bandwidth.usage) }}</span>
          </div>
          <ProgressBar
            :value="creditPercent((media.usage.bandwidth.credits_usage ?? 0) * 4)"
            :show-value="false"
          />
        </div>
        <div class="meter">
          <div class="meter-head">
            <span>Image transforms</span>
            <span>{{ media.usage.transformations.usage }}</span>
          </div>
          <ProgressBar
            :value="
              creditPercent((media.usage.transformations.credits_usage ?? 0) * 4)
            "
            :show-value="false"
          />
        </div>
      </div>

      <p class="usage-panel__note">
        Cloudinary updates these totals on a delay — deletes and uploads may take
        a while to appear here.
      </p>
      <p v-if="usageFootnote" class="usage-panel__meta">{{ usageFootnote }}</p>
    </section>

    <section class="filters flex flex-wrap gap-2 mb-4">
      <Select
        v-model="collection"
        :options="collectionOptions"
        option-label="label"
        option-value="value"
        placeholder="Collection"
        class="min-w-40"
        @change="applyFilters"
      />
      <Select
        v-model="source"
        :options="sourceOptions"
        option-label="label"
        option-value="value"
        placeholder="Source"
        class="min-w-36"
        @change="applyFilters"
      />
      <Select
        v-model="attached"
        :options="attachedOptions"
        option-label="label"
        option-value="value"
        placeholder="Attached"
        class="min-w-36"
        @change="applyFilters"
      />
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="q"
          placeholder="Search public id / alt"
          @keyup.enter="applyFilters"
        />
      </IconField>
      <Button
        label="Search"
        icon="pi pi-search"
        severity="secondary"
        outlined
        @click="applyFilters"
      />
    </section>

    <div v-if="media.listLoading" class="text-surface-400 text-sm">Loading…</div>

    <div v-else class="vault-grid">
      <article v-for="asset in media.assets" :key="asset.id" class="tile">
        <NexusImage
          :media="asset.media"
          variant="card"
          size="fill"
          fit="cover"
          :alt="asset.alt_text ?? asset.public_id"
          previewable
        />
        <div class="tile-meta">
          <span class="collection">{{ asset.collection }}</span>
          <span class="source">{{ asset.source }}</span>
          <span class="bytes">{{ bytesLabel(asset.bytes) }}</span>
        </div>
        <div class="tile-actions">
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            aria-label="Delete"
            @click="onDelete(asset)"
          />
        </div>
      </article>
    </div>

    <p
      v-if="!media.listLoading && media.assets.length === 0"
      class="m-0 text-surface-400"
    >
      No media yet. Upload from device or Unsplash to get started.
    </p>

    <NexusImageUploader
      v-model:visible="uploaderOpen"
      collection="vault"
      header="Upload to vault"
      @uploaded="media.fetchList()"
    />

    <Dialog
      v-model:visible="confirmDelete"
      modal
      header="Delete media"
      :style="{ width: 'min(28rem, 94vw)' }"
    >
      <p class="m-0 mb-3 text-sm">
        <template v-if="forceDelete">
          This asset is still attached. Force delete will detach it from all
          records and remove it from Cloudinary.
        </template>
        <template v-else>
          Delete
          <strong>{{ selected?.public_id }}</strong>
          from Cloudinary and the vault?
        </template>
      </p>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="confirmDelete = false"
        />
        <Button
          :label="forceDelete ? 'Force delete' : 'Delete'"
          severity="danger"
          @click="confirmDeleteAction"
        />
      </div>
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.usage-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
  padding: 1rem 1.1rem;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--p-content-border-color) 22%, transparent);
}

.usage-panel__intro {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.usage-panel__actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.usage-panel__eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.usage-panel__title {
  margin: 0.2rem 0 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.usage-panel__summary {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.usage-panel__note,
.usage-panel__meta {
  margin: 0;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.usage-panel__note {
  opacity: 0.9;
}

.usage {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.85rem;
}

.meter {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--p-content-border-color) 28%, transparent);
}

.meter-head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.vault-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.75rem;
}

.tile {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--p-content-border-color) 35%, transparent);
}

.tile :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

.tile-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.4rem;
  font-size: 0.65rem;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  pointer-events: none;
}

.tile-actions {
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  z-index: 2;
}
</style>
