import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as libraryService from '@services/library/library.service'
import type {
  LibraryBook,
  LibraryCandidatesResponse,
  LibrarySearchResult,
  StoreLibraryBookPayload,
} from '@/types/library/library'

export const useLibraryStore = defineStore('library', () => {
  const toast = useToast()

  const books = ref<LibraryBook[]>([])
  const booksLoading = ref(false)
  const booksTotal = ref(0)
  const book = ref<LibraryBook | null>(null)
  const bookLoading = ref(false)
  const catalogResults = ref<LibrarySearchResult[]>([])
  const candidates = ref<LibraryCandidatesResponse | null>(null)
  const candidatesLoading = ref(false)
  const saving = ref(false)

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: 'Library',
      detail: extractApiErrorMessage(error, fallback),
      life: 4000,
    })
  }

  async function loadBooks(params?: {
    q?: string
    status?: string
    page?: number
  }): Promise<void> {
    booksLoading.value = true
    try {
      const page = await libraryService.listBooks({
        ...params,
        per_page: 24,
      })
      books.value = page.data
      booksTotal.value = page.meta?.total ?? page.data.length
    } catch (error) {
      books.value = []
      toastError(error, 'Could not load books.')
    } finally {
      booksLoading.value = false
    }
  }

  async function loadBook(id: number): Promise<void> {
    bookLoading.value = true
    try {
      book.value = await libraryService.getBook(id)
    } catch (error) {
      book.value = null
      toastError(error, 'Could not load book.')
    } finally {
      bookLoading.value = false
    }
  }

  async function createBook(
    payload: StoreLibraryBookPayload,
  ): Promise<LibraryBook | null> {
    saving.value = true
    try {
      const created = await libraryService.createBook(payload)
      toast.add({
        severity: 'success',
        summary: 'Library',
        detail: 'Book added to your shelf.',
        life: 2500,
      })
      await loadBooks()
      return created
    } catch (error) {
      toastError(error, 'Could not save book.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function createFromCatalog(payload: {
    ol_work_key: string
  } & Partial<StoreLibraryBookPayload>): Promise<LibraryBook | null> {
    saving.value = true
    try {
      const created = await libraryService.createBookFromCatalog(payload)
      toast.add({
        severity: 'success',
        summary: 'Library',
        detail: 'Book added from Open Library.',
        life: 2500,
      })
      await loadBooks()
      return created
    } catch (error) {
      toastError(error, 'Could not import book.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateBook(
    id: number,
    payload: Partial<StoreLibraryBookPayload>,
  ): Promise<void> {
    saving.value = true
    try {
      book.value = await libraryService.updateBook(id, payload)
      toast.add({
        severity: 'success',
        summary: 'Library',
        detail: 'Book updated.',
        life: 2500,
      })
    } catch (error) {
      toastError(error, 'Could not update book.')
    } finally {
      saving.value = false
    }
  }

  async function removeBook(id: number): Promise<boolean> {
    try {
      await libraryService.deleteBook(id)
      toast.add({
        severity: 'success',
        summary: 'Library',
        detail: 'Book removed.',
        life: 2500,
      })
      return true
    } catch (error) {
      toastError(error, 'Could not delete book.')
      return false
    }
  }

  async function searchCatalog(q: string): Promise<void> {
    try {
      catalogResults.value = await libraryService.searchCatalog(q)
    } catch (error) {
      catalogResults.value = []
      toastError(error, 'Could not search Open Library.')
    }
  }

  function clearCatalogResults(): void {
    catalogResults.value = []
  }

  async function fetchCandidates(bookId: number, q?: string): Promise<void> {
    candidatesLoading.value = true
    try {
      candidates.value = await libraryService.getCandidates(bookId, q)
    } catch (error) {
      candidates.value = null
      toastError(error, 'Could not search Open Library.')
    } finally {
      candidatesLoading.value = false
    }
  }

  async function confirmMatch(bookId: number, olWorkKey: string): Promise<void> {
    saving.value = true
    try {
      book.value = await libraryService.confirmMatch(bookId, olWorkKey)
      toast.add({
        severity: 'success',
        summary: 'Library',
        detail: 'Book matched to Open Library.',
        life: 3000,
      })
    } catch (error) {
      toastError(error, 'Could not confirm match.')
    } finally {
      saving.value = false
    }
  }

  async function markNoMatch(bookId: number): Promise<void> {
    book.value = await libraryService.markNoMatch(bookId)
  }

  return {
    books,
    booksLoading,
    booksTotal,
    book,
    bookLoading,
    catalogResults,
    candidates,
    candidatesLoading,
    saving,
    loadBooks,
    loadBook,
    createBook,
    createFromCatalog,
    updateBook,
    removeBook,
    searchCatalog,
    clearCatalogResults,
    fetchCandidates,
    confirmMatch,
    markNoMatch,
  }
})
