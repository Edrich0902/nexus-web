<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NexusImage from '@components/nexus-image/NexusImage.vue'
import { downscaleImageFile } from '@lib/media'
import { useMediaStore } from '@stores/media/media.store'
import type {
  MediaAsset,
  MediaAttachPayload,
  MediaCollection,
  MediaImage,
  UnsplashPhoto,
  UnsplashQuality,
} from '@/types/media/media'

const UNSPLASH_QUALITY_OPTIONS: {
  label: string
  value: UnsplashQuality
}[] = [
  { label: 'Small (~400px)', value: 'small' },
  { label: 'Regular (~1080px)', value: 'regular' },
  { label: 'Full (original)', value: 'full' },
]

const props = withDefaults(
  defineProps<{
    modelValue?: MediaImage | null
    collection?: MediaCollection | string
    attachTo?: MediaAttachPayload | null
    /** Open as dialog when true; inline panel when false */
    dialog?: boolean
    visible?: boolean
    header?: string
  }>(),
  {
    modelValue: null,
    collection: 'vault',
    attachTo: null,
    dialog: true,
    visible: false,
    header: 'Choose image',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: MediaImage | null]
  'update:visible': [value: boolean]
  uploaded: [asset: MediaAsset]
}>()

const media = useMediaStore()
const activeTab = ref('0')
const progress = ref(0)
const busy = ref(false)
const unsplashQuery = ref('')
const unsplashQuality = ref<UnsplashQuality>('regular')
const isCoarsePointer = ref(false)

const open = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      isCoarsePointer.value =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches
      void media.fetchList()
    }
  },
)

async function finish(asset: MediaAsset | null): Promise<void> {
  if (!asset) return
  emit('update:modelValue', asset.media)
  emit('uploaded', asset)
  open.value = false
}

async function onDeviceSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await uploadFile(file)
}

async function onDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  await uploadFile(file)
}

async function uploadFile(file: File): Promise<void> {
  busy.value = true
  progress.value = 0
  try {
    const prepared = await downscaleImageFile(file)
    const asset = await media.upload(prepared, {
      collection: props.collection,
      attach_to: props.attachTo ?? undefined,
      role: 'cover',
      onProgress: (percent) => {
        progress.value = percent
      },
    })
    await finish(asset)
  } finally {
    busy.value = false
    progress.value = 0
  }
}

async function onUnsplashSearch(): Promise<void> {
  const q = unsplashQuery.value.trim()
  if (!q) return
  await media.searchUnsplash(q)
}

async function onUnsplashPick(photo: UnsplashPhoto): Promise<void> {
  busy.value = true
  try {
    const asset = await media.importUnsplash(
      photo,
      props.collection,
      props.attachTo ?? undefined,
      unsplashQuality.value,
    )
    await finish(asset)
  } finally {
    busy.value = false
  }
}

