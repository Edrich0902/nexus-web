<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import NexusPageWrapper from '@components/nexus-page-wrapper/NexusPageWrapper.vue'
import NexusSpiritIcon from '@components/nexus-spirit-icon/NexusSpiritIcon.vue'
import NexusSpiritCard from '@components/nexus-spirit-card/NexusSpiritCard.vue'
import NexusSkeletonCards from '@components/nexus-skeleton-cards/NexusSkeletonCards.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import { useSpiritsStore } from '@stores/food-drink/spirits.store'
import { useAnalysisStore } from '@stores/analysis/analysis.store'

const spirits = useSpiritsStore()
const analysis = useAnalysisStore()
const router = useRouter()
const showCreate = ref(false)
const filter = ref('')
const form = reactive({
  name: '',
  producer: '',
  category: '',
  age_statement: '',
  abv: null as number | null,
  rating: null as number | null,
  notes: '',
})

onMounted(() => {
  void spirits.loadSpirits()
  void analysis.loadQuota()
})

async function search(): Promise<void> {
  await spirits.loadSpirits(filter.value || undefined)
}

function resetCreateForm(): void {
  form.name = ''
  form.producer = ''
  form.category = ''
  form.age_statement = ''
  form.abv = null
  form.rating = null
  form.notes = ''
}

function openCreate(): void {
  resetCreateForm()
  showCreate.value = true
}

async function submitCreate(): Promise<void> {
  if (!form.name.trim()) return
  const created = await spirits.createSpirit({
    name: form.name.trim(),
    producer: form.producer || null,
    category: form.category || null,
    age_statement: form.age_statement || null,
    abv: form.abv,
    rating: form.rating,
    notes: form.notes || null,
  })
  if (created) {
    showCreate.value = false
    await router.push({ name: 'spirit-detail', params: { spiritId: created.id } })
  }
}
</script>

<template>
  <NexusPageWrapper show-toolbar title="Spirits">
    <template #toolbar>
      <NexusQuotaBadge :quota="analysis.quota" />
      <Button label="Add spirit" icon="pi pi-plus" @click="openCreate" />
    </template>

    <div class="spirits-page">
      <header class="hero">
        <div class="icon-wrap">
          <NexusSpiritIcon :size="28" />
        </div>
        <div>
          <p class="eyebrow">Cellar & Kitchen</p>
          <h2>Spirits journal</h2>
          <p class="muted">
            Log whiskey, gin, rum and more — upload a bottle photo and run AI analysis
            for structured tasting notes.
          </p>
        </div>
      </header>

      <div class="filters">
        <InputText
          v-model="filter"
          placeholder="Filter spirits…"
          class="grow"
          @keyup.enter="search"
        />
        <Button label="Search" icon="pi pi-search" severity="secondary" @click="search" />
      </div>

      <NexusSkeletonCards v-if="spirits.spiritsLoading" :cards="6" />
      <div v-else-if="spirits.spirits.length" class="grid">
        <NexusSpiritCard v-for="item in spirits.spirits" :key="item.id" :spirit="item" />
      </div>
      <p v-else class="empty">No spirits logged yet — add your first bottle.</p>
    </div>

    <Dialog
      v-model:visible="showCreate"
      modal
      header="Log spirit"
      style="width: min(440px, 94vw)"
      @hide="resetCreateForm"
    >
      <div class="form">
        <label>Name</label>
        <InputText v-model="form.name" />
        <label>Distillery / producer</label>
        <InputText v-model="form.producer" />
        <label>Category</label>
        <InputText v-model="form.category" placeholder="whiskey, gin, rum…" />
        <label>Age statement</label>
        <InputText v-model="form.age_statement" />
        <label>ABV</label>
        <InputNumber v-model="form.abv" :min-fraction-digits="0" :max-fraction-digits="1" />
        <label>Rating</label>
        <NexusRatingInput v-model="form.rating" />
        <label>Notes</label>
        <Textarea v-model="form.notes" rows="3" auto-resize />
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showCreate = false" />
        <Button
          label="Save"
          :loading="spirits.saving"
          :disabled="!form.name.trim()"
          @click="submitCreate"
        />
      </template>
    </Dialog>
  </NexusPageWrapper>
</template>

<style scoped>
.spirits-page {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.hero {
  display: flex;
  gap: 0.9rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: var(--spirit-card-surface);
}

.icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--spirit-accent) 22%, transparent);
  color: var(--spirit-accent);
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.65;
}

h2 {
  margin: 0.15rem 0;
}

.muted {
  margin: 0;
  opacity: 0.7;
  font-size: 0.92rem;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.grow {
  flex: 1;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: 1rem;
}

.empty {
  opacity: 0.7;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form label {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.35rem;
}
</style>
