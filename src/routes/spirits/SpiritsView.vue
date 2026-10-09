<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import IndexTemplate from '@design/templates/IndexTemplate.vue'
import type { ViewState } from '@design/templates/types'
import NxStage from '@design/components/NxStage.vue'
import NxCoverGrid from '@design/components/NxCoverGrid.vue'
import NxCoverCard from '@design/components/NxCoverCard.vue'
import NxSearchField from '@design/components/NxSearchField.vue'
import NxEmptyState from '@design/components/NxEmptyState.vue'
import NxIcon from '@design/components/NxIcon.vue'
import NexusQuotaBadge from '@components/nexus-quota-badge/NexusQuotaBadge.vue'
import NexusRatingInput from '@components/nexus-rating-input/NexusRatingInput.vue'
import { useSpiritsStore } from '@stores/food-drink/spirits.store'
import { useAnalysisStore } from '@stores/analysis/analysis.store'
import CollectionFields from '@routes/collections/CollectionFields.vue'
import { drinkFields } from '@routes/collections/collectionFields'

const spirits = useSpiritsStore()
const analysis = useAnalysisStore()
const router = useRouter()

const query = ref('')
const searched = ref('')

onMounted(() => {
  void spirits.loadSpirits()
  void analysis.loadQuota()
})

async function search(q: string): Promise<void> {
  searched.value = q
  await spirits.loadSpirits(q || undefined)
}

const state = computed<ViewState>(() => {
  if (spirits.spiritsLoading && !spirits.spirits.length) return 'loading'
  return spirits.spirits.length ? 'ready' : 'empty'
})

const fields = computed(() =>
  drinkFields({
    items: spirits.spirits,
    total: spirits.spirits.length,
    countLabel: 'Bottles',
    noun: 'spirit',
    to: (s) => ({ name: 'spirit-detail', params: { spiritId: s.id } }),
  }),
)

const showCreate = ref(false)
const form = reactive({
  name: '',
  producer: '',
  category: '',
  age_statement: '',
  abv: null as number | null,
  rating: null as number | null,
  notes: '',
})

const categories = ['Whisky', 'Gin', 'Rum', 'Brandy', 'Tequila', 'Vodka', 'Liqueur']

function openCreate(): void {
  Object.assign(form, {
    name: '',
    producer: '',
    category: '',
    age_statement: '',
    abv: null,
    rating: null,
    notes: '',
  })
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
  <IndexTemplate :state="searched && state === 'empty' ? 'ready' : state">
    <template #stage>
      <NxStage
        size="compact"
        eyebrow="Bar cart"
        title="Spirits"
        accent="shelf"
        lede="Whisky, gin, rum and the rest — bottle photos, age statements and AI notes on nose and finish."
      >
        <template #actions>
          <Button rounded severity="contrast" label="Add a bottle" @click="openCreate">
            <template #icon="{ class: iconClass }">
              <NxIcon name="plus" :size="16" :class="iconClass" />
            </template>
          </Button>
        </template>
      </NxStage>
    </template>

    <template v-if="spirits.spirits.length || state === 'loading'" #fields>
      <CollectionFields section="spirits" :fields="fields" />
    </template>

    <template #toolbar>
      <NxSearchField v-model="query" placeholder="Search spirits and distilleries…" :debounce="350" @search="search" />
      <span class="grow" />
      <NexusQuotaBadge :quota="analysis.quota" />
    </template>

    <template #empty>
      <NxEmptyState
        title="The shelf is bare"
        body="Add a bottle and a label photo; AI will fill in the nose, palate and finish."
        icon="spirits"
      >
        <Button rounded label="Add your first bottle" @click="openCreate" />
      </NxEmptyState>
    </template>

    <NxEmptyState
      v-if="!spirits.spirits.length"
      :title="`Nothing matches “${searched}”`"
      body="Try a distillery or a category."
      icon="search"
    />
    <NxCoverGrid v-else :class="{ dim: spirits.spiritsLoading }">
      <NxCoverCard
        v-for="s in spirits.spirits"
        :key="s.id"
        :to="{ name: 'spirit-detail', params: { spiritId: s.id } }"
        :title="s.name"
        :sub="s.producer"
        :meta="[s.category, s.age_statement, s.abv != null ? `${s.abv}%` : null].filter(Boolean).join(' · ')"
        :media="s.media"
        :src="s.image_url"
        :rating="s.rating"
        :badge="s.analysis_status === 'pending' ? 'Analysing' : null"
        icon="spirits"
      />
    </NxCoverGrid>
  </IndexTemplate>

  <Dialog v-model:visible="showCreate" modal header="Add a bottle" style="width: min(480px, 94vw)">
    <form class="nx-form" @submit.prevent="submitCreate">
      <label class="f">
        <span>Name</span>
        <InputText v-model="form.name" autofocus />
      </label>
      <label class="f">
        <span>Distillery</span>
        <InputText v-model="form.producer" />
      </label>
      <div class="row">
        <label class="f">
          <span>Category</span>
          <Select v-model="form.category" :options="categories" editable placeholder="Whisky, gin…" />
        </label>
        <label class="f">
          <span>Age statement</span>
          <InputText v-model="form.age_statement" placeholder="12 years" />
        </label>
      </div>
      <div class="row">
        <label class="f">
          <span>ABV %</span>
          <InputNumber v-model="form.abv" :min-fraction-digits="0" :max-fraction-digits="1" :min="0" :max="100" />
        </label>
        <div class="f">
          <span>Rating</span>
          <NexusRatingInput v-model="form.rating" />
        </div>
      </div>
      <label class="f">
        <span>Notes</span>
        <Textarea v-model="form.notes" rows="3" auto-resize />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showCreate = false" />
      <Button
        label="Save bottle"
        rounded
        :loading="spirits.saving"
        :disabled="!form.name.trim()"
        @click="submitCreate"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.grow {
  flex: 1;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.2s;
}
</style>
