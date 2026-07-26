import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as foodDrinkService from '@services/food-drink/food-drink.service'
import type {
  FoodDrinkDashboard,
  FoodDrinkPairing,
  FoodDrinkSuggestion,
} from '@/types/food-drink/food-drink'
import type { PairingVerdict } from '@/types/food-drink/food-drink'

export const useFoodDrinkStore = defineStore('food-drink', () => {
  const toast = useToast()
  const dashboard = ref<FoodDrinkDashboard | null>(null)
  const dashboardLoading = ref(false)
  const pairings = ref<FoodDrinkPairing[]>([])
  const pairingsLoading = ref(false)
  const suggestions = ref<FoodDrinkSuggestion[]>([])

  async function loadDashboard(): Promise<void> {
    dashboardLoading.value = true
    try {
      dashboard.value = await foodDrinkService.getDashboard()
    } catch (error) {
      dashboard.value = null
      toast.add({
        severity: 'error',
        summary: 'Food & Drink',
        detail: extractApiErrorMessage(error, 'Could not load dashboard.'),
        life: 4000,
      })
    } finally {
      dashboardLoading.value = false
    }
  }

  async function loadPairings(): Promise<void> {
    pairingsLoading.value = true
    try {
      pairings.value = await foodDrinkService.listPairings()
    } catch (error) {
      pairings.value = []
      toast.add({
        severity: 'error',
        summary: 'Food & Drink',
        detail: extractApiErrorMessage(error, 'Could not load pairings.'),
        life: 4000,
      })
    } finally {
      pairingsLoading.value = false
    }
  }

  async function loadSuggestions(): Promise<void> {
    suggestions.value = await foodDrinkService.getSuggestions()
  }

  async function createPairing(payload: {
    drinkable_type: 'wine' | 'beer'
    drinkable_id: number
    kitchen_recipe_id: number
    verdict?: PairingVerdict
    notes?: string | null
  }): Promise<void> {
    await foodDrinkService.createPairing(payload)
    await loadPairings()
    await loadDashboard()
  }

  async function removePairing(id: number): Promise<void> {
    await foodDrinkService.deletePairing(id)
    await loadPairings()
  }

  return {
    dashboard,
    dashboardLoading,
    pairings,
    pairingsLoading,
    suggestions,
    loadDashboard,
    loadPairings,
    loadSuggestions,
    createPairing,
    removePairing,
  }
})
