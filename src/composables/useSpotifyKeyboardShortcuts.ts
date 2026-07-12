import { onMounted, onUnmounted } from 'vue'
import { useSpotifyStore } from '@stores/spotify/spotify.store'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export function useSpotifyKeyboardShortcuts(): void {
  const spotify = useSpotifyStore()

  function onKeydown(event: KeyboardEvent): void {
    if (!spotify.connected) return
    if (isTypingTarget(event.target)) return
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (event.code === 'Space') {
      event.preventDefault()
      void spotify.togglePlayPause()
      return
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault()
      void spotify.previous()
      return
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault()
      void spotify.next()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}