async function onVaultPick(asset: MediaAsset): Promise<void> {
  busy.value = true
  try {
    if (props.attachTo) {
      const image = await media.attachExisting(asset, props.attachTo)
      if (image) {
        emit('update:modelValue', image)
        emit('uploaded', asset)
        open.value = false
      }
    } else {
      emit('update:modelValue', asset.media)
      emit('uploaded', asset)
      open.value = false
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Dialog
    v-if="dialog"
    v-model:visible="open"
    modal
    :header="header"
    :style="{ width: 'min(40rem, 96vw)' }"
    :dismissable-mask="!busy"
  >
    <div class="uploader" :aria-busy="busy">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="0">Device</Tab>
          <Tab v-if="isCoarsePointer" value="1">Camera</Tab>
          <Tab value="2">Unsplash</Tab>
          <Tab value="3">Vault</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div
              class="dropzone"
              @dragover.prevent
              @drop="onDrop"
            >
              <i class="pi pi-cloud-upload text-2xl mb-2" />
              <p class="m-0 text-sm text-surface-300">
                Drop an image here or choose from your device.
              </p>
              <input
                class="file-input"
                type="file"
                accept="image/*"
                :disabled="busy"
                @change="onDeviceSelect"
              />
              <Button
                class="mt-3"
                label="Browse files"
                icon="pi pi-folder-open"
                severity="secondary"
                outlined
                size="small"
                :disabled="busy"
                @click="($event.target as HTMLElement).parentElement?.querySelector('input')?.click()"
              />
            </div>
          </TabPanel>

          <TabPanel v-if="isCoarsePointer" value="1">
            <div class="dropzone">
              <i class="pi pi-camera text-2xl mb-2" />
              <p class="m-0 text-sm text-surface-300">
                Capture a photo with your camera.
              </p>
              <input
                class="file-input"
                type="file"
                accept="image/*"
                capture="environment"
                :disabled="busy"
                @change="onDeviceSelect"
              />
              <Button
                class="mt-3"
                label="Open camera"
                icon="pi pi-camera"
                size="small"
                :disabled="busy"
                @click="($event.target as HTMLElement).parentElement?.querySelector('input')?.click()"
              />
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="flex gap-2 mb-2">
              <InputText
                v-model="unsplashQuery"
                class="flex-1"
                placeholder="Search Unsplash"
                @keyup.enter="onUnsplashSearch"
              />
              <Button
                icon="pi pi-search"
                :loading="media.unsplashLoading"
                :disabled="busy"
                @click="onUnsplashSearch"
              />
            </div>
            <div class="unsplash-quality mb-3">
              <label class="unsplash-quality__label" for="unsplash-quality">
                Import size
              </label>
              <Select
                id="unsplash-quality"
                v-model="unsplashQuality"
                :options="UNSPLASH_QUALITY_OPTIONS"
                option-label="label"
                option-value="value"
                class="unsplash-quality__select"
                :disabled="busy"
              />
            </div>
            <div class="grid">
              <button
                v-for="photo in media.unsplashResults"
                :key="photo.id"
                type="button"
                class="grid-item"
                :disabled="busy"
                @click="onUnsplashPick(photo)"
              >
                <img
                  v-if="photo.urls.small || photo.urls.thumb"
                  :src="(photo.urls.small || photo.urls.thumb)!"
                  :alt="photo.description ?? 'Unsplash photo'"
                />
                <span class="credit">
                  {{ photo.user.name ?? photo.user.username }}
                </span>
              </button>
            </div>
            <p class="m-0 mt-2 text-xs text-surface-500">
              Photos via
              <a href="https://unsplash.com" target="_blank" rel="noreferrer"
                >Unsplash</a
              >. Attribution is stored with the import.
            </p>
          </TabPanel>

          <TabPanel value="3">
            <div class="grid">
              <button
                v-for="asset in media.assets"
                :key="asset.id"
                type="button"
                class="grid-item"
                :disabled="busy"
                @click="onVaultPick(asset)"
              >
                <NexusImage :media="asset.media" variant="thumb" size="fill" fit="cover" />
              </button>
            </div>
            <p
              v-if="!media.listLoading && media.assets.length === 0"
              class="m-0 text-sm text-surface-400"
            >
              No vault images yet.
            </p>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ProgressBar
        v-if="busy && progress > 0"
        class="mt-3"
        :value="progress"
        :show-value="true"
      />
    </div>
  </Dialog>
</template>

<style scoped>
.dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 10rem;
  padding: 1.25rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 0.75rem;
  text-align: center;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.5rem;
  max-height: 18rem;
  overflow: auto;
}

.grid-item {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--p-content-border-color) 35%, transparent);
  cursor: pointer;
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.credit {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.2rem 0.35rem;
  font-size: 0.65rem;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unsplash-quality {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.unsplash-quality__label {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--p-text-muted-color, var(--p-surface-400));
}

.unsplash-quality__select {
  flex: 1;
  min-width: 0;
}
</style>
