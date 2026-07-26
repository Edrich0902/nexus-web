<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { PairingVerdict } from '@/types/food-drink/food-drink'

const props = defineProps<{
  visible: boolean
  wines: Array<{ id: number; name: string }>
  beers: Array<{ id: number; name: string }>
  recipes: Array<{ id: number; name: string }>
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [
    payload: {
      drinkable_type: 'wine' | 'beer'
      drinkable_id: number
      kitchen_recipe_id: number
      verdict: PairingVerdict
      notes: string | null
    },
  ]
}>()

const form = reactive({
  drinkable_type: 'wine' as 'wine' | 'beer',
  drinkable_id: null as number | null,
  kitchen_recipe_id: null as number | null,
  verdict: 'good' as PairingVerdict,
  notes: '',
})

const drinkOptions = ref<Array<{ id: number; name: string }>>([])

watch(
  () => [props.visible, form.drinkable_type] as const,
  () => {
    drinkOptions.value = form.drinkable_type === 'wine' ? props.wines : props.beers
    form.drinkable_id = null
  },
)

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
    header="Link a pairing"
    style="width: min(440px, 94vw)"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="form">
      <label>Drink type</label>
      <Select
        v-model="form.drinkable_type"
        :options="[
          { label: 'Wine', value: 'wine' },
          { label: 'Beer', value: 'beer' },
        ]"
        option-label="label"
        option-value="value"
      />
      <label>Drink</label>
      <Select
        v-model="form.drinkable_id"
        :options="drinkOptions"
        option-label="name"
        option-value="id"
        placeholder="Select drink"
      />
      <label>Recipe</label>
      <Select
        v-model="form.kitchen_recipe_id"
        :options="recipes"
        option-label="name"
        option-value="id"
        placeholder="Select recipe"
      />
      <label>Verdict</label>
      <Select
        v-model="form.verdict"
        :options="[
          { label: 'Great', value: 'great' },
          { label: 'Good', value: 'good' },
          { label: 'Poor', value: 'poor' },
        ]"
        option-label="label"
        option-value="value"
      />
      <label>Notes</label>
      <Textarea v-model="form.notes" rows="2" auto-resize />
    </div>
    <template #footer>
      <Button label="Cancel" text @click="emit('update:visible', false)" />
      <Button
        label="Save"
        :disabled="!form.drinkable_id || !form.kitchen_recipe_id"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.form label {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.3rem;
}
</style>
