<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { PairingVerdict } from '@/types/food-drink/food-drink'

type DrinkType = 'wine' | 'beer'

const props = defineProps<{
  visible: boolean
  wines: Array<{ id: number; name: string }>
  beers: Array<{ id: number; name: string }>
  recipes: Array<{ id: number; name: string }>
  /** Prefill from a suggestion. */
  preset?: { drinkable_type: DrinkType; drinkable_id: number; kitchen_recipe_id: number } | null
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [
    payload: {
      drinkable_type: DrinkType
      drinkable_id: number
      kitchen_recipe_id: number
      verdict: PairingVerdict
      notes: string | null
    },
  ]
}>()

const form = reactive({
  drinkable_type: 'wine' as DrinkType,
  drinkable_id: null as number | null,
  kitchen_recipe_id: null as number | null,
  verdict: 'good' as PairingVerdict,
  notes: '',
})

const drinkOptions = computed(() => (form.drinkable_type === 'wine' ? props.wines : props.beers))

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    form.drinkable_type = props.preset?.drinkable_type ?? 'wine'
    form.drinkable_id = props.preset?.drinkable_id ?? null
    form.kitchen_recipe_id = props.preset?.kitchen_recipe_id ?? null
    form.verdict = 'good'
    form.notes = ''
  },
)

function setType(type: DrinkType): void {
  if (type === form.drinkable_type) return
  form.drinkable_type = type
  form.drinkable_id = null
}

function submit(): void {
  if (!form.drinkable_id || !form.kitchen_recipe_id) return
  emit('save', {
    drinkable_type: form.drinkable_type,
    drinkable_id: form.drinkable_id,
    kitchen_recipe_id: form.kitchen_recipe_id,
    verdict: form.verdict,
    notes: form.notes || null,
  })
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Save a pairing"
    style="width: min(460px, 94vw)"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="nx-form" @submit.prevent="submit">
      <div class="f">
        <span>Drink</span>
        <SelectButton
          :model-value="form.drinkable_type"
          :options="[
            { label: 'Wine', value: 'wine' },
            { label: 'Beer', value: 'beer' },
          ]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Drink type"
          @update:model-value="setType"
        />
        <Select
          v-model="form.drinkable_id"
          :options="drinkOptions"
          option-label="name"
          option-value="id"
          filter
          :placeholder="form.drinkable_type === 'wine' ? 'Choose a wine' : 'Choose a beer'"
          aria-label="Drink"
        />
      </div>
      <label class="f">
        <span>Recipe</span>
        <Select
          v-model="form.kitchen_recipe_id"
          :options="recipes"
          option-label="name"
          option-value="id"
          filter
          placeholder="Choose a recipe"
        />
      </label>
      <div class="f">
        <span>Verdict</span>
        <SelectButton
          v-model="form.verdict"
          :options="[
            { label: 'Great', value: 'great' },
            { label: 'Good', value: 'good' },
            { label: 'Poor', value: 'poor' },
          ]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Verdict"
        />
      </div>
      <label class="f">
        <span>Notes</span>
        <Textarea v-model="form.notes" rows="2" auto-resize placeholder="What made it work (or not)?" />
      </label>
    </form>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="emit('update:visible', false)" />
      <Button
        label="Save pairing"
        rounded
        :loading="saving"
        :disabled="!form.drinkable_id || !form.kitchen_recipe_id"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
