import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as kitchenService from '@services/food-drink/kitchen.service'
import type {
  KitchenFilters,
  KitchenRecipe,
  MealDetail,
  MealSummary,
} from '@/types/food-drink/kitchen'

export const useKitchenStore = defineStore('kitchen', () => {
  const toast = useToast()

  const recipes = ref<KitchenRecipe[]>([])
  const recipesLoading = ref(false)
  const recipe = ref<KitchenRecipe | null>(null)
  const recipeLoading = ref(false)
  const discover = ref<MealSummary[]>([])
  const discoverLoading = ref(false)
  const filters = ref<KitchenFilters | null>(null)
  const randomMeal = ref<MealDetail | null>(null)
  const previewMeal = ref<MealDetail | null>(null)
  const previewLoading = ref(false)
  const saving = ref(false)

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: 'Kitchen',
      detail: extractApiErrorMessage(error, fallback),
      life: 4000,
    })
  }

  async function loadRecipes(params?: { q?: string; favourite?: boolean }): Promise<void> {
    recipesLoading.value = true
    try {
      const page = await kitchenService.listRecipes(params)
      recipes.value = page.data
    } catch (error) {
      recipes.value = []
      toastError(error, 'Could not load recipes.')
    } finally {
      recipesLoading.value = false
    }
  }

  async function loadRecipe(id: number): Promise<void> {
    recipeLoading.value = true
    try {
      recipe.value = await kitchenService.getRecipe(id)
    } catch (error) {
      recipe.value = null
      toastError(error, 'Could not load recipe.')
    } finally {
      recipeLoading.value = false
    }
  }

  async function searchDiscover(q: string): Promise<void> {
    discoverLoading.value = true
    try {
      discover.value = await kitchenService.searchMeals(q)
    } catch (error) {
      discover.value = []
      toastError(error, 'Search failed.')
    } finally {
      discoverLoading.value = false
    }
  }

  async function browseDiscover(params?: {
    category?: string
    area?: string
  }): Promise<void> {
    discoverLoading.value = true
    try {
      discover.value = await kitchenService.browseMeals(params)
    } catch (error) {
      discover.value = []
      toastError(error, 'Browse failed.')
    } finally {
      discoverLoading.value = false
    }
  }

  async function loadFilters(): Promise<void> {
    try {
      filters.value = await kitchenService.getFilters()
    } catch {
      filters.value = null
    }
  }

  async function loadRandom(): Promise<void> {
    try {
      randomMeal.value = await kitchenService.getRandomMeal()
    } catch (error) {
      toastError(error, 'Could not fetch a random meal.')
    }
  }

  async function loadMealPreview(mealdbId: string): Promise<void> {
    previewLoading.value = true
    try {
      previewMeal.value = await kitchenService.getMeal(mealdbId)
    } catch (error) {
      previewMeal.value = null
      toastError(error, 'Could not load meal details.')
    } finally {
      previewLoading.value = false
    }
  }

  async function saveMeal(mealdbId: string): Promise<KitchenRecipe | null> {
    saving.value = true
    try {
      const saved = await kitchenService.saveRecipe({ mealdb_id: mealdbId })
      toast.add({
        severity: 'success',
        summary: 'Kitchen',
        detail: 'Recipe saved.',
        life: 2500,
      })
      await loadRecipes()
      return saved
    } catch (error) {
      toastError(error, 'Could not save recipe.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateRecipe(
    id: number,
    payload: Partial<{ rating: number | null; notes: string | null; is_favourite: boolean }>,
  ): Promise<void> {
    recipe.value = await kitchenService.updateRecipe(id, payload)
  }

  async function markCooked(id: number): Promise<void> {
    recipe.value = await kitchenService.markCooked(id)
  }

  async function removeRecipe(id: number): Promise<boolean> {
    try {
      await kitchenService.deleteRecipe(id)
      return true
    } catch (error) {
      toastError(error, 'Could not delete recipe.')
      return false
    }
  }

  return {
    recipes,
    recipesLoading,
    recipe,
    recipeLoading,
    discover,
    discoverLoading,
    filters,
    randomMeal,
    previewMeal,
    previewLoading,
    saving,
    loadRecipes,
    loadRecipe,
    searchDiscover,
    browseDiscover,
    loadFilters,
    loadRandom,
    loadMealPreview,
    saveMeal,
    updateRecipe,
    markCooked,
    removeRecipe,
  }
})
