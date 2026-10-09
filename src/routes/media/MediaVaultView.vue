<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxPillGroup from '@design/components/NxPillGroup.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NxIconButton from '@design/components/NxIconButton.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import NexusImageUploader from '@components/nexus-image-uploader/NexusImageUploader.vue'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import type { CollectionField } from '@routes/collections/collectionFields'
import { plural } from '@routes/collections/collectionFields'
import { relativeTime } from '@lib/datetime'
import { useMediaStore } from '@stores/media/media.store'
import type { MediaAsset, MediaUsageMeter } from '@/types/media/media'

const media = useMediaStore()
const uploaderOpen = ref(false)

const collection = ref<string | null>(null)
const source = ref<string | null>(null)
const attached = ref<'all' | 'attached' | 'orphan'>('all')
const q = ref('')
const loaded = ref(false)

const collectionOptions = [
  { label: 'Every collection', value: null },
  { label: 'Avatar', value: 'avatar' },
  { label: 'Cellar', value: 'cellar' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Beer', value: 'beer' },
  { label: 'Library', value: 'library' },
  { label: 'Vault', value: 'vault' },
  { label: 'Mirror', value: 'mirror' },
]

const sourceOptions = [
  { label: 'Any source', value: null },
  { label: 'Upload', value: 'upload' },
  { label: 'Unsplash', value: 'unsplash' },
  { label: 'Mirror', value: 'mirror' },
]

const attachedOptions = [
  { value: 'all' as const, label: 'All' },
  { value: 'attached' as const, label: 'In use' },
  { value: 'orphan' as const, label: 'Orphans' },
]

onMounted(async () => {
  await Promise.all([media.fetchList(), media.fetchUsage()])
  loaded.value = true
})

async function load(page = 1): Promise<void> {
  media.setListParams({
    collection: collection.value ?? undefined,
    source: source.value ?? undefined,
    attached: attached.value === 'all' ? undefined : attached.value,
    q: q.value.trim() || undefined,
    page,
  })
  await media.fetchList()
}

watch([collection, source, attached], () => void load())

const filtered = computed(
  () => Boolean(collection.value || source.value || attached.value !== 'all' || q.value.trim()),
)

const state = computed<ViewState>(() => {
  if (!loaded.value && media.listLoading) return 'loading'
  return media.assets.length || filtered.value ? 'ready' : 'empty'
})

const page = computed(() => media.listMeta?.current_page ?? 1)
const lastPage = computed(() => media.listMeta?.last_page ?? 1)
const total = computed(() => media.listMeta?.total ?? media.assets.length)

/* ── Usage ──────────────────────────────────────────────── */

const usage = computed(() => media.usage)
const originals = computed(() => usage.value?.resources ?? 0)
const derived = computed(() => usage.value?.derived_resources ?? 0)
const creditLimit = computed(() => usage.value?.credits.limit ?? null)

function bytesLabel(bytes: number | undefined | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

/** Share of the monthly credit allowance a meter is consuming. */
function creditShare(meter: MediaUsageMeter | undefined): number | null {
  if (!meter?.credits_usage || !creditLimit.value) return null
  return meter.credits_usage / creditLimit.value
}

const eyebrow = computed(() => {
  const parts = ['Media vault']
  if (usage.value?.plan) parts.push(`Cloudinary ${usage.value.plan}`)
  if (usage.value?.fetched_at) parts.push(`checked ${relativeTime(usage.value.fetched_at)}`)
  return parts.join(' · ')
})

const lede = computed(() => {
  if (!usage.value) return 'Every image across Nexus — uploads, Unsplash picks and mirrored covers.'
  const variants = derived.value ? ` and ${plural(derived.value, 'resized variant')}` : ''
  return `${plural(originals.value, 'original')}${variants} on Cloudinary. Totals update on Cloudinary's delay, so recent changes can take a while to show.`
})

const fields = computed<CollectionField[]>(() => {
  const u = usage.value
  if (!u) return []
  const used = Number(u.credits.usage ?? 0)
  return [
    {
      key: 'credits',
      label: 'Credits used',
      value: used.toFixed(used < 10 ? 2 : 1),
      sub: creditLimit.value != null ? `of ${creditLimit.value} this month` : undefined,
      progress: u.credits.used_percent != null ? u.credits.used_percent / 100 : null,
      variant: 'solid',
      span: 3,
    },
    {
      key: 'storage',
      label: 'Storage',
      value: bytesLabel(u.storage.usage),
      progress: creditShare(u.storage),
      variant: 'tint',
      span: 3,
    },
    {
      key: 'bandwidth',
      label: 'Bandwidth',
      value: bytesLabel(u.bandwidth.usage),
      progress: creditShare(u.bandwidth),
      variant: 'tint',
      span: 3,
    },
    {
      key: 'transforms',
      label: 'Transformations',
      value: u.transformations.usage.toLocaleString(),
      progress: creditShare(u.transformations),
      variant: 'outline',
      span: 3,
    },
  ]
})

/* ── Delete ─────────────────────────────────────────────── */

const selected = ref<MediaAsset | null>(null)
const confirmDelete = ref(false)
const forceDelete = ref(false)
const deleting = ref(false)

function askDelete(asset: MediaAsset): void {
  selected.value = asset
  forceDelete.value = false
  confirmDelete.value = true
}

async function confirmDeleteAction(): Promise<void> {
  if (!selected.value) return
  deleting.value = true
  const result = await media.remove(selected.value.id, forceDelete.value)
  deleting.value = false
  if (result === 'conflict') {
    forceDelete.value = true
    return
  }
  confirmDelete.value = false
  selected.value = null
}

function isOrphan(asset: MediaAsset): boolean {
  return asset.attachments_count === 0
}
</script>

<template>
  <IndexTemplate
    :state="state"
    empty-title="The vault is empty"
    empty-body="Upload from your device or pick a photo from Unsplash to get started."
  >
    <template #stage>
      <NxStage size="compact" :eyebrow="eyebrow" :title="(usage ? originals : total).toLocaleString()" :accent="(usage ? originals : total) === 1 ? 'image' : 'images'" :lede="lede">
        <template #actions>
          <Button rounded severity="contrast" label="Upload" @click="uploaderOpen = true">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
          <Button rounded severity="secondary" label="Tidy orphans" @click="media.reconcile()" />
          <NxIconButton
            icon="refresh"
            label="Refresh usage"
            :disabled="media.usageLoading"
            @click="media.fetchUsage(true)"
          />
        </template>
      </NxStage>
    </template>

    <template v-if="usage" #fields>
      <CollectionFields section="media" :fields="fields" />
    </template>

    <template #toolbar>
      <NxPillGroup v-model="attached" :options="attachedOptions" label="Usage filter" size="sm" />
      <Select
        v-model="collection"
        :options="collectionOptions"
        option-label="label"
        option-value="value"
        aria-label="Collection"
        size="small"
        class="pick"
      />
      <Select
        v-model="source"
        :options="sourceOptions"
        option-label="label"
        option-value="value"
        aria-label="Source"
        size="small"
        class="pick"
      />
      <NxSearchField v-model="q" class="search" placeholder="Search public id or alt text…" :debounce="400" @search="load()" />
    </template>

    <template #empty>
      <NxEmptyState
        title="The vault is empty"
        body="Upload from your device or pick a photo from Unsplash to get started."
        icon="image"
      >
        <Button rounded label="Upload an image" @click="uploaderOpen = true" />
      </NxEmptyState>
    </template>

    <NxEmptyState
      v-if="!media.assets.length && !media.listLoading"
      title="Nothing matches"
      body="Try another collection, source or search."
      icon="search"
    />
    <template v-else>
      <p class="count">{{ plural(total, 'image') }}</p>
      <div class="vault" :class="{ dim: media.listLoading }">
        <figure v-for="asset in media.assets" :key="asset.id" class="tile">
          <NexusImage
            :media="asset.media"
            variant="card"
            size="fill"
            fit="cover"
            :alt="asset.alt_text ?? asset.public_id"
            previewable
          />
          <figcaption>
            <span class="coll">{{ asset.collection }}</span>
            <span>{{ asset.source }} · {{ bytesLabel(asset.bytes) }}</span>
          </figcaption>
          <span v-if="isOrphan(asset)" class="orphan">Orphan</span>
          <NxIconButton
            icon="trash"
            size="sm"
            variant="ink"
            label="Delete image"
            :tooltip="false"
            class="del"
            @click="askDelete(asset)"
          />
        </figure>
      </div>

      <nav v-if="lastPage > 1" class="pager" aria-label="Pages">
        <NxIconButton icon="chevron-left" label="Previous page" :disabled="page <= 1 || media.listLoading" @click="load(page - 1)" />
        <span>Page {{ page }} of {{ lastPage }}</span>
        <NxIconButton
          icon="chevron-right"
          label="Next page"
          :disabled="page >= lastPage || media.listLoading"
          @click="load(page + 1)"
        />
      </nav>
    </template>
  </IndexTemplate>

  <NexusImageUploader v-model:visible="uploaderOpen" collection="vault" header="Upload to the vault" @uploaded="load(page)" />

  <Dialog v-model:visible="confirmDelete" modal header="Delete image" style="width: min(440px, 94vw)">
    <p class="confirm">
      <template v-if="forceDelete">
        This image is still in use. Deleting it anyway detaches it from every record and removes it from Cloudinary.
      </template>
      <template v-else>
        Delete <code>{{ selected?.public_id }}</code> from Cloudinary and the vault?
      </template>
    </p>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="confirmDelete = false" />
      <Button
        rounded
        severity="danger"
        :label="forceDelete ? 'Delete anyway' : 'Delete'"
        :loading="deleting"
        @click="confirmDeleteAction"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.pick {
  min-width: 150px;
}

.search {
  flex: 1;
  min-width: min(100%, 240px);
}

.count {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--ink-3);
}

.vault {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 12px;
  transition: opacity 0.2s;
}

.dim {
  opacity: 0.55;
}

.tile {
  position: relative;
  margin: 0;
  aspect-ratio: 1;
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--tint);
}

.tile :deep(.nexus-image) {
  width: 100%;
  height: 100%;
}

figcaption {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 28px 10px 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  pointer-events: none;
}

.coll {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}

.orphan {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #1a1206;
  background: var(--warn);
  pointer-events: none;
}

.del {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}

.tile:hover .del,
.del:focus-visible {
  opacity: 1;
}

@media (hover: none) {
  .del {
    opacity: 1;
  }
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
  font-size: 13px;
  color: var(--ink-3);
}

.confirm {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2);
}

.confirm code {
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .vault {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .pick {
    flex: 1;
    min-width: 0;
  }
}
</style>
