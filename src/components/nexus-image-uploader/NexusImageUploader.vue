<script setup lang="ts">
import NxIcon from '@design/components/NxIcon.vue'
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
const deviceFileInput = ref<HTMLInputElement | null>(null)
const cameraFileInput = ref<HTMLInputElement | null>(null)

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

function browseDeviceFiles(): void {
  deviceFileInput.value?.click()
}

function openCameraCapture(): void {
  cameraFileInput.value?.click()
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
              <NxIcon name="upload" :size="28" class="drop-icon" />
              <p class="drop-text">
                Drop an image here or choose from your device.
              </p>
              <input
                ref="deviceFileInput"
                class="file-input"
                type="file"
                accept="image/*"
                :disabled="busy"
                @change="onDeviceSelect"
              />
              <Button
                class="browse-btn"
                label="Browse files"
                severity="secondary"
                rounded
                size="small"
                :disabled="busy"
                @click.stop="browseDeviceFiles"
              >
                <template #icon="{ class: iconClass }">
                  <NxIcon name="folder" :size="16" :class="iconClass" />
                </template>
              </Button>
            </div>
          </TabPanel>

          <TabPanel v-if="isCoarsePointer" value="1">
            <div class="dropzone">
              <NxIcon name="camera" :size="28" class="drop-icon" />
              <p class="drop-text">
                Capture a photo with your camera.
              </p>
              <input
                ref="cameraFileInput"
                class="file-input"
                type="file"
                accept="image/*"
                capture="environment"
                :disabled="busy"
                @change="onDeviceSelect"
              />
              <Button
                class="browse-btn"
                label="Open camera"
                rounded
                size="small"
                :disabled="busy"
                @click.stop="openCameraCapture"
              >
                <template #icon="{ class: iconClass }">
                  <NxIcon name="camera" :size="16" :class="iconClass" />
                </template>
              </Button>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="lookup">
              <InputText
                v-model="unsplashQuery"
                class="lookup-input"
                placeholder="Search Unsplash"
                @keyup.enter="onUnsplashSearch"
              />
              <Button
                aria-label="Search Unsplash"
                severity="secondary"
                :loading="media.unsplashLoading"
                :disabled="busy"
                @click="onUnsplashSearch"
              >
                <template #icon="{ class: iconClass }">
                  <NxIcon name="search" :size="16" :class="iconClass" />
                </template>
              </Button>
            </div>
            <div class="unsplash-quality">
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
            <p class="note">
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
                :aria-label="`Use ${asset.alt_text || asset.public_id}`"
                @click="onVaultPick(asset)"
              >
                <NexusImage :media="asset.media" variant="thumb" size="fill" fit="cover" alt="" />
              </button>
            </div>
            <p
              v-if="!media.listLoading && media.assets.length === 0"
              class="note"
            >
              No vault images yet.
            </p>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ProgressBar
        v-if="busy && progress > 0"
        class="progress"
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
  gap: 8px;
  min-height: 10rem;
  padding: 20px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--r-md);
  text-align: center;
  transition: background-color 0.15s;
}

.dropzone:hover {
  background: var(--tint);
}

.drop-icon {
  color: var(--ink-3);
}

.drop-text {
  margin: 0;
  font-size: 14px;
  color: var(--ink-2);
}

.lookup {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.lookup-input {
  flex: 1;
}

.note {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}

.progress {
  margin-top: 14px;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.browse-btn {
  position: relative;
  z-index: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 8px;
  max-height: 18rem;
  overflow: auto;
}

.grid-item {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: var(--tint);
  cursor: pointer;
}

.grid-item:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 2px;
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
  gap: 12px;
  margin-bottom: 12px;
}

.unsplash-quality__label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--ink-3);
}

.unsplash-quality__select {
  flex: 1;
  min-width: 0;
}
</style>
