import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSlidesStore } from '../store/slidesStore'
import { updateSlide } from '../api/slides'

const INTERVAL = 30_000

// Auto-save handles CONTENT changes only (element edits, strokes, text).
// Structural operations (add/delete/reorder/rename) are synced immediately
// by SlidePanel, so we never need to create or delete slides here.
export function useAutoSave(deckId) {
  const user      = useAuthStore(s => s.user)
  const slides    = useSlidesStore(s => s.slides)
  const slidesRef = useRef(slides)
  const dirtyRef  = useRef(false)

  useEffect(() => {
    slidesRef.current = slides
    dirtyRef.current  = true
  }, [slides])

  useEffect(() => {
    if (!user || !deckId) return

    const interval = setInterval(async () => {
      if (!dirtyRef.current) return
      dirtyRef.current = false

      for (const slide of slidesRef.current) {
        try {
          await updateSlide(deckId, slide.id, { label: slide.label, elements: slide.elements })
        } catch (err) {
          // If slide doesn't exist on server (e.g. race condition), skip it —
          // structural creation is handled synchronously by SlidePanel.
          if (err.response?.status !== 404) {
            dirtyRef.current = true  // retry next interval on other errors
          }
        }
      }
    }, INTERVAL)

    return () => clearInterval(interval)
  }, [user, deckId])
}
