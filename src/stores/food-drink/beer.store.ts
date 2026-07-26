import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as beerService from '@services/food-drink/beer.service'
import type {
  BeerBeer,
  BeerBrewery,
  BeerStyle,
  BrewerySearchResult,
} from '@/types/food-drink/beer'

export const useBeerStore = defineStore('beer', () => {
  const toast = useToast()
  const beers = ref<BeerBeer[]>([])
  const beersLoading = ref(false)
  const beer = ref<BeerBeer | null>(null)
  const beerLoading = ref(false)
  const styles = ref<BeerStyle[]>([])
  const breweryResults = ref<BrewerySearchResult[]>([])
  const brewery = ref<BeerBrewery | null>(null)
  const saving = ref(false)

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: 'Beer',
      detail: extractApiErrorMessage(error, fallback),
      life: 4000,
    })
  }

  async function loadBeers(q?: string): Promise<void> {
    beersLoading.value = true
    try {
      const page = await beerService.listBeers({ q })
      beers.value = page.data
    } catch (error) {
      beers.value = []
      toastError(error, 'Could not load beers.')
    } finally {
      beersLoading.value = false
    }
  }

  async function loadBeer(id: number): Promise<void> {
    beerLoading.value = true
    try {
      beer.value = await beerService.getBeer(id)
    } catch (error) {
      beer.value = null
      toastError(error, 'Could not load beer.')
    } finally {
      beerLoading.value = false
    }
  }

  async function loadStyles(): Promise<void> {
    styles.value = await beerService.listStyles()
  }

  async function searchBreweries(q: string): Promise<void> {
    try {
      breweryResults.value = await beerService.searchBreweries(q)
    } catch (error) {
      breweryResults.value = []
      toastError(error, 'Could not search breweries.')
    }
  }

  function clearBreweryResults(): void {
    breweryResults.value = []
  }

  async function importBrewery(obdbId: string): Promise<BeerBrewery | null> {
    try {
      return await beerService.importBrewery(obdbId)
    } catch (error) {
      toastError(error, 'Could not import brewery.')
      return null
    }
  }

  async function createManualBrewery(payload: {
    name: string
    city?: string | null
    country?: string | null
  }): Promise<BeerBrewery | null> {
    try {
      return await beerService.createManualBrewery(payload)
    } catch (error) {
      toastError(error, 'Could not create brewery.')
      return null
    }
  }

  async function createBeer(payload: {
    name: string
    beer_brewery_id?: number | null
    beer_style_id?: number | null
    abv?: number | null
    rating?: number | null
    notes?: string | null
    format?: string | null
  }): Promise<BeerBeer | null> {
    saving.value = true
    try {
      const created = await beerService.createBeer(payload)
      toast.add({
        severity: 'success',
        summary: 'Beer',
        detail: 'Beer logged.',
        life: 2500,
      })
      await loadBeers()
      return created
    } catch (error) {
      toastError(error, 'Could not save beer.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function removeBeer(id: number): Promise<boolean> {
    try {
      await beerService.deleteBeer(id)
      return true
    } catch (error) {
      toastError(error, 'Could not delete beer.')
      return false
    }
  }

  async function loadBrewery(id: number): Promise<void> {
    brewery.value = await beerService.getBrewery(id)
  }

  return {
    beers,
    beersLoading,
    beer,
    beerLoading,
    styles,
    breweryResults,
    brewery,
    saving,
    loadBeers,
    loadBeer,
    loadStyles,
    searchBreweries,
    clearBreweryResults,
    importBrewery,
    createManualBrewery,
    createBeer,
    removeBeer,
    loadBrewery,
  }
})
